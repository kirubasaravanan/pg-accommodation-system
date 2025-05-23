const Room = require('../models/Room');
const Tenant = require('../models/Tenant');
const Booking = require('../models/Booking');

exports.getSummary = async (req, res) => {
  try {
    // Total rooms
    const totalRooms = await Room.countDocuments();
    // Occupied rooms (at least one active tenant)
    const rooms = await Room.find();
    const tenants = await Tenant.find();
    const occupied = rooms.filter(room => tenants.some(t => t.room === room.name && t.status === 'Active')).length;
    const vacant = totalRooms - occupied;

    // Rent collection for current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const bookings = await Booking.find({
      startDate: { $lte: monthEnd },
      endDate: { $gte: monthStart }
    });
    let rentCollected = 0, rentTotal = 0;
    bookings.forEach(b => {
      rentTotal += b.rentAmount || 0;
      if (b.rentPaidStatus === 'paid') rentCollected += b.rentAmount || 0;
    });

    // Complaints: Placeholder (replace with real complaints if model exists)
    const complaints = [
      'Leaking tap in 2A',
      'WiFi not working in 1C',
      'AC issue in 3F'
    ];

    res.json({
      totalRooms,
      occupied,
      vacant,
      rentCollected,
      rentTotal,
      complaints
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTenantFinancialSummary = async (req, res) => {
  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // 1. Rent forecast for the current month
    let rentForecastThisMonth = 0;

    // Fetch active monthly bookings that overlap with the current month
    const monthlyBookings = await Booking.find({
      accommodationType: 'monthly',
      // Booking is active if its period overlaps with the current month
      startDate: { $lte: currentMonthEnd }, 
      endDate: { $gte: currentMonthStart },
    }).populate('tenant').populate({ path: 'room', populate: { path: 'roomConfigurationType' } });

    for (const booking of monthlyBookings) {
      if (booking.tenant && booking.tenant.status !== 'Active') continue; // Skip if tenant is not active

      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      const roomConfig = booking.room && booking.room.roomConfigurationType ? booking.room.roomConfigurationType : null;
      const monthlyRate = booking.rentDetails.originalMonthlyRate || booking.rentDetails.monthlyRate || (roomConfig ? roomConfig.baseRent : 0);

      if (monthlyRate === 0) continue; // Skip if no rate is found

      // Determine the portion of this booking that falls within the current month
      const effectiveStartDate = bookingStart < currentMonthStart ? currentMonthStart : bookingStart;
      const effectiveEndDate = bookingEnd > currentMonthEnd ? currentMonthEnd : bookingEnd;

      if (booking.rentDetails.proRated && 
          bookingStart.getFullYear() === currentMonthStart.getFullYear() &&
          bookingStart.getMonth() === currentMonthStart.getMonth() &&
          booking.rentDetails.daysInPartialMonth) { 
          // If the booking itself is pro-rated for this month (e.g. started mid-month)
          rentForecastThisMonth += booking.rentDetails.finalRentAmount || booking.rentAmount;
      } else if (booking.tenant && booking.tenant.monthlyRentCyclePreference === 'calendarMonth') {
        // Full month or part of a full month booking within the calendar month
        // If the booking spans the entire current month, add full monthly rate
        if (bookingStart <= currentMonthStart && bookingEnd >= currentMonthEnd) {
          rentForecastThisMonth += monthlyRate;
        } else {
          // Pro-rata calculation for partial month overlap
          let daysInMonthOverlap = 0;
          let tempDate = new Date(effectiveStartDate);
          while(tempDate <= effectiveEndDate) {
            if (tempDate.getMonth() === currentMonthStart.getMonth()) {
                daysInMonthOverlap++;
            }
            tempDate.setDate(tempDate.getDate() + 1);
          }
          const totalDaysInCurrentMonth = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() + 1, 0).getDate();
          if (daysInMonthOverlap > 0 && totalDaysInCurrentMonth > 0) {
            rentForecastThisMonth += Math.round((daysInMonthOverlap / totalDaysInCurrentMonth) * monthlyRate);
          }
        }
      } else if (booking.tenant && booking.tenant.monthlyRentCyclePreference === 'moveInDate') {
        // For moveInDate cycle, if the rentDueDate falls in this month, count it.
        // This assumes rentDueDate is set to the start of each cycle for moveInDate bookings.
        // A more robust way would be to check if a payment cycle overlaps the current month.
        // For simplicity, if a significant portion of the cycle is in this month, or due date is this month.
        // Let's consider a payment due if the booking is active in this month.
        // This part might need more refinement based on how rent due dates are managed for moveInDate cycles.
        // If the booking is active this month, we assume one month's rent is due if a cycle starts or covers most of it.
        // This is a simplification: accurately forecasting moveInDate cycles requires knowing each cycle's start/end.
        // For now, if active in month, consider one month's rent as forecast.
        // This will overestimate if only a few days of a cycle fall in the month.
        // A better approach: check if a cycle *start date* falls in this month.
        let cycleStartDate = new Date(booking.startDate);
        while(cycleStartDate <= currentMonthEnd) {
            if (cycleStartDate >= currentMonthStart && cycleStartDate <= currentMonthEnd) {
                rentForecastThisMonth += monthlyRate;
                break; // Count once per booking for this month
            }
            cycleStartDate.setMonth(cycleStartDate.getMonth() + 1);
            if (cycleStartDate > booking.endDate) break; // Don't go beyond booking end
        }
      }
    }

    // Fetch active daily bookings that fall within the current month
    const dailyBookings = await Booking.find({
      accommodationType: 'daily',
      startDate: { $lte: currentMonthEnd },
      endDate: { $gte: currentMonthStart },
    }).populate('tenant');

    for (const booking of dailyBookings) {
      if (booking.tenant && booking.tenant.status !== 'Active') continue;

      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      const dailyRate = booking.rentDetails.dailyRate || 0;

      if (dailyRate === 0) continue;

      let daysInMonth = 0;
      let currentDate = new Date(bookingStart > currentMonthStart ? bookingStart : currentMonthStart);
      const lastDate = bookingEnd < currentMonthEnd ? bookingEnd : currentMonthEnd;

      while(currentDate <= lastDate) {
        daysInMonth++;
        currentDate.setDate(currentDate.getDate() + 1);
      }
      rentForecastThisMonth += daysInMonth * dailyRate;
    }
    
    // Add estimated rent from daily stays for active monthly tenants
    const activeMonthlyTenants = await Tenant.find({ status: 'Active', accommodationType: 'monthly' });
    for (const tenant of activeMonthlyTenants) {
        if (tenant.estimatedMonthlyDailyStays && tenant.estimatedMonthlyDailyStays > 0) {
            // Need a default daily rate if not specified per tenant for this estimate
            // This part is conceptual as RoomConfigurationType is not directly linked here for daily rate
            // Assuming an average daily rate or a placeholder for now.
            // For a more accurate forecast, this would need a reference daily rate.
            // Let's assume an average daily rate of 400 for this estimation if not otherwise specified.
            const estimatedDailyRate = 400; // Placeholder
            rentForecastThisMonth += tenant.estimatedMonthlyDailyStays * estimatedDailyRate;
        }
    }

    // 2. Rent received this month (payments made this month for any booking)
    let rentReceivedThisMonth = 0;
    const paymentsThisMonth = await Booking.find({
      rentPaidStatus: 'paid', // or 'partial' if you count partials
      rentPaymentDate: { $gte: currentMonthStart, $lte: currentMonthEnd },
    });
    paymentsThisMonth.forEach(booking => {
      // If payment was partial, this needs to look at transaction history, not booking.rentAmount.
      // For simplicity, assuming rentAmount is what was paid if status is 'paid'.
      rentReceivedThisMonth += booking.rentAmount; 
    });

    // 3. Rent pending this month (Forecast - Received)
    // This is a simplification. True pending would be (Due Rent This Month - Paid Rent This Month for This Month's Dues)
    const rentPendingThisMonth = rentForecastThisMonth - rentReceivedThisMonth;

    // 4. Total active security deposit collected
    const activeTenantsWithDeposits = await Tenant.find({
      status: 'Active',
      accommodationType: 'monthly', // Typically monthly tenants pay security deposits
      'securityDeposit.amount': { $gt: 0 }
    });
    let totalActiveSecurityDepositCollected = 0;
    activeTenantsWithDeposits.forEach(tenant => {
      totalActiveSecurityDepositCollected += tenant.securityDeposit.amount;
    });

    res.status(200).json({
      rentForecastThisMonth: Math.round(rentForecastThisMonth),
      rentReceivedThisMonth: Math.round(rentReceivedThisMonth),
      rentPendingThisMonth: Math.round(rentPendingThisMonth),
      totalActiveSecurityDepositCollected: Math.round(totalActiveSecurityDepositCollected),
    });

  } catch (error) {
    console.error('Error fetching tenant financial summary:', error);
    res.status(500).json({ message: 'Failed to fetch tenant financial summary', error: error.message, details: error.stack });
  }
};
