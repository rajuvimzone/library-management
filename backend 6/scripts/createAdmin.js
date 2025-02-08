require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const adminCredentials = {
    username: 'admin',
    email: 'admin@library.com',
    password: 'admin123',  // This will be hashed before saving
    role: 'admin'
};

async function createAdminUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/library_management', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminCredentials.email });
        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminCredentials.password, salt);

        // Create admin user
        const admin = new User({
            username: adminCredentials.username,
            email: adminCredentials.email,
            password: hashedPassword,
            role: adminCredentials.role
        });

        await admin.save();
        console.log('Admin user created successfully');
        console.log('Email:', adminCredentials.email);
        console.log('Password:', adminCredentials.password);
        console.log('Please change these credentials after first login');

    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

createAdminUser();
