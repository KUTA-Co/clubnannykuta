import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import NannyApplication from '../models/NannyApplication.js';
import FamilyApplication from '../models/FamilyApplication.js';
import Payment from '../models/Payment.js';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Application fee amounts in cents
const APPLICATION_FEES = {
  family: 25000, // $250
  nanny: 7500    // $75
};

/**
 * Sync Payment records for applications that have paymentStatus='paid' or stripeSessionId
 * but no corresponding Payment record.
 *
 * Run this script once to backfill existing paid applications.
 *
 * Usage: cd backend && node src/scripts/syncPayments.js
 */
const syncPayments = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    let created = 0;
    let skipped = 0;
    let errors = 0;

    // Process nanny applications
    console.log('=== Processing Nanny Applications ===');
    const nannyApps = await NannyApplication.find({
      $or: [
        { paymentStatus: 'paid' },
        { stripeSessionId: { $exists: true, $ne: null, $ne: '' } }
      ]
    });
    console.log(`Found ${nannyApps.length} nanny applications with payment info`);

    for (const app of nannyApps) {
      try {
        // Check if Payment already exists
        if (app.stripeSessionId) {
          const existingPayment = await Payment.findOne({ stripeSessionId: app.stripeSessionId });
          if (existingPayment) {
            console.log(`  [SKIP] ${app.fullName}: Payment record already exists`);
            skipped++;
            continue;
          }
        }

        // If no stripeSessionId but paid, we can't verify with Stripe
        if (!app.stripeSessionId && app.paymentStatus === 'paid') {
          console.log(`  [SKIP] ${app.fullName}: No Stripe session ID to verify`);
          skipped++;
          continue;
        }

        // Verify with Stripe
        let session;
        try {
          session = await stripe.checkout.sessions.retrieve(app.stripeSessionId);
        } catch (stripeError) {
          console.log(`  [ERROR] ${app.fullName}: Stripe session not found - ${stripeError.message}`);
          errors++;
          continue;
        }

        // Create Payment record
        const payment = await Payment.create({
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent || null,
          paymentType: 'application',
          applicationType: 'nanny',
          applicationId: app._id,
          applicationModel: 'NannyApplication',
          applicantEmail: app.email,
          applicantName: app.fullName,
          amount: APPLICATION_FEES.nanny,
          status: session.payment_status === 'paid' ? 'completed' : 'pending',
          completedAt: session.payment_status === 'paid' ? new Date() : null
        });

        // Update application paymentStatus if Stripe says paid
        if (session.payment_status === 'paid' && app.paymentStatus !== 'paid') {
          app.paymentStatus = 'paid';
          app.stripePaymentIntentId = session.payment_intent;
          await app.save();
          console.log(`  [CREATED + UPDATED] ${app.fullName}: Payment record created and status updated to paid`);
        } else {
          console.log(`  [CREATED] ${app.fullName}: Payment record created (status: ${payment.status})`);
        }
        created++;
      } catch (appError) {
        console.log(`  [ERROR] ${app.fullName}: ${appError.message}`);
        errors++;
      }
    }

    // Process family applications
    console.log('\n=== Processing Family Applications ===');
    const familyApps = await FamilyApplication.find({
      $or: [
        { paymentStatus: 'paid' },
        { stripeSessionId: { $exists: true, $ne: null, $ne: '' } }
      ]
    });
    console.log(`Found ${familyApps.length} family applications with payment info`);

    for (const app of familyApps) {
      try {
        // Check if Payment already exists
        if (app.stripeSessionId) {
          const existingPayment = await Payment.findOne({ stripeSessionId: app.stripeSessionId });
          if (existingPayment) {
            console.log(`  [SKIP] ${app.parentName}: Payment record already exists`);
            skipped++;
            continue;
          }
        }

        // If no stripeSessionId but paid, we can't verify with Stripe
        if (!app.stripeSessionId && app.paymentStatus === 'paid') {
          console.log(`  [SKIP] ${app.parentName}: No Stripe session ID to verify`);
          skipped++;
          continue;
        }

        // Verify with Stripe
        let session;
        try {
          session = await stripe.checkout.sessions.retrieve(app.stripeSessionId);
        } catch (stripeError) {
          console.log(`  [ERROR] ${app.parentName}: Stripe session not found - ${stripeError.message}`);
          errors++;
          continue;
        }

        // Create Payment record
        const payment = await Payment.create({
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent || null,
          paymentType: 'application',
          applicationType: 'family',
          applicationId: app._id,
          applicationModel: 'FamilyApplication',
          applicantEmail: app.email,
          applicantName: app.parentName,
          amount: APPLICATION_FEES.family,
          status: session.payment_status === 'paid' ? 'completed' : 'pending',
          completedAt: session.payment_status === 'paid' ? new Date() : null
        });

        // Update application paymentStatus if Stripe says paid
        if (session.payment_status === 'paid' && app.paymentStatus !== 'paid') {
          app.paymentStatus = 'paid';
          app.stripePaymentIntentId = session.payment_intent;
          await app.save();
          console.log(`  [CREATED + UPDATED] ${app.parentName}: Payment record created and status updated to paid`);
        } else {
          console.log(`  [CREATED] ${app.parentName}: Payment record created (status: ${payment.status})`);
        }
        created++;
      } catch (appError) {
        console.log(`  [ERROR] ${app.parentName}: ${appError.message}`);
        errors++;
      }
    }

    // Summary
    console.log('\n=== Summary ===');
    console.log(`Payment records created: ${created}`);
    console.log(`Skipped (already exist): ${skipped}`);
    console.log(`Errors: ${errors}`);

    // Show current Payment count
    const totalPayments = await Payment.countDocuments();
    const completedPayments = await Payment.countDocuments({ status: 'completed' });
    console.log(`\nTotal Payment records in database: ${totalPayments}`);
    console.log(`Completed payments: ${completedPayments}`);

    await mongoose.connection.close();
    console.log('\nDone.');
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
};

syncPayments();
