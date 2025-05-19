// Print all bookings in the database for debugging
const mongoose = require('mongoose');
const Booking = require('./models/Booking');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const bookings = await Booking.find();
  console.log('Bookings:', JSON.stringify(bookings, null, 2));
  process.exit();
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
