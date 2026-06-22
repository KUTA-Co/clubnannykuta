/**
 * Migration Script: Migrate existing 1:1 matches to new Match collection
 *
 * WHAT THIS DOES:
 * - Reads existing matchedFamilyId from NannyApplications
 * - Creates Match documents in the new matches collection
 * - Does NOT delete or modify any existing data
 *
 * HOW TO RUN:
 * cd /var/www/club-nanny/backend
 * node src/scripts/migrateMatches.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

// Import models
import NannyApplication from '../models/NannyApplication.js';
import FamilyApplication from '../models/FamilyApplication.js';
import Match from '../models/Match.js';

async function migrateMatches() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/clubnanny';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    // Find all nanny applications that have a matchedFamilyId
    console.log('Finding existing matches...');
    const matchedNannies = await NannyApplication.find({
      matchedFamilyId: { $ne: null, $exists: true }
    });

    console.log(`Found ${matchedNannies.length} existing match(es) to migrate\n`);

    if (matchedNannies.length === 0) {
      console.log('No matches to migrate. Done!');
      await mongoose.disconnect();
      return;
    }

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const nanny of matchedNannies) {
      try {
        // Check if this match already exists in the Match collection
        const existingMatch = await Match.findOne({
          nannyId: nanny._id,
          familyId: nanny.matchedFamilyId
        });

        if (existingMatch) {
          console.log(`⏭️  Skipping: ${nanny.fullName} <-> ${nanny.matchedFamilyName} (already migrated)`);
          skipped++;
          continue;
        }

        // Get the family to ensure it exists
        const family = await FamilyApplication.findById(nanny.matchedFamilyId);

        if (!family) {
          console.log(`⚠️  Warning: Family not found for ${nanny.fullName} (familyId: ${nanny.matchedFamilyId})`);
          errors++;
          continue;
        }

        // Create the Match document
        const match = new Match({
          nannyId: nanny._id,
          familyId: family._id,
          nannyName: nanny.fullName,
          familyName: family.parentName,
          startDate: nanny.placementDate || null,
          endDate: nanny.placementEndDate || null,
          notes: nanny.matchNotes || null,
          status: 'active',
          createdAt: nanny.reviewedAt || nanny.updatedAt || new Date()
        });

        await match.save();
        console.log(`✅ Migrated: ${nanny.fullName} <-> ${family.parentName}`);
        migrated++;

      } catch (err) {
        console.log(`❌ Error migrating ${nanny.fullName}: ${err.message}`);
        errors++;
      }
    }

    console.log('\n========== MIGRATION COMPLETE ==========');
    console.log(`✅ Migrated: ${migrated}`);
    console.log(`⏭️  Skipped (already exists): ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('=========================================\n');

    // Show what's now in the Match collection
    const totalMatches = await Match.countDocuments();
    console.log(`Total matches in collection: ${totalMatches}`);

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB. Done!');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateMatches();
