const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/studentAuth';

async function checkDB() {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    const db = mongoose.connection.db;

    const colls = await db.listCollections().toArray();
    const users = await db.collection('users').find({}, {
      projection: { name:1, email:1, role:1, status:1, wallet:1 }
    }).toArray();
    const methods = await db.collection('paymentmethods').find({}).toArray();
    const deposits = await db.collection('deposits').find({}).toArray();
    const withdrawals = await db.collection('withdraws').find({}).toArray();
    const transactions = await db.collection('transactions').find({}).toArray();

    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║    MONGODB studentAuth - DATABASE REPORT     ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('\n📦 Collections:', colls.map(c => c.name).join(', '));

    console.log('\n👤 USERS (' + users.length + '):');
    users.forEach((u, i) => {
      console.log(`  [${i+1}] ${u.name} | ${u.email} | role: ${u.role} | status: ${u.status}`);
      if (u.wallet) console.log(`       wallet: balance=${u.wallet.balance}, totalDeposit=${u.wallet.totalDeposit}`);
    });

    console.log('\n💳 PAYMENT METHODS (' + methods.length + '):');
    methods.forEach((m, i) => {
      console.log(`  [${i+1}] ${m.name} | ${m.accountTitle} | ${m.accountNumber} | active: ${m.isActive}`);
    });

    console.log(`\n📥 Deposits       : ${deposits.length}`);
    console.log(`📤 Withdrawals    : ${withdrawals.length}`);
    console.log(`🔄 Transactions   : ${transactions.length}`);
    console.log('\n✅ MongoDB is LIVE and working at:', MONGO_URI);

  } catch (e) {
    console.error('❌ MongoDB Error:', e.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkDB();
