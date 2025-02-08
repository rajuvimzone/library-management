const mongoose = require('mongoose');

async function checkMongoDBConnection() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/library_management', {
      serverSelectionTimeoutMS: 5000 // Wait 5 seconds before timing out
    });
    console.log('MongoDB is running and accessible');
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.log('\nPlease make sure MongoDB is installed and running:');
    console.log('1. Download MongoDB Community Server from: https://www.mongodb.com/try/download/community');
    console.log('2. Install MongoDB following the installation guide');
    console.log('3. Start MongoDB service');
    return false;
  }
}

checkMongoDBConnection();
