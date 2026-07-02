const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @route   GET /api/admin/users
// @desc    Get all users for admin panel
// @access  Public (for demo purposes as hardcoded in frontend)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
