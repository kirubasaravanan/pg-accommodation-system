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
    // Enforce: All active tenants must have a room, inactive tenants must not
    const assignedRooms = tenants.filter(t => t.status === 'Active' && t.room).map(t => t.room);
    const unassignedActive = tenants.filter(t => t.status === 'Active' && !t.room);
    const assignedInactive = tenants.filter(t => t.status === 'Inactive' && t.room);

    // Remove room assignment for inactive tenants
    assignedInactive.forEach(t => { t.room = ''; });
    // Assign available rooms to unassigned active tenants (round-robin)
    const allRooms = await Room.find({});
    let roomIdx = 0;
    for (const t of unassignedActive) {
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
      if (!found) t.room = ''; // If no vacancy, leave unassigned
    }
    // Enforce move out date logic:
    const today = new Date().toISOString().slice(0, 10);
    for (const t of tenants) {
      if (t.status === 'Inactive') {
        // If no moveOutDate, set to today
        if (!t.moveOutDate) t.moveOutDate = today;
      } else {
        // If active, moveOutDate must be empty
        t.moveOutDate = '';
      }
    }
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
