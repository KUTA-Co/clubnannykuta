import mongoose from 'mongoose';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { User } from '../models/index.js';

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
      console.error('Usage: node createAdmin.js <email> <password>');
      console.error('Both email and password are required.');
      process.exit(1);
    }

    if (password.length < 12) {
      console.error('Password must be at least 12 characters for admin accounts.');
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      console.log(`User with email ${email} already exists.`);
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('Updated user role to admin.');
      }
      process.exit(0);
    }

    // Create new admin user
    const admin = await User.create({
      email: email.toLowerCase(),
      password: password,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true
    });

    console.log('Admin user created successfully!');
    console.log('----------------------------');
    console.log(`Email: ${admin.email}`);
    console.log('----------------------------');
    console.log('Login at: /admin/login');
    console.log('Admin portal: /admin');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
