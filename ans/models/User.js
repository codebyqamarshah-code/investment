const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  wallet: {
    balance: { type: Number, default: 0 },
    pendingBalance: { type: Number, default: 0 },
    totalDeposit: { type: Number, default: 0 },
    totalWithdraw: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 },
    lockedEarnings: { type: Number, default: 0 }
  },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' }
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', UserSchema);
