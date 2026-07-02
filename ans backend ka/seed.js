const mongoose = require('mongoose');
const { PaymentMethod } = require('./models');

require('dotenv').config();
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ans_backend')
  .then(async () => {
    console.log('Connected carefully to ans_backend.');
    
    // Check if sadapay already exists
    const exists = await PaymentMethod.findOne({ name: 'SadaPay' });
    if(!exists) {
        await PaymentMethod.create({
            name: 'SadaPay',
            accountTitle: 'Qamar Shah',
            accountNumber: '03020463118',
            instructions: 'Please send funds to the Sadapay number to process your deposit. Attach your screenshot as proof.'
        });
        console.log('SadaPay payment method added.');
    } else {
        console.log('SadaPay already present.');
    }
    
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
