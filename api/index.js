const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====== MONGOOSE MODELS ======

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  wallet: {
    balance: { type: Number, default: 0 },
    totalDeposit: { type: Number, default: 0 },
    totalWithdraw: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 },
    lockedEarnings: { type: Number, default: 0 }
  },
  status: { type: String, enum: ['active', 'suspended', 'blocked'], default: 'active' },
  kycStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const depositSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  transactionId: { type: String },
  notes: { type: String },
  paymentMethodUsed: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const withdrawSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  methodInfo: {
    methodName: String,
    accountTitle: String,
    accountNumber: String
  },
  notes: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['deposit', 'withdraw', 'adjustment', 'investment'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  method: { type: String },
  reference: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const paymentMethodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  accountTitle: { type: String, required: true },
  accountNumber: { type: String, required: true },
  iban: { type: String },
  instructions: { type: String },
  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now }
});

// ====== DB CONNECTION (cached for serverless) ======
let cachedDb = null;

async function connectDB() {
  if (cachedDb && mongoose.connection.readyState === 1) return cachedDb;
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) throw new Error('MONGO_URI environment variable is not set!');
  cachedDb = await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  return cachedDb;
}

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Deposit = mongoose.models.Deposit || mongoose.model('Deposit', depositSchema);
const Withdraw = mongoose.models.Withdraw || mongoose.model('Withdraw', withdrawSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
const PaymentMethod = mongoose.models.PaymentMethod || mongoose.model('PaymentMethod', paymentMethodSchema);

// ====== JWT MIDDLEWARE ======
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret12345';

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized - No token' });
  try {
    const dec = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(dec.id);
    if (!req.user) throw new Error('User not found');
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid Token' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden - Admin only' });
  next();
};

// ====== ROUTES ======

// Health check
app.get('/api', (req, res) => res.json({ status: 'API Running', time: new Date().toISOString() }));

// ---- AUTH ----

// REGISTER
app.post('/api/auth/register', async (req, res) => {
  try {
    await connectDB();
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    let exist = await User.findOne({ email: email.toLowerCase().trim() });
    if (exist) return res.status(400).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const count = await User.countDocuments();
    const role = count === 0 ? 'admin' : 'user';

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hash,
      role
    });
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, role: user.role, name: user.name });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    await connectDB();
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    if (user.status !== 'active') return res.status(403).json({ error: 'Account suspended' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ token, role: user.role, name: user.name });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET ME
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  await connectDB();
  res.json({ id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role });
});

// ADMIN LOGIN
app.post('/api/admin/login', async (req, res) => {
  try {
    await connectDB();
    const { email, password } = req.body;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const ADMIN_PASS = process.env.ADMIN_PASS || 'bybusiness@123';

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASS) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    let adminUser = await User.findOne({ email: ADMIN_EMAIL });
    if (!adminUser) {
      const hash = await bcrypt.hash(ADMIN_PASS, 10);
      adminUser = new User({ name: 'Super Admin', email: ADMIN_EMAIL, password: hash, role: 'admin', status: 'active' });
      await adminUser.save();
    }

    const token = jwt.sign({ id: adminUser._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, role: 'admin', name: adminUser.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// VERIFY ADMIN TOKEN
app.get('/api/admin/verify-token', authMiddleware, adminMiddleware, (req, res) => {
  res.json({ success: true, name: req.user.name, email: req.user.email });
});

// ---- WALLET ----

app.get('/api/wallet', authMiddleware, async (req, res) => {
  await connectDB();
  const transactions = await Transaction.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(20);
  res.json({ wallet: req.user.wallet, transactions });
});

app.get('/api/payment-methods', authMiddleware, async (req, res) => {
  await connectDB();
  const methods = await PaymentMethod.find({ isActive: true }).sort('priority');
  res.json(methods);
});

// DEPOSIT REQUEST (without file upload for serverless)
app.post('/api/wallet/deposit', authMiddleware, async (req, res) => {
  try {
    await connectDB();
    const { amount, pMethodName, notes, txnId } = req.body;

    const dep = new Deposit({
      userId: req.user._id,
      amount: parseFloat(amount),
      transactionId: txnId || Date.now().toString(),
      notes: notes || 'Deposit via UI',
      paymentMethodUsed: pMethodName || 'Manual'
    });
    await dep.save();
    res.json({ success: true, message: 'Deposit submitted for review' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// WITHDRAW REQUEST
app.post('/api/wallet/withdraw', authMiddleware, async (req, res) => {
  try {
    await connectDB();
    const { amount, methodName, accountTitle, accountNumber, notes } = req.body;
    const amt = parseFloat(amount);

    if (amt > req.user.wallet.balance) return res.status(400).json({ error: 'Insufficient funds' });

    const existing = await Withdraw.findOne({ userId: req.user._id, status: 'pending' });
    if (existing) return res.status(400).json({ error: 'You already have a pending withdrawal' });

    const w = new Withdraw({
      userId: req.user._id,
      amount: amt,
      methodInfo: { methodName, accountTitle, accountNumber },
      notes
    });
    await w.save();
    res.json({ success: true, message: 'Withdraw request sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- ADMIN ROUTES ----

app.get('/api/admin/dashboard-stats', authMiddleware, adminMiddleware, async (req, res) => {
  await connectDB();
  const users = await User.find();
  const allDeposits = await Deposit.find();
  const allWithdraws = await Withdraw.find();

  let tb = 0, td = 0, tw = 0, tp = 0;
  users.forEach(u => { tb += u.wallet.balance; td += u.wallet.totalDeposit; tw += u.wallet.totalWithdraw; tp += u.wallet.totalProfit; });

  const pendingDeposits = allDeposits.filter(d => d.status === 'pending').length;
  const pendingWithdraws = allWithdraws.filter(w => w.status === 'pending').length;
  const blockedUsers = users.filter(u => u.status !== 'active').length;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayDeposits = allDeposits.filter(d => d.status === 'approved' && new Date(d.createdAt) >= today).reduce((sum, d) => sum + d.amount, 0);

  res.json({ totalUsers: users.length, activeUsers: users.filter(x => x.status === 'active').length, blockedUsers, totalBalance: tb, totalDeposits: td, totalWithdrawals: tw, totalProfit: tp, pendingDeposits, pendingWithdraws, todayDeposits });
});

app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  await connectDB();
  const users = await User.find().select('-password');
  res.json(users);
});

app.post('/api/admin/users/:id/toggle-status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.status = user.status === 'active' ? 'suspended' : 'active';
    await user.save();
    res.json({ success: true, status: user.status });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/users/:id/adjust-wallet', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const { type, amount, note } = req.body;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return res.status(400).json({ error: 'Invalid amount' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (type === 'add') { user.wallet.balance += amt; user.wallet.totalDeposit += amt; }
    else { if (user.wallet.balance < amt) return res.status(400).json({ error: 'Insufficient user balance' }); user.wallet.balance -= amt; user.wallet.totalWithdraw += amt; }
    await user.save();
    await Transaction.create({ userId: user._id, type: 'adjustment', amount: amt, status: 'approved', reference: note || 'Admin Adjustment' });
    res.json({ success: true, balance: user.wallet.balance });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/deposits', authMiddleware, adminMiddleware, async (req, res) => {
  await connectDB();
  const deps = await Deposit.find().populate('userId', 'name email').sort({ createdAt: -1 });
  res.json(deps);
});

app.post('/api/admin/deposits/:id/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const dep = await Deposit.findById(req.params.id);
    if (!dep || dep.status !== 'pending') return res.status(400).json({ error: 'Invalid deposit' });
    const user = await User.findById(dep.userId);
    user.wallet.balance += dep.amount; user.wallet.totalDeposit += dep.amount;
    await user.save();
    dep.status = 'approved'; await dep.save();
    await Transaction.create({ userId: user._id, type: 'deposit', amount: dep.amount, status: 'approved', reference: dep.transactionId, method: dep.paymentMethodUsed });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/deposits/:id/reject', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const dep = await Deposit.findById(req.params.id);
    if (!dep || dep.status !== 'pending') return res.status(400).json({ error: 'Invalid deposit' });
    dep.status = 'rejected'; dep.rejectionReason = req.body.reason || 'Rejected by Admin';
    await dep.save(); res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/withdraws', authMiddleware, adminMiddleware, async (req, res) => {
  await connectDB();
  const w = await Withdraw.find().populate('userId', 'name email wallet').sort({ createdAt: -1 });
  res.json(w);
});

app.post('/api/admin/withdraws/:id/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const w = await Withdraw.findById(req.params.id);
    if (!w || w.status !== 'pending') return res.status(400).json({ error: 'Invalid Request' });
    const user = await User.findById(w.userId);
    if (user.wallet.balance < w.amount) return res.status(400).json({ error: 'User has insufficient balance' });
    user.wallet.balance -= w.amount; user.wallet.totalWithdraw += w.amount;
    await user.save(); w.status = 'approved'; await w.save();
    await Transaction.create({ userId: user._id, type: 'withdraw', amount: w.amount, status: 'approved', method: w.methodInfo.methodName });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/withdraws/:id/reject', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const w = await Withdraw.findById(req.params.id);
    w.status = 'rejected'; w.rejectionReason = req.body.reason || 'Rejected by Admin';
    await w.save(); res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/transactions', authMiddleware, adminMiddleware, async (req, res) => {
  await connectDB();
  const txns = await Transaction.find().populate('userId', 'name email').sort({ createdAt: -1 }).limit(100);
  res.json(txns);
});

app.get('/api/admin/payment-methods', authMiddleware, adminMiddleware, async (req, res) => {
  await connectDB();
  const m = await PaymentMethod.find(); res.json(m);
});

app.post('/api/admin/payment-methods', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const m = new PaymentMethod(req.body);
    await m.save(); res.json({ success: true, method: m });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = app;
