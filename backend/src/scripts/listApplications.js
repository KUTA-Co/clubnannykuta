import dotenv from 'dotenv';
dotenv.config();

import connectDB from '../config/database.js';
import FamilyApplication from '../models/FamilyApplication.js';
import NannyApplication from '../models/NannyApplication.js';

async function listApplications() {
  try {
    await connectDB();
    console.log('Connected to database.\n');

    // Get all family applications
    const families = await FamilyApplication.find().sort({ createdAt: -1 });

    console.log('=== FAMILY APPLICATIONS ===');
    console.log(`Total: ${families.length}\n`);
    families.forEach((app, i) => {
      console.log(`${i + 1}. ${app.parentName || 'N/A'}`);
      console.log(`   Email: ${app.email}`);
      console.log(`   Location: ${app.city || 'N/A'}, ${app.state || 'N/A'}`);
      console.log(`   Status: ${app.status} | Payment: ${app.paymentStatus}`);
      console.log(`   Applied: ${new Date(app.createdAt).toLocaleDateString()}`);
      console.log('');
    });

    // Get all nanny applications
    const nannies = await NannyApplication.find().sort({ createdAt: -1 });

    console.log('\n=== NANNY APPLICATIONS ===');
    console.log(`Total: ${nannies.length}\n`);
    nannies.forEach((app, i) => {
      console.log(`${i + 1}. ${app.fullName || 'N/A'}`);
      console.log(`   Email: ${app.email}`);
      console.log(`   Location: ${app.city || 'N/A'}, ${app.state || 'N/A'}`);
      console.log(`   Status: ${app.status} | Payment: ${app.paymentStatus}`);
      console.log(`   Applied: ${new Date(app.createdAt).toLocaleDateString()}`);
      console.log('');
    });

    console.log('\n=== SUMMARY ===');
    console.log(`Family Applications: ${families.length}`);
    console.log(`Nanny Applications: ${nannies.length}`);
    console.log(`Total: ${families.length + nannies.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

listApplications();
