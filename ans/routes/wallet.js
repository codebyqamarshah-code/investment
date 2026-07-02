const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, admin } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Setup Multer for file uploads (screenshots)
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ 
  storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images Only!');
    }
  }
});

// @route   GET /api/wallet
// @desc    Get user wallet status and history
router.get('/', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).sort('-createdAt');
    res.json({
      wallet: req.user.wallet,
      transactions
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/wallet/deposit
// @desc    Request a deposit
router.post('/deposit', protect, upload.single('screenshot'), async (req, res) => {
  try {
    const { amount, method, transactionId, notes } = req.body;
    
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount is required' });
    if (!method) return res.status(400).json({ error: 'Method is required' });

    const deposit = new Transaction({
      user: req.user._id,
      type: 'deposit',
      amount: Number(amount),
      method,
      transactionId,
      notes,
      screenshotUrl: req.file ? `/uploads/${req.file.filename}` : null
    });
    
    await deposit.save();
    res.status(201).json(deposit);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/wallet/withdraw
// @desc    Request a withdrawal
router.post('/withdraw', protect, async (req, res) => {
  try {
    const { amount, method, notes } = req.body;
    
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount is required' });
    if (req.user.wallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient wallet balance' });
    }
    if (amount < 10) {
      return res.status(400).json({ error: 'Minimum withdraw amount is $10' });
    }

    const withdraw = new Transaction({
      user: req.user._id,
      type: 'withdraw',
      amount: Number(amount),
      method,
      notes
    });
    
    // Deduct immediately on request? Typical platforms move to pending
    req.user.wallet.balance -= Number(amount);
    req.user.wallet.pendingBalance += Number(amount);
    await req.user.save();
    await withdraw.save();
    
    res.status(201).json(withdraw);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
