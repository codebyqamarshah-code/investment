const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const helmet = require('helmet');
const http = require('http');
const socketIo = require('socket.io');

const { User, PaymentMethod, Deposit, Withdraw, Transaction } = require('./models');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

// Secure Headers & Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// DB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ans_backend')
  .then(() => console.log("MongoDB Connected (ans_backend)"))
  .catch(err => console.log("MongoDB Error: ", err));

// Multer Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage, limits: { fileSize: 5000000 } });

// JWT Middleware
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const dec = jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
    req.user = await User.findById(dec.id);
    if (!req.user) throw new Error();
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid Token' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
};

// ======= ROUTES =======

// Auth Layer
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let exist = await User.findOne({ email });
    if (exist) return res.status(400).json({ error: 'Email already exists' });

    const hash = await bcrypt.hash(password, 10);
    // Auto-promote first user to admin for testing
    const count = await User.countDocuments();
    const role = count === 0 ? 'admin' : 'user';

    const user = new User({ name, email, password: hash, role });
    await user.save();

    io.emit('new_registration', { email, name });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'supersecret');
    res.status(201).json({ token });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    if (user.status !== 'active') return res.status(403).json({ error: 'Account suspended' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'supersecret');
    res.status(200).json({ token, role: user.role });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role });
});

// Admin Verification (For accessing admin panel UI)
app.get('/api/admin/verify-token', authMiddleware, adminMiddleware, (req, res) => {
  res.json({ success: true, name: req.user.name, email: req.user.email });
});

// Dedicated Admin Login (email+password based, no registration needed)
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const ADMIN_PASS = process.env.ADMIN_PASS || 'bybusiness@123';

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASS) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Find or auto-create admin user in DB
    let adminUser = await User.findOne({ email: ADMIN_EMAIL });
    if (!adminUser) {
      const hash = await bcrypt.hash(ADMIN_PASS, 10);
      adminUser = new User({ name: 'Super Admin', email: ADMIN_EMAIL, password: hash, role: 'admin', status: 'active' });
      await adminUser.save();
    }

    const token = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET || 'supersecret');
    res.json({ token, role: 'admin', name: adminUser.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Wallet Layer
app.get('/api/wallet', authMiddleware, async (req, res) => {
  const transactions = await Transaction.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(20);
  res.json({ wallet: req.user.wallet, transactions });
});

// Payment Methods (Public fetch for user UI)
app.get('/api/payment-methods', authMiddleware, async (req, res) => {
  const methods = await PaymentMethod.find({ isActive: true }).sort('priority');
  res.json(methods);
});

// Deposit Request
app.post('/api/wallet/deposit', authMiddleware, upload.single('screenshot'), async (req, res) => {
  try {
    const { amount, pMethodName, notes, txnId } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Screenshot required' });

    const dep = new Deposit({
      userId: req.user._id,
      amount: parseFloat(amount),
      transactionId: txnId,
      receiptImage: req.file.filename,
      notes,
      paymentMethodUsed: pMethodName
    });

    await dep.save();
    io.emit('new_deposit', { amount, user: req.user.name });
    res.json({ success: true, message: 'Deposit submitted for review' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Withdraw Request
app.post('/api/wallet/withdraw', authMiddleware, async (req, res) => {
  try {
    const { amount, methodName, accountTitle, accountNumber, notes } = req.body;
    const amt = parseFloat(amount);

    if (amt > req.user.wallet.balance) return res.status(400).json({ error: 'Insufficient funds' });
    // Prevent duplicated requests by soft reserving or checking pending
    const existing = await Withdraw.findOne({ userId: req.user._id, status: 'pending' });
    if (existing) return res.status(400).json({ error: 'You already have a pending withdrawal request' });

    const w = new Withdraw({
      userId: req.user._id,
      amount: amt,
      methodInfo: { methodName, accountTitle, accountNumber },
      notes
    });
    await w.save();

    io.emit('new_withdraw', { amount: amt, user: req.user.name });
    res.json({ success: true, message: 'Withdraw request sent' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin Dashboard & Management Layer
app.get('/api/admin/dashboard-stats', authMiddleware, adminMiddleware, async (req, res) => {
  const users = await User.find();
  const allDeposits = await Deposit.find();
  const allWithdraws = await Withdraw.find();

  let tb = 0, td = 0, tw = 0, tp = 0;
  users.forEach(u => {
    tb += u.wallet.balance;
    td += u.wallet.totalDeposit;
    tw += u.wallet.totalWithdraw;
    tp += u.wallet.totalProfit;
  });

  const pendingDeposits = allDeposits.filter(d => d.status === 'pending').length;
  const pendingWithdraws = allWithdraws.filter(w => w.status === 'pending').length;
  const blockedUsers = users.filter(u => u.status === 'suspended' || u.status === 'blocked').length;
  const pendingKyc = users.filter(u => u.kycStatus === 'pending').length;

  // Today's deposits (approved)
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayDeposits = allDeposits.filter(d => d.status === 'approved' && new Date(d.createdAt) >= today)
    .reduce((sum, d) => sum + d.amount, 0);

  res.json({
    totalUsers: users.length,
    activeUsers: users.filter(x => x.status === 'active').length,
    blockedUsers,
    totalBalance: tb,
    totalDeposits: td,
    totalWithdrawals: tw,
    totalProfit: tp,
    pendingDeposits,
    pendingWithdraws,
    pendingKyc,
    todayDeposits
  });
});

app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

// Toggle user status (active / suspended)
app.post('/api/admin/users/:id/toggle-status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.status = user.status === 'active' ? 'suspended' : 'active';
    await user.save();
    res.json({ success: true, status: user.status });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Adjust wallet balance (credit / debit)
app.post('/api/admin/users/:id/adjust-wallet', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { type, amount, note } = req.body;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return res.status(400).json({ error: 'Invalid amount' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (type === 'add') {
      user.wallet.balance += amt;
      user.wallet.totalDeposit += amt;
    } else {
      if (user.wallet.balance < amt) return res.status(400).json({ error: 'Insufficient user balance' });
      user.wallet.balance -= amt;
      user.wallet.totalWithdraw += amt;
    }
    await user.save();
    await Transaction.create({ userId: user._id, type: type === 'add' ? 'adjustment' : 'adjustment', amount: amt, status: 'approved', reference: note || 'Admin Adjustment' });
    res.json({ success: true, balance: user.wallet.balance });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// All transactions (for admin)
app.get('/api/admin/transactions', authMiddleware, adminMiddleware, async (req, res) => {
  const txns = await Transaction.find().populate('userId', 'name email').sort({ createdAt: -1 }).limit(100);
  res.json(txns);
});



// Deposits Admin CRUD
app.get('/api/admin/deposits', authMiddleware, adminMiddleware, async (req, res) => {
  const deps = await Deposit.find().populate('userId', 'name email').sort({ createdAt: -1 });
  res.json(deps);
});

app.post('/api/admin/deposits/:id/approve', authMiddleware, adminMiddleware, async (req, res) => {
  const dep = await Deposit.findById(req.params.id);
  if (!dep || dep.status !== 'pending') return res.status(400).json({ error: 'Invalid deposit' });

  const user = await User.findById(dep.userId);
  user.wallet.balance += dep.amount;
  user.wallet.totalDeposit += dep.amount;
  await user.save();

  dep.status = 'approved';
  await dep.save();

  await Transaction.create({ userId: user._id, type: 'deposit', amount: dep.amount, status: 'approved', reference: dep.transactionId, method: dep.paymentMethodUsed });
  res.json({ success: true });
});

app.post('/api/admin/deposits/:id/reject', authMiddleware, adminMiddleware, async (req, res) => {
  const dep = await Deposit.findById(req.params.id);
  if (!dep || dep.status !== 'pending') return res.status(400).json({ error: 'Invalid deposit' });

  dep.status = 'rejected';
  dep.rejectionReason = req.body.reason || 'Rejected by Admin';
  await dep.save();
  res.json({ success: true });
});

// Withdraws Admin CRUD
app.get('/api/admin/withdraws', authMiddleware, adminMiddleware, async (req, res) => {
  const w = await Withdraw.find().populate('userId', 'name email wallet').sort({ createdAt: -1 });
  res.json(w);
});

app.post('/api/admin/withdraws/:id/approve', authMiddleware, adminMiddleware, async (req, res) => {
  const w = await Withdraw.findById(req.params.id);
  if (!w || w.status !== 'pending') return res.status(400).json({ error: 'Invalid Request' });

  const user = await User.findById(w.userId);
  if (user.wallet.balance < w.amount) return res.status(400).json({ error: 'User has insufficient balance' });

  user.wallet.balance -= w.amount;
  user.wallet.totalWithdraw += w.amount;
  await user.save();

  w.status = 'approved';
  await w.save();

  await Transaction.create({ userId: user._id, type: 'withdraw', amount: w.amount, status: 'approved', method: w.methodInfo.methodName });
  res.json({ success: true });
});

app.post('/api/admin/withdraws/:id/reject', authMiddleware, adminMiddleware, async (req, res) => {
  const w = await Withdraw.findById(req.params.id);
  w.status = 'rejected';
  w.rejectionReason = req.body.reason || 'Rejected by Admin';
  await w.save();
  res.json({ success: true });
});

// Admin Payment Methods CRUD
app.get('/api/admin/payment-methods', authMiddleware, adminMiddleware, async (req, res) => {
  const m = await PaymentMethod.find();
  res.json(m);
});
app.post('/api/admin/payment-methods', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const m = new PaymentMethod(req.body);
    await m.save();
    res.json({ success: true, method: m });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
