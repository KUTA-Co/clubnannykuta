import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/index.js';

dotenv.config();

const updateAdminPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = process.argv[2];
    const newPassword = process.argv[3];

    if (!email || !newPassword) {
      console.error('Usage: node updateAdminPassword.js <email> <new_password>');
      console.error('Both email and password are required.');
      process.exit(1);
    }

    if (newPassword.length < 12) {
      console.error('Password must be at least 12 characters for admin accounts.');
      process.exit(1);
    }

    // Find admin user
    const admin = await User.findOne({ email: email.toLowerCase(), role: 'admin' });

    if (!admin) {
      console.log(`Admin user with email ${email} not found.`);
      process.exit(1);
    }

    // Update password (the pre-save hook will hash it)
    admin.password = newPassword;
    await admin.save();

    console.log('Admin password updated successfully!');
    console.log('----------------------------');
    console.log(`Email: ${admin.email}`);
    console.log('----------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Error updating admin password:', error);
    process.exit(1);
  }
};

updateAdminPassword();
