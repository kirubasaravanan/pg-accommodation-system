const mongoose = require('mongoose');
const Tenant = require('./models/Tenant');
const Room = require('./models/Room');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const indianFirstNames = [
  'Amit', 'Priya', 'Rahul', 'Sneha', 'Vikram', 'Anjali', 'Rohit', 'Pooja', 'Suresh', 'Neha',
  'Karan', 'Divya', 'Manish', 'Ritu', 'Sanjay', 'Meena', 'Arjun', 'Kavita', 'Deepak', 'Shreya',
  'Nikhil', 'Swati', 'Rajesh', 'Sunita', 'Abhishek', 'Preeti', 'Vikas', 'Asha', 'Aakash', 'Nisha',
  'Gaurav', 'Radhika', 'Harsh', 'Isha', 'Yash', 'Komal', 'Ravi', 'Simran', 'Tarun', 'Payal',
  'Ajay', 'Bhavna', 'Chetan', 'Diksha', 'Esha', 'Farhan', 'Geeta', 'Hemant', 'Irfan', 'Jaya'
];
const indianLastNames = [
  'Sharma', 'Verma', 'Patel', 'Reddy', 'Nair', 'Singh', 'Gupta', 'Mehra', 'Kumar', 'Jain',
  'Chopra', 'Joshi', 'Kapoor', 'Bansal', 'Agarwal', 'Desai', 'Shetty', 'Das', 'Mishra', 'Pandey',
  'Saxena', 'Choudhary', 'Dubey', 'Yadav', 'Sinha', 'Rastogi', 'Malhotra', 'Bhatia', 'Ghosh', 'Roy'
];

async function generateTenants() {
  const rooms = await Room.find({});
  const totalBeds = rooms.reduce((sum, r) => sum + (r.occupancy?.max || 1), 0);
  const months = 6;
  const occupancyRate = 0.9;
  const tenantsNeeded = Math.ceil(totalBeds * occupancyRate);
  const longTermCount = Math.ceil(tenantsNeeded * 0.5);
  const shortTermCount = Math.ceil(tenantsNeeded * 0.3);
  const today = new Date();
  const tenants = [];
  let usedContacts = new Set();

  // Generate long-term tenants (stay 4-6 months)
  for (let i = 0; i < longTermCount; i++) {
    const firstName = indianFirstNames[i % indianFirstNames.length];
    const lastName = indianLastNames[i % indianLastNames.length];
    const name = `${firstName} ${lastName}`;
    let contact;
    do {
      contact = '9' + Math.floor(100000000 + Math.random() * 900000000);
    } while (usedContacts.has(contact));
    usedContacts.add(contact);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
    // Move in 4-6 months ago, no move out (active)
    const moveInDate = new Date(today);
    moveInDate.setMonth(moveInDate.getMonth() - (Math.floor(Math.random() * 3) + 4));
    tenants.push({
      name,
      contact,
      email,
      room: '', // assigned later
      status: 'Active',
      moveInDate: moveInDate.toISOString().slice(0, 10),
      moveOutDate: '',
      accommodationType: 'monthly',
    });
  }
  // Generate short-term tenants (stay 1-2 months)
  for (let i = 0; i < shortTermCount; i++) {
    const firstName = indianFirstNames[(i + 10) % indianFirstNames.length];
    const lastName = indianLastNames[(i + 10) % indianLastNames.length];
    const name = `${firstName} ${lastName}`;
    let contact;
    do {
      contact = '9' + Math.floor(100000000 + Math.random() * 900000000);
    } while (usedContacts.has(contact));
    usedContacts.add(contact);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 100}@example.com`;
    // Move in 1-2 months ago, move out this month (inactive)
    const moveInDate = new Date(today);
    moveInDate.setMonth(moveInDate.getMonth() - (Math.floor(Math.random() * 2) + 1));
    const moveOutDate = new Date(today);
    tenants.push({
      name,
      contact,
      email,
      room: '', // assigned later
      status: 'Inactive',
      moveInDate: moveInDate.toISOString().slice(0, 10),
      moveOutDate: moveOutDate.toISOString().slice(0, 10),
      accommodationType: 'monthly',
    });
  }
  // Fill remaining with mid-term tenants (2-3 months)
  const remaining = tenantsNeeded - longTermCount - shortTermCount;
  for (let i = 0; i < remaining; i++) {
    const firstName = indianFirstNames[(i + 20) % indianFirstNames.length];
    const lastName = indianLastNames[(i + 20) % indianLastNames.length];
    const name = `${firstName} ${lastName}`;
    let contact;
    do {
      contact = '9' + Math.floor(100000000 + Math.random() * 900000000);
    } while (usedContacts.has(contact));
    usedContacts.add(contact);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 200}@example.com`;
    // Move in 2-3 months ago, move out this month (inactive)
    const moveInDate = new Date(today);
    moveInDate.setMonth(moveInDate.getMonth() - (Math.floor(Math.random() * 2) + 2));
    const moveOutDate = new Date(today);
    tenants.push({
      name,
      contact,
      email,
      room: '', // assigned later
      status: 'Inactive',
      moveInDate: moveInDate.toISOString().slice(0, 10),
      moveOutDate: moveOutDate.toISOString().slice(0, 10),
      accommodationType: 'monthly',
    });
  }
  return tenants;
}

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('MongoDB connected');
    await Tenant.deleteMany({}); // Clear existing tenants
    await Room.updateMany({}, { $set: { 'occupancy.current': 0 } });
    const tenants = await generateTenants();
    // Assign rooms round-robin to active tenants only
    const allRooms = await Room.find({});
    let roomIdx = 0;
    for (const t of tenants) {
      if (t.status === 'Active') {
        // Find next room with vacancy
        let found = false;
        for (let i = 0; i < allRooms.length; i++) {
          const r = allRooms[(roomIdx + i) % allRooms.length];
          const assignedCount = tenants.filter(tt => tt.room === r.name && tt.status === 'Active').length;
          if (assignedCount < r.occupancy.max) {
            t.room = r.name;
            roomIdx = (roomIdx + i + 1) % allRooms.length;
            found = true;
            break;
          }
        }
        if (!found) t.room = '';
      } else {
        t.room = '';
      }
    }
    await Tenant.insertMany(tenants);
    // Update room occupancies
    const roomNames = [...new Set(tenants.map(t => t.room).filter(Boolean))];
    for (const roomName of roomNames) {
      const count = tenants.filter(t => t.room === roomName && t.status === 'Active').length;
      await Room.findOneAndUpdate({ name: roomName }, { $set: { 'occupancy.current': count } });
    }
    console.log('Tenants populated successfully');
    process.exit();
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  });
