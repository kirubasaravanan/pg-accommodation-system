const mongoose = require('mongoose');
const Tenant = require('./models/Tenant');
const Room = require('./models/Room');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const tenants = [
  { name: 'Alice Smith', contact: '9876543210', email: 'alice@example.com', room: 'GB', status: 'Active' },
  { name: 'Bob Johnson', contact: '9123456780', email: 'bob@example.com', room: 'GB', status: 'Active' },
  { name: 'Charlie Lee', contact: '9001122334', email: 'charlie@example.com', room: '1A', status: 'Inactive' },
  { name: 'David Kim', contact: '9112233445', email: 'david@example.com', room: '1A', status: 'Active' },
  { name: 'Eve Adams', contact: '9223344556', email: 'eve@example.com', room: '2B', status: 'Active' },
  { name: 'Frank Miller', contact: '9334455667', email: 'frank@example.com', room: '2B', status: 'Active' },
  { name: 'Grace Lee', contact: '9445566778', email: 'grace@example.com', room: '', status: 'Active' },
  { name: 'Henry Ford', contact: '9556677889', email: 'henry@example.com', room: '', status: 'Active' },
  { name: 'Ivy Chen', contact: '9667788990', email: 'ivy@example.com', room: '', status: 'Active' },
];

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('MongoDB connected');
    await Tenant.deleteMany({}); // Clear existing tenants
    // Reset all room occupancies to 0
    await Room.updateMany({}, { $set: { 'occupancy.current': 0 } });
    await Tenant.insertMany(tenants);
    // For each room, count tenants assigned and update occupancy.current
    const roomNames = [...new Set(tenants.map(t => t.room).filter(Boolean))];
    for (const roomName of roomNames) {
      const count = tenants.filter(t => t.room === roomName).length;
      await Room.findOneAndUpdate({ name: roomName }, { $set: { 'occupancy.current': count } });
    }
    console.log('Tenants populated successfully');
    process.exit();
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  });
