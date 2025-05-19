// Script to populate test bookings for 70% occupancy and all scenarios
const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Tenant = require('./models/Tenant');
const Room = require('./models/Room');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('MongoDB connected');

  await Booking.deleteMany({});

  const tenants = await Tenant.find();
  const rooms = await Room.find();

  // Calculate 90% occupancy
  const totalBeds = rooms.reduce((sum, r) => sum + (r.occupancy?.max || 1), 0);
  const occupancyRate = 0.9;
  const months = 6;
  const today = new Date();
  let bookings = [];

  // Prepare monthly periods (last 6 months)
  let periods = [];
  for (let m = months - 1; m >= 0; m--) {
    let start = new Date(today.getFullYear(), today.getMonth() - m, 1);
    let end = new Date(today.getFullYear(), today.getMonth() - m + 1, 0);
    periods.push({ start, end });
  }

  // Assign bookings for each month
  let tenantIdx = 0;
  for (let p = 0; p < periods.length; p++) {
    const { start, end } = periods[p];
    let monthOccupied = 0;
    const targetOccupied = Math.floor(totalBeds * occupancyRate);
    // Get eligible tenants for this month (moveIn <= end, (moveOut >= start or active))
    const eligibleTenants = tenants.filter(t => {
      const moveIn = new Date(t.moveInDate);
      const moveOut = t.moveOutDate ? new Date(t.moveOutDate) : null;
      return moveIn <= end && (!moveOut || moveOut >= start);
    });
    let usedTenantIds = new Set();
    let roomIdx = 0;
    for (const room of rooms) {
      let beds = room.occupancy?.max || 1;
      for (let b = 0; b < beds && monthOccupied < targetOccupied; b++) {
        // Find next eligible tenant not used for this month
        let tenant = null;
        for (let tIdx = 0; tIdx < eligibleTenants.length; tIdx++) {
          if (!usedTenantIds.has(eligibleTenants[tIdx]._id.toString())) {
            tenant = eligibleTenants[tIdx];
            usedTenantIds.add(tenant._id.toString());
            break;
          }
        }
        if (!tenant) break;
        // Booking duration: match tenant type
        let bookingStart = new Date(Math.max(start, new Date(tenant.moveInDate)));
        let bookingEnd = tenant.moveOutDate ? new Date(Math.min(end, new Date(tenant.moveOutDate))) : end;
        bookings.push({
          tenant: tenant._id,
          room: room.name,
          startDate: bookingStart,
          endDate: bookingEnd,
          accommodationType: tenant.accommodationType,
          rentAmount: room.price,
          rentPaidStatus: b % 3 === 0 ? 'paid' : (b % 3 === 1 ? 'due' : 'partial'),
          rentDueDate: new Date(bookingStart),
          rentPaymentDate: b % 3 === 0 ? new Date(bookingStart) : null,
          securityDeposit: 2000 + (b * 500),
          notes: b % 2 === 0 ? 'Regular' : 'Late payment',
        });
        monthOccupied++;
      }
      if (monthOccupied >= targetOccupied) break;
    }
  }

  await Booking.insertMany(bookings);
  console.log('Bookings populated:', bookings.length);
  process.exit();
}

main().catch(err => {
  console.error('Error populating bookings:', err);
  process.exit(1);
});
