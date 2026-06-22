import dotenv from 'dotenv';
dotenv.config();

import FormData from 'form-data';
import Mailgun from 'mailgun.js';

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,
  url: process.env.MAILGUN_HOST || 'https://api.mailgun.net'
});

const DOMAIN = process.env.MAILGUN_DOMAIN;
const FROM_EMAIL = process.env.FROM_EMAIL;

async function testEmail() {
  console.log('Testing email with:');
  console.log('  Domain:', DOMAIN);
  console.log('  From:', FROM_EMAIL);
  console.log('  Host:', process.env.MAILGUN_HOST || 'https://api.mailgun.net');
  console.log('');

  try {
    const result = await mg.messages.create(DOMAIN, {
      from: FROM_EMAIL,
      to: ['Leigh@clubnanny.com', 'thinuspretorius3@gmail.com'],
      subject: 'Test Email - Club Nanny',
      text: 'This is a test email from Club Nanny. If you received this, the email system is working!',
      html: '<h1>Test Email</h1><p>This is a test email from Club Nanny. If you received this, the email system is working!</p>'
    });
    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', result.id);
  } catch (error) {
    console.error('❌ Email failed:', error.message);
  }
}

testEmail();
