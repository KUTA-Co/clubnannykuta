import express from 'express';
import { FamilyApplication, NannyApplication } from '../models/index.js';

const router = express.Router();

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

function csvObjects(text) {
  const rows = parseCsv(text || '');
  if (!rows.length) return [];
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
    return { skipped: true };
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
    return { updated: true };
  }

  await Model.create(payload);
  return { created: true };
}

async function importRows(label, rows, Model, mapper) {
  const summary = { label, total: rows.length, created: 0, updated: 0, skipped: 0 };

  for (const row of rows) {
    const result = await upsertLegacy(Model, mapper(row));
    if (result.created) summary.created += 1;
    else if (result.updated) summary.updated += 1;
    else summary.skipped += 1;
  }

  return summary;
}

router.post('/', async (req, res) => {
  const configuredToken = process.env.LEGACY_IMPORT_TOKEN;
  const requestToken = req.get('x-legacy-import-token');

  if (!configuredToken) {
    return res.status(404).json({ success: false, message: 'Legacy import is not enabled' });
  }

  if (!requestToken || requestToken !== configuredToken) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  try {
    const familyRows = csvObjects(req.body.familyCsv);
    const nannyRows = csvObjects(req.body.nannyCsv);

    const summaries = [
      await importRows('family', familyRows, FamilyApplication, mapFamily),
      await importRows('nanny', nannyRows, NannyApplication, mapNanny)
    ];

    res.json({ success: true, summaries });
  } catch (error) {
    console.error('Legacy import error:', error);
    res.status(500).json({
      success: false,
      message: 'Legacy import failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
