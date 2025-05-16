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

  // Calculate 70% occupancy
  const totalBeds = rooms.reduce((sum, r) => sum + (r.occupancy?.max || 1), 0);
  const targetOccupied = Math.floor(totalBeds * 0.7);
  let occupied = 0;
  let bookings = [];
  let tenantIdx = 0;

  // Assign tenants to rooms for 70% occupancy
  for (const room of rooms) {
    let beds = room.occupancy?.max || 1;
    let fill = Math.min(beds, targetOccupied - occupied);
    for (let i = 0; i < fill && tenantIdx < tenants.length; i++) {
      const tenant = tenants[tenantIdx++];
      // Monthly booking
      bookings.push({
        tenant: tenant._id,
        room: room.name,
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-05-31'),
        accommodationType: 'monthly',
        rentAmount: room.price,
        rentPaidStatus: i % 3 === 0 ? 'paid' : (i % 3 === 1 ? 'due' : 'partial'),
        rentDueDate: new Date('2025-05-10'),
        rentPaymentDate: i % 3 === 0 ? new Date('2025-05-05') : null,
        securityDeposit: 2000 + (i * 500),
        notes: i % 2 === 0 ? 'Regular' : 'Late payment',
      });
      occupied++;
    }
    if (occupied >= targetOccupied) break;
  }

  // Generate bookings for 3 months (May, April, March 2025) and 30%+ occupancy
  const months = [
    { start: '2025-05-01', end: '2025-05-31' },
    { start: '2025-04-01', end: '2025-04-30' },
    { start: '2025-03-01', end: '2025-03-31' },
  ];
  const minOccupancy = Math.ceil(totalBeds * 0.3);
  let bookingCount = 0;
  let tIdx = 0;
  // For each month, assign tenants to rooms for at least 30% occupancy
  for (const month of months) {
    let monthOccupied = 0;
    for (const room of rooms) {
      let beds = room.occupancy?.max || 1;
      let fill = Math.min(beds, minOccupancy - monthOccupied);
      for (let i = 0; i < fill && tIdx < tenants.length; i++) {
        const tenant = tenants[tIdx++];
        bookings.push({
          tenant: tenant._id,
          room: room.name,
          startDate: new Date(month.start),
          endDate: new Date(month.end),
          accommodationType: 'monthly',
          rentAmount: room.price,
          rentPaidStatus: i % 3 === 0 ? 'paid' : (i % 3 === 1 ? 'due' : 'partial'),
          rentDueDate: new Date(month.start),
          rentPaymentDate: i % 3 === 0 ? new Date(month.start) : null,
          securityDeposit: 2000 + (i * 500),
          notes: i % 2 === 0 ? 'Regular' : 'Late payment',
        });
        monthOccupied++;
        bookingCount++;
      }
      if (monthOccupied >= minOccupancy) break;
    }
  }
  // Add some daily/weekly bookings for remaining tenants (May only)
  for (; tIdx < tenants.length; tIdx++) {
    const tenant = tenants[tIdx];
    bookings.push({
      tenant: tenant._id,
      room: rooms[tIdx % rooms.length].name,
      startDate: new Date('2025-05-10'),
      endDate: new Date('2025-05-15'),
      accommodationType: 'daily',
      rentAmount: 500,
      rentPaidStatus: 'due',
      rentDueDate: new Date('2025-05-12'),
      rentPaymentDate: null,
      securityDeposit: 1000,
      notes: 'Short stay',
    });
    bookingCount++;
  }

  await Booking.insertMany(bookings);
  console.log('Bookings populated:', bookings.length);
  process.exit();
}

main().catch(err => {
  console.error('Error populating bookings:', err);
  process.exit(1);
});
