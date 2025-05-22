const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    const { name, username, password, role } = req.body; // Added role, changed email to username
    // Ensure username is converted to lowercase before saving, if not handled by model
    const user = await User.create({ name, username: username.toLowerCase(), password, role });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  console.log('Login request received with username:', req.body.username); // Debug log
  try {
    const { username, password } = req.body; // Changed email to username
    // Ensure username is converted to lowercase for lookup, if not handled by model or if input varies
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await user.comparePassword(password); // Use the comparePassword method from the User model
    console.log('Stored hash:', user.password); // Debug log
    console.log('Password match result:', isMatch); // Debug log
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1d' }); // Added username to token
    res.status(200).json({ token, role: user.role, username: user.username }); // Return role and username along with token
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};