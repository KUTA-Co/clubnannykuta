import dotenv from 'dotenv';
dotenv.config();

import emailService from '../services/emailService.js';

async function testAllEmails() {
  console.log('Testing ALL email types...\n');
  console.log('Domain:', process.env.MAILGUN_DOMAIN);
  console.log('From:', process.env.FROM_EMAIL);
  console.log('Host:', process.env.MAILGUN_HOST);
  console.log('\n-----------------------------------\n');

  const testData = {
    name: 'Test User',
    email: 'thinuspretorius3@gmail.com',
    phone: '123-456-7890',
    subject: 'Test Subject',
    message: 'This is a test message.',
    parentName: 'Test Family',
    fullName: 'Test Nanny',
    city: 'Auburn',
    state: 'AL',
    numberOfChildren: '2',
    childrenAges: '3 and 5',
    startDate: '2026-06-01',
    endDate: '2026-08-15',
    hoursPerWeek: '40',
    weeklySchedule: 'Mon-Fri 8am-5pm',
    specialNeeds: 'None',
    church: 'First Baptist',
    faithBackground: 'Christian',
    familyValues: 'Faith, family',
    nannyAgeRange: '18-25',
    experienceLevel: '2+ years',
    personalityPreferences: 'Patient',
    additionalInfo: 'Test',
    dateOfBirth: '2000-01-01',
    university: 'Auburn University',
    yearsExperience: '3',
    ageGroups: 'Toddlers',
    experienceTypes: 'Babysitting',
    experienceDetails: 'Test experience',
    faithJourney: 'Test journey',
    whyCalled: 'Love kids',
    availableStartDate: '2026-06-01',
    availableEndDate: '2026-08-15',
    hoursAvailable: '40',
    locationPreferences: 'Auburn',
    ageGroupPreferences: 'Any'
  };

  // Test 1: Contact Form to Admin
  console.log('1. Testing CONTACT FORM (Admin)...');
  try {
    await emailService.sendContactFormToAdmin(testData);
    console.log('   ✅ Sent!\n');
  } catch (err) {
    console.log('   ❌ Failed:', err.message, '\n');
  }

  // Test 2: Contact Form Confirmation
  console.log('2. Testing CONTACT FORM (User Confirmation)...');
  try {
    await emailService.sendContactFormConfirmation(testData);
    console.log('   ✅ Sent!\n');
  } catch (err) {
    console.log('   ❌ Failed:', err.message, '\n');
  }

  // Test 3: Family Application to Admin
  console.log('3. Testing FAMILY APPLICATION (Admin)...');
  try {
    await emailService.sendFamilyApplicationToAdmin(testData);
    console.log('   ✅ Sent!\n');
  } catch (err) {
    console.log('   ❌ Failed:', err.message, '\n');
  }

  // Test 4: Family Application Confirmation
  console.log('4. Testing FAMILY APPLICATION (User Confirmation)...');
  try {
    await emailService.sendFamilyApplicationConfirmation(testData);
    console.log('   ✅ Sent!\n');
  } catch (err) {
    console.log('   ❌ Failed:', err.message, '\n');
  }

  // Test 5: Nanny Application to Admin
  console.log('5. Testing NANNY APPLICATION (Admin)...');
  try {
    await emailService.sendNannyApplicationToAdmin(testData);
    console.log('   ✅ Sent!\n');
  } catch (err) {
    console.log('   ❌ Failed:', err.message, '\n');
  }

  // Test 6: Nanny Application Confirmation
  console.log('6. Testing NANNY APPLICATION (User Confirmation)...');
  try {
    await emailService.sendNannyApplicationConfirmation(testData);
    console.log('   ✅ Sent!\n');
  } catch (err) {
    console.log('   ❌ Failed:', err.message, '\n');
  }

  console.log('-----------------------------------');
  console.log('Done! Check inboxes:');
  console.log('  - Leigh@clubnanny.com (admin notifications)');
  console.log('  - thinuspretorius3@gmail.com (user confirmations)');
}

testAllEmails();
