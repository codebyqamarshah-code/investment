const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Connect to MongoDB Atlas or local MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('mongodb was connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
