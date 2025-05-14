const fs = require('fs');
const path = require('path');

// Define the folder structure and files
const structure = {
  backend: {
    'app.js': `const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));`,
    '.env': `MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/pg-accommodation?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret`,
    models: {
      'User.js': `const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['tenant', 'admin'], default: 'tenant' }
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('User', UserSchema);`,
      'Room.js': `const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  isBooked: { type: Boolean, default: false }
});

module.exports = mongoose.model('Room', RoomSchema);`,
    },
    controllers: {
      'authController.js': `const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.create({ name, email, password });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};`,
      'roomController.js': `const Room = require('../models/Room');

exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.status(200).json(rooms);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.addRoom = async (req, res) => {
  try {
    const { name, location, price } = req.body;
    const room = await Room.create({ name, location, price });
    res.status(201).json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};`,
    },
    routes: {
      'authRoutes.js': `const express = require('express');
const { register, login } = require('../controllers/authController');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);

module.exports = router;`,
      'roomRoutes.js': `const express = require('express');
const { getRooms, addRoom } = require('../controllers/roomController');
const router = express.Router();

router.get('/', getRooms);
router.post('/', addRoom);

module.exports = router;`,
    },
  },
  frontend: {
    public: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PG Accommodation System</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
    },
    src: {
      'App.js': `import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Fetch data from the backend
    axios.get('http://localhost:5000/')
      .then((response) => {
        setMessage(response.data);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
      });
  }, []);

  return (
    <div>
      <h1>PG Accommodation System</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;`,
      pages: {
        'Home.js': `import React from 'react';

function Home() {
  return (
    <div>
      <h1>Welcome to PG Accommodation System</h1>
    </div>
  );
}

export default Home;`,
        'AdminDashboard.js': `import React from 'react';

function AdminDashboard() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
    </div>
  );
}

export default AdminDashboard;`,
      },
    },
  },
};

// Function to create folders and files
function createStructure(basePath, structure) {
  for (const key in structure) {
    const value = structure[key];
    const fullPath = path.join(basePath, key);

    if (typeof value === 'string') {
      // Create file
      fs.writeFileSync(fullPath, value);
    } else {
      // Create folder
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath);
      }
      createStructure(fullPath, value);
    }
  }
}

// Run the script
createStructure(__dirname, structure);
console.log('Phase 1 project structure created successfully!');