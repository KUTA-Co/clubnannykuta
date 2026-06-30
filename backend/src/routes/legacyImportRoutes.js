import express from 'express';
import mongoose from 'mongoose';
import { ContactSubmission, FamilyApplication, NannyApplication } from '../models/index.js';

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
  const headers = rows.shift().map((header) => header.replace(/^\uFEFF/, '').trim());
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
  let trimmed = String(value).trim();
  while (
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
    || (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed || undefined;
};

const pick = (row, ...keys) => {
  for (const key of keys) {
    const value = clean(row[key]);
    if (value !== undefined) return value;
  }
  return undefined;
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

const parseObjectId = (value) => {
  const cleaned = clean(value);
  return cleaned && mongoose.Types.ObjectId.isValid(cleaned) ? cleaned : undefined;
};

const parseJsonArray = (value) => {
  const cleaned = clean(value);
  if (!cleaned) return undefined;
  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};

function mapFamily(row) {
  const sourceId = pick(row, '_id', 'ID');
  const applied = parseDate(pick(row, 'createdAt', 'Applied'));
  const updated = parseDate(pick(row, 'updatedAt', 'Last Updated'));

  return {
    parentName: pick(row, 'parentName', 'Parent Name') || 'Legacy Family',
    email: lowerEmail(pick(row, 'email', 'Email')),
    phone: pick(row, 'phone', 'Phone'),
    city: pick(row, 'city', 'City'),
    state: pick(row, 'state', 'State'),
    numberOfChildren: pick(row, 'numberOfChildren', 'Number of Children'),
    childrenAges: pick(row, 'childrenAges', 'Children Ages'),
    startDate: pick(row, 'startDate', 'Start Date'),
    endDate: pick(row, 'endDate', 'End Date'),
    hoursPerWeek: pick(row, 'hoursPerWeek', 'Hours Per Week'),
    weeklySchedule: pick(row, 'weeklySchedule', 'Weekly Schedule'),
    specialNeeds: pick(row, 'specialNeeds', 'Special Needs'),
    church: pick(row, 'church', 'Church'),
    faithBackground: pick(row, 'faithBackground', 'Faith Background'),
    familyValues: pick(row, 'familyValues', 'Family Values'),
    nannyAgeRange: pick(row, 'nannyAgeRange', 'Nanny Age Range'),
    experienceLevel: pick(row, 'experienceLevel', 'Experience Level'),
    personalityPreferences: pick(row, 'personalityPreferences', 'Personality Preferences'),
    additionalInfo: pick(row, 'additionalInfo', 'Additional Info'),
    status: pick(row, 'status', 'Status')?.toLowerCase() || 'pending',
    paymentStatus: pick(row, 'paymentStatus', 'Payment Status')?.toLowerCase() || 'unpaid',
    stripeSessionId: pick(row, 'stripeSessionId'),
    stripePaymentIntentId: pick(row, 'stripePaymentIntentId'),
    placementFees: parseJsonArray(pick(row, 'placementFees')),
    matchedNannyId: parseObjectId(pick(row, 'matchedNannyId')),
    matchedNannyName: pick(row, 'matchedNannyName', 'Matched Nanny'),
    placementDate: parseDate(pick(row, 'placementDate', 'Placement Date')),
    placementEndDate: parseDate(pick(row, 'placementEndDate')),
    matchNotes: pick(row, 'matchNotes'),
    reviewNotes: pick(row, 'reviewNotes', 'Review Notes'),
    reviewedAt: parseDate(pick(row, 'reviewedAt')),
    reviewedBy: parseObjectId(pick(row, 'reviewedBy')),
    legacySourceId: sourceId ? `thinus-family-${sourceId}` : undefined,
    legacyImportedAt: new Date(),
    createdAt: applied,
    updatedAt: updated || applied
  };
}

function mapNanny(row) {
  const sourceId = pick(row, '_id', 'ID');
  const applied = parseDate(pick(row, 'createdAt', 'Applied'));
  const updated = parseDate(pick(row, 'updatedAt', 'Last Updated'));

  return {
    fullName: pick(row, 'fullName', 'Full Name') || 'Legacy Nanny',
    email: lowerEmail(pick(row, 'email', 'Email')),
    phone: pick(row, 'phone', 'Phone'),
    city: pick(row, 'city', 'City'),
    state: pick(row, 'state', 'State'),
    dateOfBirth: pick(row, 'dateOfBirth', 'Date of Birth'),
    university: pick(row, 'university', 'University'),
    yearsExperience: pick(row, 'yearsExperience', 'Years Experience'),
    ageGroups: pick(row, 'ageGroups', 'Age Groups'),
    experienceTypes: pick(row, 'experienceTypes', 'Experience Types'),
    experienceDetails: pick(row, 'experienceDetails', 'Experience Details'),
    church: pick(row, 'church', 'Church'),
    faithJourney: pick(row, 'faithJourney', 'Faith Journey'),
    whyCalled: pick(row, 'whyCalled', 'Why Called'),
    availableStartDate: pick(row, 'availableStartDate', 'Available Start Date'),
    availableEndDate: pick(row, 'availableEndDate', 'Available End Date'),
    hoursAvailable: pick(row, 'hoursAvailable', 'Hours Available'),
    locationPreferences: pick(row, 'locationPreferences', 'Location Preferences'),
    ageGroupPreferences: pick(row, 'ageGroupPreferences', 'Age Group Preferences'),
    additionalInfo: pick(row, 'additionalInfo', 'Additional Info'),
    backgroundCheckConsent: parseBoolean(pick(row, 'backgroundCheckConsent', 'Background Check Consent')),
    backgroundCheckStatus: pick(row, 'backgroundCheckStatus', 'Background Check Status')?.toLowerCase() || 'not_requested',
    status: pick(row, 'status', 'Status')?.toLowerCase() || 'pending',
    paymentStatus: pick(row, 'paymentStatus', 'Payment Status')?.toLowerCase() || 'unpaid',
    stripeSessionId: pick(row, 'stripeSessionId'),
    stripePaymentIntentId: pick(row, 'stripePaymentIntentId'),
    matchedFamilyId: parseObjectId(pick(row, 'matchedFamilyId')),
    matchedFamilyName: pick(row, 'matchedFamilyName', 'Matched Family'),
    placementDate: parseDate(pick(row, 'placementDate', 'Placement Date')),
    placementEndDate: parseDate(pick(row, 'placementEndDate')),
    matchNotes: pick(row, 'matchNotes'),
    reviewNotes: pick(row, 'reviewNotes', 'Review Notes'),
    reviewedAt: parseDate(pick(row, 'reviewedAt')),
    reviewedBy: parseObjectId(pick(row, 'reviewedBy')),
    backgroundCheckRequestedDate: parseDate(pick(row, 'backgroundCheckRequestedDate')),
    backgroundCheckCompletedDate: parseDate(pick(row, 'backgroundCheckCompletedDate')),
    backgroundCheckNotes: pick(row, 'backgroundCheckNotes'),
    legacySourceId: sourceId ? `thinus-nanny-${sourceId}` : undefined,
    legacyImportedAt: new Date(),
    createdAt: applied,
    updatedAt: updated || applied
  };
}

function mapContact(row) {
  return {
    _id: parseObjectId(pick(row, '_id')),
    name: pick(row, 'name', 'Name') || 'Legacy Contact',
    email: lowerEmail(pick(row, 'email', 'Email')),
    phone: pick(row, 'phone', 'Phone'),
    subject: pick(row, 'subject', 'Subject') || 'Website contact message',
    message: pick(row, 'message', 'Message') || 'Imported contact message',
    status: pick(row, 'status', 'Status')?.toLowerCase() || 'new',
    createdAt: parseDate(pick(row, 'createdAt', 'Created At')),
    updatedAt: parseDate(pick(row, 'updatedAt', 'Last Updated'))
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

async function upsertContact(payload) {
  if (!payload.email) {
    return { skipped: true };
  }

  let doc = payload._id ? await ContactSubmission.findById(payload._id) : null;
  if (!doc) {
    doc = await ContactSubmission.findOne({
      email: payload.email,
      subject: payload.subject,
      createdAt: payload.createdAt
    });
  }

  if (doc) {
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined) doc[key] = value;
    });
    await doc.save();
    return { updated: true };
  }

  await ContactSubmission.create(payload);
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

async function importContactRows(rows) {
  const summary = { label: 'contact', total: rows.length, created: 0, updated: 0, skipped: 0 };

  for (const row of rows) {
    const result = await upsertContact(mapContact(row));
    if (result.created) summary.created += 1;
    else if (result.updated) summary.updated += 1;
    else summary.skipped += 1;
  }

  return summary;
}

router.post('/', async (req, res) => {
  const configuredToken = process.env.LEGACY_IMPORT_TOKEN;
  const requestToken = req.get('x-legacy-import-token');
  const validTokens = [
    configuredToken,
    process.env.LEGACY_IMPORT_ONE_TIME_TOKEN
  ].filter(Boolean);

  if (!validTokens.length) {
    return res.status(404).json({ success: false, message: 'Legacy import is not enabled' });
  }

  if (!requestToken || !validTokens.includes(requestToken)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  try {
    const familyRows = csvObjects(req.body.familyCsv);
    const nannyRows = csvObjects(req.body.nannyCsv);
    const contactRows = csvObjects(req.body.contactCsv);

    const summaries = [
      await importRows('family', familyRows, FamilyApplication, mapFamily),
      await importRows('nanny', nannyRows, NannyApplication, mapNanny),
      await importContactRows(contactRows)
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
