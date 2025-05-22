const Booking = require('../models/Booking');
const Tenant = require('../models/Tenant');
const Room = require('../models/Room');
const RoomConfigurationType = require('../models/RoomConfigurationType');
const mongoose = require('mongoose');

// Helper function to get the number of days in a month
const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

// Get all bookings
exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('tenant');
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a booking
exports.addBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { tenantId, roomId, startDate, endDate, bookingType, customRent, isProRataToMonthEnd, notes } = req.body; // Added isProRataToMonthEnd

    if (!tenantId || !roomId || !startDate || !endDate || !bookingType) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Missing required fields: tenantId, roomId, startDate, endDate, bookingType' });
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
      return res.status(400).json({ error: 'Room is not configured with a RoomConfigurationType. Please assign a configuration to the room first.' });
    }

    const roomConfig = room.roomConfigurationType;
    let calculatedRent;
    let rentDetailsPayload = { rentType: bookingType }; // Initialize with bookingType
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);

    if (sDate >= eDate) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'End date must be after start date.' });
    }

    if (bookingType === 'daily') {
      const numberOfDays = Math.ceil((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (numberOfDays <= 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ error: 'Booking must be for at least one day.' });
      }
      calculatedRent = roomConfig.dailyRate * numberOfDays;
      rentDetailsPayload = {
        ...rentDetailsPayload,
        dailyRate: roomConfig.dailyRate,
        numberOfDays: numberOfDays,
      };
    } else if (bookingType === 'monthly') {
      if (isProRataToMonthEnd === true) {
        // Client ensures sDate and eDate define the partial month period
        const numberOfDaysInPeriod = Math.ceil((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const totalDaysInMonthOfStartDate = daysInMonth(sDate.getFullYear(), sDate.getMonth());

        if (numberOfDaysInPeriod <= 0) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ error: 'Pro-rata booking period must be at least one day.' });
        }
        if (eDate.getMonth() !== sDate.getMonth() || eDate.getFullYear() !== sDate.getFullYear()) {
            // Basic check, client should ensure endDate is within the same month as startDate for pro-rata.
            // More robust validation might be needed depending on how strictly "to month end" is enforced.
             console.warn('Pro-rata booking endDate appears to be outside the startDate month. Calculation proceeds based on provided dates.');
        }

        calculatedRent = (numberOfDaysInPeriod / totalDaysInMonthOfStartDate) * roomConfig.baseRent;
        // Round to sensible precision, e.g., 2 decimal places for currency, then Math.round for final integer.
        calculatedRent = Math.round(parseFloat(calculatedRent.toFixed(2))); 
        
        rentDetailsPayload = {
          ...rentDetailsPayload,
          monthlyRate: roomConfig.baseRent, // Full monthly rate for reference
          isProRata: true,
          proRataDays: numberOfDaysInPeriod,
          totalDaysInProRataMonth: totalDaysInMonthOfStartDate,
          // numberOfMonths: 0, // Or leave undefined for pro-rata
        };
      } else {
        // Standard monthly booking (one or more full months)
        // Client ensures sDate and eDate define N full month cycles
        let monthsCount = 0;
        let tempDate = new Date(sDate);
        // Count how many full month cycles are within sDate and eDate
        // A common way: count how many times tempDate.addMonths(1) is still <= eDate
        // For simplicity, assuming eDate is correctly set by client to be N months after sDate (e.g., Jan 15 to Feb 14 is 1 month)
        
        let yearDiff = eDate.getFullYear() - sDate.getFullYear();
        let monthDifference = eDate.getMonth() - sDate.getMonth();
        let dayDiff = eDate.getDate() - sDate.getDate();

        monthsCount = yearDiff * 12 + monthDifference;
        if (dayDiff < 0 && monthsCount > 0) { // If end day is earlier, one less full month completed in the cycle
            // This logic is tricky. If Jan 15 to Feb 14, monthDiff is 1. dayDiff is -1.
            // If Jan 15 to Feb 15, monthDiff is 1. dayDiff is 0.
            // A robust way is to iterate:
             monthsCount = 0;
             let iterDate = new Date(sDate);
             while(iterDate < eDate) {
                 let nextMonthIterDate = new Date(iterDate);
                 nextMonthIterDate.setMonth(nextMonthIterDate.getMonth() + 1);
                 if (nextMonthIterDate <= new Date(eDate.getTime() + (1000 * 60 * 60 * 24))) { // Add a day to eDate for inclusive check
                     monthsCount++;
                     iterDate = nextMonthIterDate;
                 } else {
                     break; // Next full month would exceed endDate
                 }
             }
             if (monthsCount === 0 && eDate > sDate) monthsCount = 1; // Ensure at least 1 if period is positive but less than a full cycle by above logic
        } else if (dayDiff >= 0) {
            // If end day is same or later, and months are different, it completes the month cycle.
            // If Jan 15 to Feb 15, monthsCount = 1.
            // If Jan 15 to Jan 30 (and not pro-rata), this is tricky. Assume client sends valid N-month periods.
            // The iterative approach above is safer.
        }
         // Using the iterative count:
        let iterMonths = 0;
        let checkDate = new Date(sDate);
        while(true) {
            let nextCycleEndDate = new Date(checkDate);
            nextCycleEndDate.setMonth(nextCycleEndDate.getMonth() + 1);
            nextCycleEndDate.setDate(nextCycleEndDate.getDate() -1); // End of cycle, e.g. Jan 15 -> Feb 14

            if (nextCycleEndDate <= eDate) {
                iterMonths++;
                checkDate.setMonth(checkDate.getMonth() + 1); // Move to start of next cycle
            } else {
                break;
            }
        }
        // If iterMonths is 0 but sDate < eDate, it implies a period less than a full month cycle,
        // but not marked as pro-rata. This should ideally be a validation error or handled as 1 month if policy.
        // For now, if not pro-rata, we expect full month periods.
        if (iterMonths === 0 && eDate > sDate) {
            // This case should ideally be validated by client or result in error if not pro-rata
            // For robustness, if not pro-rata and period is positive, assume at least 1 month intended.
            // However, this can lead to overcharging if e.g. Jan 15 to Jan 20 is sent as non-pro-rata.
            // Let's rely on the client sending correct N-month periods for non-pro-rata.
            // The iterative logic above (iterMonths) is better.
             console.warn("Standard monthly booking period is less than a full cycle. Client should ensure startDate and endDate define full month(s) or use pro-rata option.");
             // Fallback: if iterMonths is 0 but dates are valid, maybe it's exactly one month not caught by loop.
             // A simpler month calculation for N full months:
             let y = eDate.getFullYear() - sDate.getFullYear();
             let m = eDate.getMonth() - sDate.getMonth();
             let d = eDate.getDate() - sDate.getDate();
             let numMonths = y * 12 + m;
             if (d >= 0) { // If end day is same or later, it completes the month.
                 numMonths +=1;
             }
             // This numMonths is often used for "number of monthly payments"
             // For "number of full cycles", the iterative one (iterMonths) is more accurate for "15th to 14th" style.
             // Let's use iterMonths. If it's 0 and not pro-rata, it's an issue.
             if (iterMonths === 0) {
                 await session.abortTransaction();
                 session.endSession();
                 return res.status(400).json({ error: "For standard monthly bookings, the period must constitute at least one full month cycle (e.g., Jan 15 to Feb 14), or use the pro-rata option for initial partial months." });
             }
             numberOfMonths = iterMonths;

        calculatedRent = roomConfig.baseRent * numberOfMonths;
        rentDetailsPayload = {
          ...rentDetailsPayload,
          monthlyRate: roomConfig.baseRent,
          numberOfMonths: numberOfMonths,
          isProRata: false,
        };
      }
    } else {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Invalid booking type. Must be "daily" or "monthly".' });
    }

    const finalRentAmount = customRent !== undefined && customRent !== null && !isNaN(parseFloat(customRent)) 
                            ? parseFloat(customRent) 
                            : calculatedRent;

    rentDetailsPayload = {
        ...rentDetailsPayload,
        calculatedRent: calculatedRent,
        finalRentAmount: finalRentAmount,
        customRentProvided: customRent !== undefined && customRent !== null && !isNaN(parseFloat(customRent)) ? parseFloat(customRent) : undefined,
    };

    const newBooking = new Booking({
      tenant: tenantId,
      room: roomId, 
      startDate: sDate,
      endDate: eDate,
      accommodationType: bookingType, 
      rentAmount: finalRentAmount, // This is the amount to be paid for this specific booking period
      rentDetails: rentDetailsPayload,
      rentPaidStatus: 'due', 
      rentDueDate: sDate, 
      securityDeposit: tenant.accommodationType === 'monthly' ? tenant.securityDeposit : undefined, // Store tenant's SD info for monthly
      notes: notes || '',
    });

    await newBooking.save({ session });

    tenant.room = room.name; 
    await tenant.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    res.status(201).json(newBooking);

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error("Error in addBooking:", error);
    res.status(400).json({ error: error.message });
  }
};

// Get a single booking by ID
// ...existing code...
// Update a booking
exports.updateBooking = async (req, res) => {
  try {
    const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.status(200).json(updatedBooking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a booking
exports.deleteBooking = async (req, res) => {
  try {
    const deletedBooking = await Booking.findByIdAndDelete(req.params.id);
    if (!deletedBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    // Add logic here to update room occupancy if necessary
    res.status(200).json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper function to calculate monthly rent (can be removed or adapted)
// This logic is now integrated into addBooking
/*
const calculateMonthlyRent = (room, tenant, checkInDate, checkOutDate) => {
  // ... implementation ...
  return rent;
};
*/

// Remove addDailyBooking as its functionality is merged into addBooking
/*
exports.addDailyBooking = async (req, res) => {
  // ... old code ...
};
*/
