const Booking = require('../models/Booking');
const Tenant = require('../models/Tenant');
const Room = require('../models/Room');
const RoomConfigurationType = require('../models/RoomConfigurationType');
const mongoose = require('mongoose');

// Get all bookings
const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('tenant');
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a booking
const addBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { 
      tenantId, 
      roomId, 
      startDate, 
      endDate, 
      bookingType, 
      monthlyCyclePreference, 
      customRentAmount, 
      securityDepositAmountOverride, 
      notes 
    } = req.body;

    if (!tenantId || !roomId || !startDate || !bookingType) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Missing required fields: tenantId, roomId, startDate, bookingType' });
    }
    
    if (bookingType === 'monthly' && !monthlyCyclePreference) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Missing required field for monthly booking: monthlyCyclePreference' });
    }
    
    let sDate = new Date(startDate);
    sDate.setHours(0, 0, 0, 0); // Normalize to start of day

    let eDate = endDate ? new Date(endDate) : null;
    if (eDate) {
      eDate.setHours(23, 59, 59, 999); // Normalize to end of day
    }

    const tenant = await Tenant.findById(tenantId).session(session);
    if (!tenant) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const room = await Room.findById(roomId).populate('roomConfigurationType').session(session);
    if (!room) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.roomConfigurationType) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Room is not configured. Please assign a configuration type to the room first.' });
    }

    const roomConfig = room.roomConfigurationType;
    let calculatedRentInternal;
    let finalRentForBooking;
    let rentDetailsToStore = { 
      rentType: bookingType, 
      proRated: false,
      customRentProvided: (customRentAmount !== undefined && customRentAmount !== null && !isNaN(parseFloat(customRentAmount))) ? parseFloat(customRentAmount) : null,
    };
    let bookingEndDateToUse = eDate;

    // Update tenant's cycle preference if provided and different, or if not set
    if (bookingType === 'monthly' && (tenant.monthlyRentCyclePreference !== monthlyCyclePreference || !tenant.monthlyRentCyclePreference)) {
        tenant.monthlyRentCyclePreference = monthlyCyclePreference;
    }
    // Update tenant's accommodation type if it's different or not set
    if (tenant.accommodationType !== bookingType) {
        tenant.accommodationType = bookingType;
    }


    // Security Deposit Handling (for monthly tenants)
    // Collect/update security deposit if:
    // 1. It's a monthly booking.
    // 2. An override amount is provided OR (the tenant's current deposit is 0 AND no override is provided).
    if (bookingType === 'monthly') {
      const currentSecurityDeposit = tenant.securityDeposit && tenant.securityDeposit.amount ? tenant.securityDeposit.amount : 0;
      const defaultDeposit = roomConfig.baseRent; // One month's base rent

      if (securityDepositAmountOverride !== undefined && securityDepositAmountOverride !== null && !isNaN(parseFloat(securityDepositAmountOverride))) {
        tenant.securityDeposit.amount = parseFloat(securityDepositAmountOverride);
      } else if (currentSecurityDeposit === 0) {
        tenant.securityDeposit.amount = defaultDeposit;
      }
      // tenant.securityDeposit.refundableType = 'fully'; // Default or from req.body if added
      // tenant.securityDeposit.conditions = 'Standard conditions'; // Default or from req.body if added
    }
    
    await tenant.save({ session }); // Save tenant changes (cycle pref, accommodation type, security deposit)


    if (bookingType === 'daily') {
      if (!eDate) {
        await session.abortTransaction(); session.endSession();
        return res.status(400).json({ error: 'End date is required for daily bookings.' });
      }
      if (sDate >= eDate) {
        await session.abortTransaction(); session.endSession();
        return res.status(400).json({ error: 'End date must be after start date for daily bookings.' });
      }
      // For daily, number of days is inclusive of start and end date.
      // Example: Jan 1 to Jan 1 is 1 day. Jan 1 to Jan 2 is 2 days.
      const numberOfDays = Math.ceil((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)) +1;
      if (numberOfDays <= 0) { // Should be at least 1 day
        await session.abortTransaction(); session.endSession();
        return res.status(400).json({ error: 'Daily booking must be for at least one day.' });
      }
      calculatedRentInternal = roomConfig.dailyRate * numberOfDays;
      rentDetailsToStore = {
        ...rentDetailsToStore,
        dailyRate: roomConfig.dailyRate,
        numberOfDays: numberOfDays,
      };
      bookingEndDateToUse = eDate; // endDate is directly used for daily
    } else if (bookingType === 'monthly') {
      const effectiveCyclePreference = tenant.monthlyRentCyclePreference; // Already updated on tenant

      if (effectiveCyclePreference === 'calendarMonth') {
        const isFirstDayOfMonth = sDate.getDate() === 1;
        
        if (!isFirstDayOfMonth) { // Pro-rata for the first partial month
          // Booking for the remainder of the current month
          bookingEndDateToUse = new Date(sDate.getFullYear(), sDate.getMonth() + 1, 0); // Last day of current month
          bookingEndDateToUse.setHours(23,59,59,999); // Normalize

          const daysInPartialMonth = bookingEndDateToUse.getDate() - sDate.getDate() + 1;
          const totalDaysInBillingMonth = new Date(sDate.getFullYear(), sDate.getMonth() + 1, 0).getDate();
          
          if (daysInPartialMonth <= 0) {
             await session.abortTransaction(); session.endSession();
             return res.status(400).json({ error: 'Invalid date range for pro-rata calculation. Start date might be end of month.' });
          }

          calculatedRentInternal = Math.round((daysInPartialMonth / totalDaysInBillingMonth) * roomConfig.baseRent);
          rentDetailsToStore = {
            ...rentDetailsToStore,
            monthlyRate: roomConfig.baseRent, // Store the full monthly rate for reference
            proRated: true,
            originalMonthlyRate: roomConfig.baseRent,
            daysInPartialMonth: daysInPartialMonth,
            totalDaysInBillingMonth: totalDaysInBillingMonth,
            numberOfMonths: 0 // This booking covers a partial month
          };
        } else { // Full month starting from 1st
           if (!eDate) { // endDate is required to determine number of full months
            await session.abortTransaction(); session.endSession();
            return res.status(400).json({ error: 'End date is required for full month calendar bookings to determine duration.' });
          }
          if (sDate >= eDate) {
            await session.abortTransaction(); session.endSession();
            return res.status(400).json({ error: 'End date must be after start date for monthly bookings.' });
          }

          let monthsCount = (eDate.getFullYear() - sDate.getFullYear()) * 12;
          monthsCount -= sDate.getMonth();
          monthsCount += eDate.getMonth();
          // If eDate is not the end of its month, it's not a full month yet.
          // For calendar month, we expect eDate to be end of a month.
          // Example: Jan 1 to Jan 31 is 1 month. Jan 1 to Feb 28 is 2 months.
          // A simple way: count how many full first-of-month to last-of-month periods.
          let tempStartDate = new Date(sDate);
          let fullMonths = 0;
          while(tempStartDate < eDate) {
              let monthEnd = new Date(tempStartDate.getFullYear(), tempStartDate.getMonth() + 1, 0);
              monthEnd.setHours(23,59,59,999);
              if (monthEnd <= eDate) {
                  fullMonths++;
                  tempStartDate.setMonth(tempStartDate.getMonth() + 1);
                  tempStartDate.setDate(1); // Move to start of next month
              } else {
                  break; // eDate is before the end of the current cycle
              }
          }
          
          if (fullMonths <= 0) { // Should be at least one full month if not pro-rata
            await session.abortTransaction(); session.endSession();
            return res.status(400).json({ error: 'Monthly booking (calendar cycle, non-pro-rata) must span at least one full month.' });
          }
          calculatedRentInternal = roomConfig.baseRent * fullMonths;
          rentDetailsToStore = {
            ...rentDetailsToStore,
            monthlyRate: roomConfig.baseRent,
            numberOfMonths: fullMonths,
          };
          // For full calendar months, bookingEndDateToUse is the provided eDate, assuming it's a month-end.
          // Add validation if eDate for full calendar month is not a month end? Or assume client sends correct.
          // For now, we use the eDate provided by the user.
          bookingEndDateToUse = eDate;
        }
      } else { // moveInDate cycle preference
        if (!eDate) {
            await session.abortTransaction(); session.endSession();
            return res.status(400).json({ error: 'End date is required for move-in date cycle monthly bookings.' });
        }
        if (sDate >= eDate) {
            await session.abortTransaction(); session.endSession();
            return res.status(400).json({ error: 'End date must be after start date for monthly bookings.' });
        }

        let monthsCount = 0;
        let currentCycleStart = new Date(sDate);
        let currentCycleEnd = new Date(sDate);
        currentCycleEnd.setMonth(currentCycleEnd.getMonth() + 1);
        currentCycleEnd.setDate(currentCycleEnd.getDate() - 1);
        currentCycleEnd.setHours(23,59,59,999);


        while (currentCycleEnd <= eDate) {
            monthsCount++;
            currentCycleStart.setMonth(currentCycleStart.getMonth() + 1);
            currentCycleEnd = new Date(currentCycleStart);
            currentCycleEnd.setMonth(currentCycleEnd.getMonth() + 1);
            currentCycleEnd.setDate(currentCycleEnd.getDate() - 1);
            currentCycleEnd.setHours(23,59,59,999);

            if (monthsCount > 600) { // Safety break for ~50 years
                await session.abortTransaction(); session.endSession();
                console.error("Error calculating months for moveInDate cycle: Exceeded 600 months.");
                return res.status(500).json({ error: "Error calculating months. Duration too long or invalid."});
            }
        }
        
        if (monthsCount <= 0) {
          await session.abortTransaction(); session.endSession();
          return res.status(400).json({ error: 'Monthly booking (moveInDate cycle) must span at least one full cycle based on provided end date.' });
        }
        calculatedRentInternal = roomConfig.baseRent * monthsCount;
        rentDetailsToStore = {
          ...rentDetailsToStore,
          monthlyRate: roomConfig.baseRent,
          numberOfMonths: monthsCount,
        };
        // For moveInDate cycle, the bookingEndDateToUse is the provided eDate,
        // assuming it aligns with a cycle end or is handled by pro-rata on vacation (later feature).
        bookingEndDateToUse = eDate;
      }
    } else {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Invalid booking type. Must be "daily" or "monthly".' });
    }

    finalRentForBooking = (rentDetailsToStore.customRentProvided !== null)
                       ? rentDetailsToStore.customRentProvided
                       : calculatedRentInternal;
    
    rentDetailsToStore.calculatedRent = calculatedRentInternal;
    rentDetailsToStore.finalRentAmount = finalRentForBooking;

    // Validate bookingEndDateToUse before creating booking
    if (!bookingEndDateToUse || sDate >= bookingEndDateToUse) {
        // Exception for daily bookings where sDate can be same as eDate for 1 day booking, handled by numberOfDays logic.
        // For monthly, sDate must be less than bookingEndDateToUse.
        if (bookingType === 'monthly' || (bookingType === 'daily' && rentDetailsToStore.numberOfDays <=0) ) {
            await session.abortTransaction(); session.endSession();
            console.error("Validation Error: bookingEndDateToUse is invalid.", {sDate, bookingEndDateToUse, bookingType, rentDetailsToStore});
            return res.status(400).json({ error: 'Calculated booking end date is invalid or not set.' });
        }
    }


    const newBooking = new Booking({
      tenant: tenantId,
      room: room._id, // Store room ID
      startDate: sDate,
      endDate: bookingEndDateToUse, 
      accommodationType: bookingType, // This is booking's type, tenant.accommodationType is tenant's general type
      rentAmount: finalRentForBooking,
      rentDetails: rentDetailsToStore,
      rentPaidStatus: 'due', 
      status: 'Upcoming', // Set initial status to Upcoming
      rentDueDate: sDate, // Rent for the period starting sDate is due on sDate
      notes: notes || '',
    });

    await newBooking.save({ session });

    // Update tenant's current room association and status
    // tenant.room = room.name; // This was moved to tenantController
    tenant.status = 'Active'; // Set tenant to active when a booking is made
    await tenant.save({ session });

    // Increment room occupancy
    room.currentOccupancy = (room.currentOccupancy || 0) + 1;
    await room.save({ session });

    await session.commitTransaction();
    session.endSession();
    
    const populatedBooking = await Booking.findById(newBooking._id)
        .populate('tenant', 'name contact email')
        .populate({
            path: 'room',
            select: 'name roomNumber', // Select fields from Room model
            populate: {
                path: 'roomConfigurationType',
                select: 'name baseSharingCapacity baseRent dailyRate' // Select fields from RoomConfigurationType
            }
        })
        .lean();

    res.status(201).json(populatedBooking);

  } catch (error) {
    if (session.inTransaction()) {
        await session.abortTransaction();
    }
    session.endSession();
    console.error("Error in addBooking:", error);
    res.status(500).json({ error: "An unexpected error occurred: " + error.message, details: error.stack });
  }
};

// Get a single booking by ID
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('tenant').populate('room');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a booking
const updateBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { endDate, actualVacationDate, notes, rentPaidStatus, status } = req.body; // Added status to destructuring

    const bookingToUpdate = await Booking.findById(id).populate('tenant').populate('room').session(session); // Renamed to bookingToUpdate

    if (!bookingToUpdate) { // Changed to bookingToUpdate
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Booking not found' });
    }

    const tenantForUpdate = bookingToUpdate.tenant; // Renamed to tenantForUpdate
    if (!tenantForUpdate) { // Changed to tenantForUpdate
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ error: 'Tenant not found for this booking' });
    }
    
    // Ensure bookingToUpdate.room is populated before accessing its properties
    if (!bookingToUpdate.room || !bookingToUpdate.room.roomConfigurationType) {
        await session.abortTransaction(); session.endSession();
        // It's possible bookingToUpdate.room is just an ID if not populated correctly, 
        // or roomConfigurationType is missing on the populated room.
        // Attempt to fetch room data if not fully populated or handle error.
        let detailedRoomData = bookingToUpdate.room;
        if (typeof bookingToUpdate.room === 'string' || !bookingToUpdate.room.roomConfigurationType) {
            detailedRoomData = await Room.findById(bookingToUpdate.room._id || bookingToUpdate.room).populate('roomConfigurationType').session(session);
        }

        if (!detailedRoomData || !detailedRoomData.roomConfigurationType) {
            return res.status(400).json({ error: 'Room or Room Configuration not found for this booking' });
        }
        // If we had to fetch it, assign it back for subsequent use, though it's better if populate works consistently.
        // For safety, let's use detailedRoomData directly in this block.
        const roomConfigForUpdate = detailedRoomData.roomConfigurationType; // Renamed
        const originalMonthlyRateForUpdate = bookingToUpdate.rentDetails.originalMonthlyRate || bookingToUpdate.rentDetails.monthlyRate || roomConfigForUpdate.baseRent; // Renamed
    } else {
        // This block executes if bookingToUpdate.room and bookingToUpdate.room.roomConfigurationType are already populated.
        const roomConfigForUpdate = bookingToUpdate.room.roomConfigurationType; // Renamed
        const originalMonthlyRateForUpdate = bookingToUpdate.rentDetails.originalMonthlyRate || bookingToUpdate.rentDetails.monthlyRate || roomConfigForUpdate.baseRent; // Renamed
    }

    // The variables roomDataFromBooking and roomConfigFromBooking should be used below instead of roomData and roomConfig
    const roomDataFromBooking = bookingToUpdate.room; // Use the populated room object
    if (!roomDataFromBooking || !roomDataFromBooking.roomConfigurationType) {
        await session.abortTransaction(); session.endSession();
        return res.status(400).json({ error: 'Room or Room Configuration not found for this booking. Population failed.' });
    }
    const roomConfigFromBooking = roomDataFromBooking.roomConfigurationType;
    const originalMonthlyRate = bookingToUpdate.rentDetails.originalMonthlyRate || bookingToUpdate.rentDetails.monthlyRate || roomConfigFromBooking.baseRent;

    let newEndDate = endDate ? new Date(endDate) : null;
    if (newEndDate) newEndDate.setHours(23, 59, 59, 999);
    
    let vacationDate = actualVacationDate ? new Date(actualVacationDate) : null;
    if (vacationDate) vacationDate.setHours(23, 59, 59, 999);

    if (bookingToUpdate.accommodationType === 'monthly' && vacationDate && vacationDate < bookingToUpdate.endDate) {
      let calculatedProRataRentForFinalPeriod = 0;
      let daysStayedInFinalPeriod = 0;
      let totalDaysInFinalBillingCycle = 0;
      let proRatedForEarlyVacation = false;

      const originalBookingStartDate = new Date(bookingToUpdate.startDate);
      originalBookingStartDate.setHours(0,0,0,0);

      if (tenantForUpdate.monthlyRentCyclePreference === 'calendarMonth') { // Changed to tenantForUpdate
        const vacationMonthStart = new Date(vacationDate.getFullYear(), vacationDate.getMonth(), 1);
        const vacationMonthEnd = new Date(vacationDate.getFullYear(), vacationDate.getMonth() + 1, 0);
        vacationMonthEnd.setHours(23,59,59,999);

        if (vacationDate >= vacationMonthStart && bookingToUpdate.startDate <= vacationMonthEnd) {
            daysStayedInFinalPeriod = vacationDate.getDate();
            totalDaysInFinalBillingCycle = vacationMonthEnd.getDate();
            
            if (daysStayedInFinalPeriod > 0 && daysStayedInFinalPeriod <= totalDaysInFinalBillingCycle) {
                calculatedProRataRentForFinalPeriod = Math.round((daysStayedInFinalPeriod / totalDaysInFinalBillingCycle) * originalMonthlyRate);
                proRatedForEarlyVacation = true;
            }
        }
      } else { // moveInDate cycle preference
        let cycleStart = new Date(originalBookingStartDate);
        let cycleEnd = new Date(cycleStart);
        cycleEnd.setMonth(cycleEnd.getMonth() + 1);
        cycleEnd.setDate(cycleEnd.getDate() - 1);
        cycleEnd.setHours(23,59,59,999);

        while(cycleEnd < vacationDate && cycleEnd < bookingToUpdate.endDate) {
            cycleStart.setMonth(cycleStart.getMonth() + 1);
            cycleEnd = new Date(cycleStart);
            cycleEnd.setMonth(cycleEnd.getMonth() + 1);
            cycleEnd.setDate(cycleEnd.getDate() - 1);
            cycleEnd.setHours(23,59,59,999);
        }
        if (vacationDate >= cycleStart && vacationDate <= cycleEnd) {
            daysStayedInFinalPeriod = Math.ceil((vacationDate.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24)) +1;
            totalDaysInFinalBillingCycle = Math.ceil((cycleEnd.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24)) +1;

            if (daysStayedInFinalPeriod > 0 && daysStayedInFinalPeriod <= totalDaysInFinalBillingCycle) {
                calculatedProRataRentForFinalPeriod = Math.round((daysStayedInFinalPeriod / totalDaysInFinalBillingCycle) * originalMonthlyRate);
                proRatedForEarlyVacation = true;
            }
        }
      }

      if (proRatedForEarlyVacation) {
        let numberOfFullMonthsCompleted = 0;
        let counterDate = new Date(originalBookingStartDate);

        if (bookingToUpdate.rentDetails.proRated && tenantForUpdate.monthlyRentCyclePreference === 'calendarMonth' &&  // Changed to bookingToUpdate & tenantForUpdate
            originalBookingStartDate.getMonth() === vacationDate.getMonth() && 
            originalBookingStartDate.getFullYear() === vacationDate.getFullYear()) {
            
            daysStayedInFinalPeriod = vacationDate.getDate() - originalBookingStartDate.getDate() + 1;
            totalDaysInFinalBillingCycle = bookingToUpdate.rentDetails.totalDaysInBillingMonth; // Changed to bookingToUpdate
            calculatedProRataRentForFinalPeriod = Math.round((daysStayedInFinalPeriod / totalDaysInFinalBillingCycle) * originalMonthlyRate);
            bookingToUpdate.rentAmount = calculatedProRataRentForFinalPeriod; // Changed to bookingToUpdate
            bookingToUpdate.rentDetails.finalRentAmount = calculatedProRataRentForFinalPeriod; // Changed to bookingToUpdate
            bookingToUpdate.rentDetails.daysInPartialMonth = daysStayedInFinalPeriod;
        } else {
            if (tenantForUpdate.monthlyRentCyclePreference === 'calendarMonth') { // Changed to tenantForUpdate
                while(true) {
                    let monthEnd = new Date(counterDate.getFullYear(), counterDate.getMonth() + 1, 0);
                    monthEnd.setHours(23,59,59,999);
                    if (monthEnd < vacationDate) {
                        numberOfFullMonthsCompleted++;
                        counterDate.setMonth(counterDate.getMonth() + 1);
                        counterDate.setDate(1);
                    } else {
                        break;
                    }
                }
            } else { // moveInDate
                while(true) {
                    let cycleEndCheck = new Date(counterDate);
                    cycleEndCheck.setMonth(cycleEndCheck.getMonth() + 1);
                    cycleEndCheck.setDate(cycleEndCheck.getDate() - 1);
                    cycleEndCheck.setHours(23,59,59,999);
                    if (cycleEndCheck < vacationDate) {
                        numberOfFullMonthsCompleted++;
                        counterDate.setMonth(counterDate.getMonth() + 1);
                    } else {
                        break;
                    }
                }
            }

            let fullMonthsCompletedRent = numberOfFullMonthsCompleted * originalMonthlyRate;
            bookingToUpdate.rentAmount = fullMonthsCompletedRent + calculatedProRataRentForFinalPeriod; // Changed to bookingToUpdate
            bookingToUpdate.rentDetails.finalRentAmount = bookingToUpdate.rentAmount; // Changed to bookingToUpdate
            bookingToUpdate.rentDetails.numberOfMonths = numberOfFullMonthsCompleted;
            bookingToUpdate.rentDetails.proRated = true;
            bookingToUpdate.rentDetails.originalMonthlyRate = originalMonthlyRate;
            bookingToUpdate.rentDetails.daysInPartialMonth = daysStayedInFinalPeriod;
            bookingToUpdate.rentDetails.totalDaysInBillingMonth = totalDaysInFinalBillingCycle;
        }
        bookingToUpdate.endDate = vacationDate; // Changed to bookingToUpdate
      }
    }

    // Update other fields if provided
    if (newEndDate && !vacationDate) bookingToUpdate.endDate = newEndDate; // Changed to bookingToUpdate
    if (notes) bookingToUpdate.notes = notes; // Changed to bookingToUpdate
    if (rentPaidStatus) bookingToUpdate.rentPaidStatus = rentPaidStatus; // Changed to bookingToUpdate
    if (status) bookingToUpdate.status = status; // Update booking status if provided

    const updatedBooking = await bookingToUpdate.save({ session }); // Changed to bookingToUpdate
    await session.commitTransaction();
    session.endSession();

    res.status(200).json(updatedBooking);

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error("Error in updateBooking:", error);
    res.status(400).json({ error: error.message, details: error.stack });
  }
};

// Delete a booking
const deleteBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).session(session);

    if (!booking) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Booking not found' });
    }

    const tenant = await Tenant.findById(booking.tenant).session(session);
    const room = await Room.findById(booking.room).session(session);

    // If the booking was active or upcoming and affected room occupancy
    if ((booking.status === 'Active' || booking.status === 'Upcoming') && room && room.currentOccupancy > 0) {
      room.currentOccupancy -= 1;
      await room.save({ session });
    }

    // If this was the tenant's only active/upcoming booking, consider tenant status
    if (tenant) {
      const otherBookings = await Booking.find({ 
        tenant: tenant._id, 
        _id: { $ne: booking._id },
        status: { $in: ['Active', 'Upcoming', 'Ongoing'] } // Consider various active-like statuses
      }).session(session);

      if (otherBookings.length === 0) {
        // Optionally set tenant to Inactive or some other status if no other active bookings
        // tenant.status = 'Inactive'; // Or based on business logic
        // tenant.room = ''; // Clear room association if it was from this booking
        // await tenant.save({ session });
      }
    }

    await Booking.findByIdAndDelete(id, { session }); // Use findByIdAndDelete

    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ message: 'Booking deleted successfully' });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error("Error in deleteBooking:", error);
    res.status(500).json({ error: 'An unexpected error occurred: ' + error.message });
  }
};

module.exports = {
  getBookings,
  addBooking,
  getBookingById,
  updateBooking,
  deleteBooking,
};
