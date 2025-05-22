const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, admin } = require('../middleware/authMiddleware'); // Correctly import protect and admin
const bcrypt = require('bcryptjs');

// Get all users (admin only)
router.get('/', protect, admin, async (req, res) => {
  // Middleware 'admin' already checks for req.user.role === 'admin'
  const users = await User.find({}, '-password');
  res.json(users);
});

// Create user (admin only)
router.post('/', protect, admin, async (req, res) => {
  // Middleware 'admin' already checks for req.user.role === 'admin'
  try {
    const { name, username, password, role } = req.body;
    const user = await User.create({ name, username, password, role });
    res.status(201).json({ message: 'User created', userId: user._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update user (admin only)
router.put('/:id', protect, admin, async (req, res) => {
  // Middleware 'admin' already checks for req.user.role === 'admin'
  try {
    const { name, username, role, password } = req.body;
    const update = { name, role };
    if (username) update.username = username.toLowerCase();

    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) return res.status(404).json({ error: 'User not found' });

    if (name) userToUpdate.name = name;
    if (username) userToUpdate.username = username.toLowerCase();
    if (role) userToUpdate.role = role;
    if (password) userToUpdate.password = password; // The pre-save hook will hash this

    await userToUpdate.save();
    const updatedUser = userToUpdate.toObject();
    delete updatedUser.password; // Ensure password is not sent back
    res.json({ message: 'User updated', user: updatedUser });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete user (admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  // Middleware 'admin' already checks for req.user.role === 'admin'
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get user by ID (admin only)
router.get('/:id', protect, admin, async (req, res) => {
  // Middleware 'admin' already checks for req.user.role === 'admin'
  try {
    const user = await User.findById(req.params.id, '-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
