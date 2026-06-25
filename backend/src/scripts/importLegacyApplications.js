import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import { FamilyApplication, NannyApplication } from '../models/index.js';

const args = process.argv.slice(2);

const getArg = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
};

const hasArg = (name) => args.includes(name);

const envPath = getArg('--env');
if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const familyCsvPath = getArg('--family');
const nannyCsvPath = getArg('--nanny');
const dryRun = hasArg('--dry-run');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(value);
      value = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(value);
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
      value = '';
      continue;
    }

    value += char;
  }

  row.push(value);
  if (row.some((cell) => cell !== '')) rows.push(row);
  return rows;
}

function readCsvObjects(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const rows = parseCsv(text);
  const headers = rows.shift().map((header) => header.trim());

  return rows.map((row) => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = (row[index] || '').trim();
    });
    return obj;
  });
}

const clean = (value) => {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed || undefined;
};

const lowerEmail = (value) => clean(value)?.toLowerCase();

const parseDate = (value) => {
  const cleaned = clean(value);
  if (!cleaned) return undefined;
  const date = new Date(cleaned);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const parseBoolean = (value) => {
  const cleaned = clean(value)?.toLowerCase();
  if (!cleaned) return false;
  return ['true', 'yes', 'y', '1', 'agreed'].includes(cleaned);
};

function mapFamily(row) {
  const applied = parseDate(row.Applied);
  const updated = parseDate(row['Last Updated']);

  return {
    parentName: clean(row['Parent Name']) || 'Legacy Family',
    email: lowerEmail(row.Email),
    phone: clean(row.Phone),
    city: clean(row.City),
    state: clean(row.State),
    numberOfChildren: clean(row['Number of Children']),
    childrenAges: clean(row['Children Ages']),
    startDate: clean(row['Start Date']),
    endDate: clean(row['End Date']),
    hoursPerWeek: clean(row['Hours Per Week']),
    weeklySchedule: clean(row['Weekly Schedule']),
    specialNeeds: clean(row['Special Needs']),
    church: clean(row.Church),
    faithBackground: clean(row['Faith Background']),
    familyValues: clean(row['Family Values']),
    nannyAgeRange: clean(row['Nanny Age Range']),
    experienceLevel: clean(row['Experience Level']),
    personalityPreferences: clean(row['Personality Preferences']),
    additionalInfo: clean(row['Additional Info']),
    status: clean(row.Status)?.toLowerCase() || 'pending',
    paymentStatus: clean(row['Payment Status'])?.toLowerCase() || 'unpaid',
    matchedNannyName: clean(row['Matched Nanny']),
    placementDate: parseDate(row['Placement Date']),
    reviewNotes: clean(row['Review Notes']),
    legacySourceId: clean(row.ID) ? `thinus-family-${clean(row.ID)}` : undefined,
    legacyImportedAt: new Date(),
    createdAt: applied,
    updatedAt: updated || applied
  };
}

function mapNanny(row) {
  const applied = parseDate(row.Applied);
  const updated = parseDate(row['Last Updated']);

  return {
    fullName: clean(row['Full Name']) || 'Legacy Nanny',
    email: lowerEmail(row.Email),
    phone: clean(row.Phone),
    city: clean(row.City),
    state: clean(row.State),
    dateOfBirth: clean(row['Date of Birth']),
    university: clean(row.University),
    yearsExperience: clean(row['Years Experience']),
    ageGroups: clean(row['Age Groups']),
    experienceTypes: clean(row['Experience Types']),
    experienceDetails: clean(row['Experience Details']),
    church: clean(row.Church),
    faithJourney: clean(row['Faith Journey']),
    whyCalled: clean(row['Why Called']),
    availableStartDate: clean(row['Available Start Date']),
    availableEndDate: clean(row['Available End Date']),
    hoursAvailable: clean(row['Hours Available']),
    locationPreferences: clean(row['Location Preferences']),
    ageGroupPreferences: clean(row['Age Group Preferences']),
    additionalInfo: clean(row['Additional Info']),
    backgroundCheckConsent: parseBoolean(row['Background Check Consent']),
    backgroundCheckStatus: clean(row['Background Check Status'])?.toLowerCase() || 'not_requested',
    status: clean(row.Status)?.toLowerCase() || 'pending',
    paymentStatus: clean(row['Payment Status'])?.toLowerCase() || 'unpaid',
    matchedFamilyName: clean(row['Matched Family']),
    placementDate: parseDate(row['Placement Date']),
    reviewNotes: clean(row['Review Notes']),
    legacySourceId: clean(row.ID) ? `thinus-nanny-${clean(row.ID)}` : undefined,
    legacyImportedAt: new Date(),
    createdAt: applied,
    updatedAt: updated || applied
  };
}

async function upsertLegacy(Model, payload) {
  if (!payload.email) {
    return { skipped: true, reason: 'missing_email' };
  }

  if (dryRun) {
    return { dryRun: true, action: 'parse', email: payload.email };
  }

  const filter = payload.legacySourceId
    ? { legacySourceId: payload.legacySourceId }
    : { email: payload.email };

  let doc = await Model.findOne(filter);
  if (!doc && payload.legacySourceId) {
    doc = await Model.findOne({ email: payload.email });
  }

  if (doc) {
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined) doc[key] = value;
    });
    await doc.save();
    return { updated: true, id: doc._id.toString(), email: payload.email };
  }

  const created = await Model.create(payload);
  return { created: true, id: created._id.toString(), email: payload.email };
}

async function importFile(label, filePath, Model, mapper) {
  if (!filePath) return { label, total: 0, created: 0, updated: 0, skipped: 0, dryRun: 0 };

  const rows = readCsvObjects(filePath);
  const summary = { label, total: rows.length, created: 0, updated: 0, skipped: 0, dryRun: 0 };

  for (const row of rows) {
    const result = await upsertLegacy(Model, mapper(row));
    if (result.created) summary.created += 1;
    else if (result.updated) summary.updated += 1;
    else if (result.dryRun) summary.dryRun += 1;
    else summary.skipped += 1;
  }

  return summary;
}

async function main() {
  if (!familyCsvPath && !nannyCsvPath) {
    console.error('Usage: node src/scripts/importLegacyApplications.js --family /path/family.csv --nanny /path/nanny.csv [--env /path/.env] [--dry-run]');
    process.exit(1);
  }

  if (!dryRun) {
    await connectDB();
  }

  const summaries = [];
  summaries.push(await importFile('family', familyCsvPath, FamilyApplication, mapFamily));
  summaries.push(await importFile('nanny', nannyCsvPath, NannyApplication, mapNanny));

  console.log(JSON.stringify({ dryRun, summaries }, null, 2));

  if (!dryRun) {
    await mongoose.connection.close();
  }
}

main().catch(async (error) => {
  console.error(error);
  if (mongoose.connection.readyState) await mongoose.connection.close();
  process.exit(1);
});
