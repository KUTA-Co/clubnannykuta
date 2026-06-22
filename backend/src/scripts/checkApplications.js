import mongoose from 'mongoose';
import dotenv from 'dotenv';
import NannyApplication from '../models/NannyApplication.js';
import FamilyApplication from '../models/FamilyApplication.js';
import ContactSubmission from '../models/ContactSubmission.js';

dotenv.config();

const checkApplications = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // March 28, 2025 date range (UTC)
    const startDate = new Date('2025-03-28T00:00:00.000Z');
    const endDate = new Date('2025-03-29T00:00:00.000Z');

    const dateQuery = {
      createdAt: { $gte: startDate, $lt: endDate }
    };

    // Check nanny applications
    const nannyApps = await NannyApplication.find(dateQuery).sort({ createdAt: 1 });
    console.log(`=== Nanny Applications (March 28, 2025): ${nannyApps.length} ===`);
    nannyApps.forEach(app => {
      console.log(`- ${app.fullName} (${app.email}) - Status: ${app.status} - Submitted: ${app.createdAt}`);
    });

    // Check family applications
    const familyApps = await FamilyApplication.find(dateQuery).sort({ createdAt: 1 });
    console.log(`\n=== Family Applications (March 28, 2025): ${familyApps.length} ===`);
    familyApps.forEach(app => {
      console.log(`- ${app.parentName} (${app.email}) - Status: ${app.status} - Submitted: ${app.createdAt}`);
    });

    // Check contact submissions
    const contacts = await ContactSubmission.find(dateQuery).sort({ createdAt: 1 });
    console.log(`\n=== Contact Submissions (March 28, 2025): ${contacts.length} ===`);
    contacts.forEach(sub => {
      console.log(`- ${sub.name || sub.fullName} (${sub.email}) - Submitted: ${sub.createdAt}`);
    });

    console.log('\n--- Total submissions on March 28, 2025 ---');
    console.log(`Nanny Applications: ${nannyApps.length}`);
    console.log(`Family Applications: ${familyApps.length}`);
    console.log(`Contact Submissions: ${contacts.length}`);

    await mongoose.connection.close();
    console.log('\nDone.');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

checkApplications();
