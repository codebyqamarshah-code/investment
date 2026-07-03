const mongoose = require('mongoose');

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
    ip: { type: String },
    kycStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const paymentMethodSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g. JazzCash
    accountTitle: { type: String, required: true },
    accountNumber: { type: String, required: true },
    iban: { type: String },
    walletAddress: { type: String }, // For crypto
    qrCodeImage: { type: String }, // Path to uploaded image
    instructions: { type: String },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 1 },
    createdAt: { type: Date, default: Date.now }
});

const depositSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    transactionId: { type: String, required: true, unique: true },
    receiptImage: { type: String, required: true }, // Required screenshot
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
        accountNumber: String,
        ibanOrWallet: String
    },
    notes: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['deposit', 'withdraw', 'adjustment', 'referral', 'investment'], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    method: { type: String },
    reference: { type: String }, // Txn ID or internal ref
    createdAt: { type: Date, default: Date.now }
});

module.exports = {
    User: mongoose.model('User', userSchema),
    PaymentMethod: mongoose.model('PaymentMethod', paymentMethodSchema),
    Deposit: mongoose.model('Deposit', depositSchema),
    Withdraw: mongoose.model('Withdraw', withdrawSchema),
    Transaction: mongoose.model('Transaction', transactionSchema)
};
