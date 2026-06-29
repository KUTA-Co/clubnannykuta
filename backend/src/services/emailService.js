import dotenv from 'dotenv';
import FormData from 'form-data';
import Mailgun from 'mailgun.js';

// Load env vars before initializing Mailgun
dotenv.config();

// Only initialize the Mailgun client when an API key is present. Without this
// guard mailgun.js throws at import time and crashes the whole server — email
// is non-critical (especially in local dev), so we degrade gracefully instead.
let mg = null;
if (process.env.MAILGUN_API_KEY) {
  const mailgun = new Mailgun(FormData);
  mg = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY,
    url: process.env.MAILGUN_HOST || 'https://api.mailgun.net'
  });
} else {
  console.warn('⚠️  MAILGUN_API_KEY not set — emails will be skipped (set it in backend/.env to enable email).');
}

const DOMAIN = process.env.MAILGUN_DOMAIN || 'noreply.clubnanny.com';
const PUBLIC_CONTACT_EMAIL = 'leigh@clubnanny.com';
const DEFAULT_FROM_EMAIL = `Club Nanny <noreply@${DOMAIN}>`;
const configuredFromEmail = process.env.FROM_EMAIL || DEFAULT_FROM_EMAIL;
const FROM_EMAIL = /@kuta\.co\.za/i.test(configuredFromEmail)
  ? DEFAULT_FROM_EMAIL
  : configuredFromEmail;
const APP_URL = (process.env.FRONTEND_URL || 'https://clubnanny.com').replace(/\/+$/, '');
const SUPPORT_EMAIL = PUBLIC_CONTACT_EMAIL;
const REPLY_TO_EMAIL = PUBLIC_CONTACT_EMAIL;
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'Leigh@clubnanny.com')
  .split(',')
  .map(email => email.trim())
  .filter(Boolean);
const BRAND_COLOR = '#8BA99E';
const BRAND_MUTED = '#595959';
const BRAND_PAGE = '#FAF9F6';
const BRAND_BORDER = '#E5E2DC';
const LINK_STYLE = `color: ${BRAND_COLOR} !important; -webkit-text-fill-color: ${BRAND_COLOR} !important; text-decoration: none;`;
const CTA_STYLE = `display: inline-block; background-color: ${BRAND_COLOR}; color: #FFFFFF !important; -webkit-text-fill-color: #FFFFFF !important; text-decoration: none; padding: 14px 36px; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 24px 0; letter-spacing: 0.5px;`;
const HIGHLIGHT_BOX_STYLE = `background-color: ${BRAND_PAGE}; border-left: 3px solid ${BRAND_COLOR}; padding: 24px; margin: 24px 0;`;
const INFO_CARD_STYLE = `background-color: ${BRAND_PAGE}; border-radius: 8px; padding: 24px; margin: 20px 0;`;
const HELP_TEXT_STYLE = `font-size: 14px; color: ${BRAND_MUTED}; margin-top: 24px; padding-top: 24px; border-top: 1px solid ${BRAND_BORDER};`;

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function withEmailInlineDefaults(content) {
  return String(content)
    .replace(/class="cta-button" style="/g, `class="cta-button" style="${CTA_STYLE} `)
    .replace(/class="highlight-box" style="/g, `class="highlight-box" style="${HIGHLIGHT_BOX_STYLE} `)
    .replace(/class="info-card" style="/g, `class="info-card" style="${INFO_CARD_STYLE} `)
    .replace(/class="help-text" style="/g, `class="help-text" style="${HELP_TEXT_STYLE} `)
    .replace(/class="cta-button"(?![^>]*style=)/g, `class="cta-button" style="${CTA_STYLE}"`)
    .replace(/class="highlight-box"(?![^>]*style=)/g, `class="highlight-box" style="${HIGHLIGHT_BOX_STYLE}"`)
    .replace(/class="info-card"(?![^>]*style=)/g, `class="info-card" style="${INFO_CARD_STYLE}"`)
    .replace(/class="help-text"(?![^>]*style=)/g, `class="help-text" style="${HELP_TEXT_STYLE}"`);
}

// Base email template wrapper with Club Nanny branding
const baseTemplate = (content) => {
  const normalizedContent = withEmailInlineDefaults(content);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Club Nanny</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');

    :root {
      color-scheme: light;
      supported-color-schemes: light;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6;
      color: #1A1A1A;
      background-color: #FAF9F6;
    }

    .email-wrapper {
      width: 100%;
      background-color: #FAF9F6;
      padding: 40px 20px;
    }

    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: #FFFFFF;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #E5E2DC;
    }

    .email-header {
      background-color: #F7F8F6;
      padding: 32px 40px;
      text-align: center;
      border-bottom: 1px solid #E5E2DC;
    }

    .logo {
      font-family: 'Cinzel', serif;
      font-size: 28px;
      font-weight: 600;
      color: #8BA99E !important;
      -webkit-text-fill-color: #8BA99E !important;
      text-decoration: none;
      letter-spacing: 1px;
      mso-line-height-rule: exactly;
    }

    .logo span {
      color: #8BA99E !important;
      -webkit-text-fill-color: #8BA99E !important;
    }

    a {
      color: #8BA99E !important;
      -webkit-text-fill-color: #8BA99E !important;
    }

    a[x-apple-data-detectors],
    u + #club-nanny-email a,
    #MessageViewBody a {
      color: #8BA99E !important;
      -webkit-text-fill-color: #8BA99E !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }

    .email-body {
      padding: 40px;
    }

    .greeting {
      font-family: 'Cinzel', serif;
      font-size: 24px;
      font-weight: 600;
      color: #1A1A1A;
      margin-bottom: 20px;
    }

    .message {
      font-size: 16px;
      color: #595959;
      margin-bottom: 24px;
      line-height: 1.7;
    }

    .highlight-box {
      background: #FAF9F6;
      border-left: 3px solid #8BA99E;
      padding: 24px;
      margin: 24px 0;
    }

    .highlight-box h3 {
      font-family: 'Cinzel', serif;
      font-size: 12px;
      font-weight: 600;
      color: #8BA99E;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 16px;
    }

    .highlight-box p {
      font-size: 15px;
      color: #595959;
      margin: 8px 0;
    }

    .highlight-box strong {
      color: #1A1A1A;
    }

    .section {
      margin: 24px 0;
      padding: 24px;
      background: #FAF9F6;
      border-radius: 8px;
    }

    .section h3 {
      font-family: 'Cinzel', serif;
      font-size: 12px;
      font-weight: 600;
      color: #8BA99E;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #E5E2DC;
    }

    .field {
      margin: 12px 0;
    }

    .field-label {
      font-size: 12px;
      color: #595959;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .field-value {
      font-size: 15px;
      color: #1A1A1A;
      font-weight: 500;
    }

    .cta-button {
      display: inline-block;
      background-color: #8BA99E;
      color: #FFFFFF !important;
      -webkit-text-fill-color: #FFFFFF !important;
      text-decoration: none;
      padding: 14px 36px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      margin: 24px 0;
      letter-spacing: 0.5px;
    }

    .info-card {
      background: #FAF9F6;
      border-radius: 8px;
      padding: 24px;
      margin: 20px 0;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #E5E2DC;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      font-size: 14px;
      color: #595959;
    }

    .info-value {
      font-size: 14px;
      color: #1A1A1A;
      font-weight: 600;
    }

    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-new {
      background: #FFF3E0;
      color: #E65100;
    }

    .badge-family {
      background: #E3F2FD;
      color: #1565C0;
    }

    .badge-nanny {
      background: #F3E5F5;
      color: #7B1FA2;
    }

    .badge-contact {
      background: #E8F5E9;
      color: #2E7D32;
    }

    .email-footer {
      background: #FAF9F6;
      padding: 32px 40px;
      text-align: center;
      border-top: 1px solid #E5E2DC;
    }

    .footer-links a {
      color: #1A1A1A;
      text-decoration: none;
      font-size: 13px;
      margin: 0 12px;
    }

    .copyright {
      font-size: 12px;
      color: #595959;
      margin-top: 16px;
    }

    .help-text {
      font-size: 14px;
      color: #595959;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #E5E2DC;
    }

    .help-text a {
      color: #8BA99E;
      text-decoration: none;
      font-weight: 500;
    }

    .timestamp {
      font-size: 12px;
      color: #595959;
      margin-top: 8px;
    }

    @media (prefers-color-scheme: dark) {
      body,
      .email-wrapper,
      .email-container,
      .email-header,
      .email-footer,
      .highlight-box,
      .info-card,
      .section {
        background-color: #FAF9F6 !important;
        color: #1A1A1A !important;
      }

      .email-container {
        background-color: #FFFFFF !important;
      }

      .logo,
      .logo span,
      a {
        color: #8BA99E !important;
        -webkit-text-fill-color: #8BA99E !important;
      }
    }

    @media only screen and (max-width: 640px) {
      .email-wrapper {
        padding: 20px 12px !important;
      }

      .email-header,
      .email-body,
      .email-footer {
        padding-left: 22px !important;
        padding-right: 22px !important;
      }

      .logo {
        font-size: 25px !important;
      }
    }
  </style>
</head>
<body id="club-nanny-email" style="margin: 0; padding: 0; background-color: #FAF9F6; color: #1A1A1A;">
  <div class="email-wrapper" style="width: 100%; background-color: #FAF9F6; padding: 40px 20px;">
    <div class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E5E2DC;">
      <div class="email-header" style="background-color: #F7F8F6; padding: 32px 40px; text-align: center; border-bottom: 1px solid #E5E2DC;">
        <div class="logo" style="font-family: Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: 600; color: #8BA99E !important; -webkit-text-fill-color: #8BA99E !important; text-decoration: none; letter-spacing: 1px; line-height: 1.25;">
          <span style="color: #8BA99E !important; -webkit-text-fill-color: #8BA99E !important;">CLUB</span>
          <span style="color: #8BA99E !important; -webkit-text-fill-color: #8BA99E !important;">NANNY</span>
        </div>
      </div>
      ${normalizedContent}
      <div class="email-footer" style="background-color: #FAF9F6; padding: 32px 40px; text-align: center; border-top: 1px solid #E5E2DC;">
        <div class="footer-links">
          <a href="${APP_URL}" style="${LINK_STYLE}">Home</a>
          <a href="${APP_URL}/about" style="${LINK_STYLE}; margin-left: 14px; margin-right: 14px;">About</a>
          <a href="${APP_URL}/contact" style="${LINK_STYLE}">Contact</a>
        </div>
        <p class="copyright" style="font-size: 12px; color: #595959; margin-top: 16px;">
          © ${new Date().getFullYear()} Club Nanny. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
};

// Format a booking date (Date or string) into a friendly label
const formatBookingDate = (date) => {
  if (!date) return 'TBD';
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatEmailTime = (time) => {
  if (!time) return 'TBD';
  const value = String(time).trim();
  const existingPeriodMatch = value.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (existingPeriodMatch) {
    const hour = Number(existingPeriodMatch[1]);
    const minute = existingPeriodMatch[2];
    const period = existingPeriodMatch[3].toUpperCase();
    if (!minute || minute === '00') return `${hour} ${period}`;
    return `${hour}:${minute} ${period}`;
  }

  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return value;

  const hours = Number(match[1]);
  const minutes = match[2];
  if (Number.isNaN(hours)) return value;

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return minutes === '00' ? `${displayHours} ${period}` : `${displayHours}:${minutes} ${period}`;
};

const formatEmailTimeRange = (startTime, endTime) => `${formatEmailTime(startTime)} - ${formatEmailTime(endTime)}`;

// ============================================
// CONTACT FORM TEMPLATES
// ============================================

const contactFormAdminTemplate = (data) => {
  const date = new Date().toLocaleDateString('en-US');
  const copyPasteRow = `${date}\tContact\t${data.name}\t${data.email}\t${data.phone || ''}\t${data.subject}\t${data.message.replace(/\n/g, ' ')}`;

  return baseTemplate(`
  <div class="email-body">
    <div style="margin-bottom: 20px;">
      <span class="badge badge-new">New Inquiry</span>
      <span class="badge badge-contact">Contact Form</span>
    </div>
    <h1 class="greeting">New Contact Form Submission</h1>
    <p class="message">
      Someone has reached out through the Club Nanny website. Details below:
    </p>

    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Full Name</span>
        <span class="info-value">${data.name}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email</span>
        <span class="info-value"><a href="mailto:${data.email}" style="color: #8BA99E; text-decoration: none;">${data.email}</a></span>
      </div>
      <div class="info-row">
        <span class="info-label">Phone</span>
        <span class="info-value">${data.phone ? `<a href="tel:${data.phone}" style="color: #8BA99E; text-decoration: none;">${data.phone}</a>` : '<span style="color: #999;">Not provided</span>'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Inquiry Type</span>
        <span class="info-value">${data.subject}</span>
      </div>
    </div>

    <div class="section">
      <h3>Their Message</h3>
      <div class="field">
        <div class="field-value" style="white-space: pre-wrap; line-height: 1.6;">${data.message}</div>
      </div>
    </div>

    <center>
      <a href="mailto:${data.email}?subject=Re: Your Club Nanny Inquiry" class="cta-button">Reply to ${data.name}</a>
    </center>

    <p class="timestamp" style="text-align: center; margin-top: 24px;">
      Submitted on ${new Date().toLocaleDateString('en-US')}
    </p>

    <!-- Copy to Spreadsheet Section -->
    <div style="margin-top: 32px; padding: 20px; background: #f5f5f5; border-radius: 8px; border: 1px dashed #ccc;">
      <p style="font-size: 12px; color: #666; margin-bottom: 8px; font-weight: 600;">📋 COPY TO SPREADSHEET (select & copy the line below):</p>
      <p style="font-size: 11px; color: #888; margin-bottom: 12px;">Columns: Date | Type | Name | Email | Phone | Inquiry | Message</p>
      <div style="background: white; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 12px; word-break: break-all; border: 1px solid #ddd;">
        ${copyPasteRow}
      </div>
    </div>
  </div>
`);
};

const contactFormUserTemplate = (data) => baseTemplate(`
  <div class="email-body">
    <h1 class="greeting">We've Received Your Message</h1>
    <p class="message">
      Hello ${data.name},
    </p>
    <p class="message">
      Thank you for reaching out to Club Nanny. We've received your message and our team will get back to you within 24-48 hours.
    </p>

    <div class="highlight-box">
      <h3>Your Message</h3>
      <p><strong>Subject:</strong> ${data.subject}</p>
      <p style="margin-top: 12px; white-space: pre-wrap;">${data.message}</p>
    </div>

    <p class="message">
      In the meantime, feel free to explore our website or check out our FAQ section for quick answers.
    </p>

    <p class="help-text">
      Need urgent assistance? Reply to this email and we'll prioritize your request.
    </p>
  </div>
`);

// ============================================
// FAMILY APPLICATION TEMPLATES
// ============================================

const familyApplicationAdminTemplate = (data) => {
  const date = new Date().toLocaleDateString('en-US');
  const name = data.parentName || data.parent_name;
  const location = `${data.city}, ${data.state}`;
  const children = `${data.numberOfChildren || data.number_of_children} kids (${data.childrenAges || data.children_ages})`;
  const dates = `${data.startDate || data.start_date} to ${data.endDate || data.end_date}`;
  const copyPasteRow = `${date}\tFamily App\t${name}\t${data.email}\t${data.phone}\t${location}\t${children}\t${dates}\t${data.hoursPerWeek || data.hours_per_week}`;

  return baseTemplate(`
  <div class="email-body">
    <div style="margin-bottom: 20px;">
      <span class="badge badge-new">New</span>
      <span class="badge badge-family">Family Application</span>
    </div>
    <h1 class="greeting">New Family Application</h1>
    <p class="message">
      A new family has applied to join Club Nanny.
    </p>

    <div class="section">
      <h3>Family Information</h3>
      <div class="field">
        <div class="field-label">Parent/Guardian Name</div>
        <div class="field-value">${data.parentName || data.parent_name}</div>
      </div>
      <div class="field">
        <div class="field-label">Email Address</div>
        <div class="field-value"><a href="mailto:${data.email}" style="color: #8BA99E;">${data.email}</a></div>
      </div>
      <div class="field">
        <div class="field-label">Phone Number</div>
        <div class="field-value">${data.phone}</div>
      </div>
      <div class="field">
        <div class="field-label">Location</div>
        <div class="field-value">${data.city}, ${data.state}</div>
      </div>
      ${(data.howDidYouHear || data.how_did_you_hear) ? `
      <div class="field">
        <div class="field-label">How They Heard About Us</div>
        <div class="field-value">${data.howDidYouHear || data.how_did_you_hear}</div>
      </div>
      ` : ''}
      <div class="field">
        <div class="field-label">Number of Children</div>
        <div class="field-value">${data.numberOfChildren || data.number_of_children}</div>
      </div>
      <div class="field">
        <div class="field-label">Children's Ages</div>
        <div class="field-value">${data.childrenAges || data.children_ages}</div>
      </div>
    </div>

    <div class="section">
      <h3>Childcare Needs</h3>
      <div class="field">
        <div class="field-label">Start Date</div>
        <div class="field-value">${data.startDate || data.start_date}</div>
      </div>
      <div class="field">
        <div class="field-label">End Date</div>
        <div class="field-value">${data.endDate || data.end_date}</div>
      </div>
      <div class="field">
        <div class="field-label">Hours Per Week</div>
        <div class="field-value">${data.hoursPerWeek || data.hours_per_week}</div>
      </div>
      <div class="field">
        <div class="field-label">Weekly Schedule</div>
        <div class="field-value" style="white-space: pre-wrap;">${data.weeklySchedule || data.weekly_schedule}</div>
      </div>
      ${(data.specialNeeds || data.special_needs) ? `
      <div class="field">
        <div class="field-label">Special Needs/Considerations</div>
        <div class="field-value" style="white-space: pre-wrap;">${data.specialNeeds || data.special_needs}</div>
      </div>
      ` : ''}
    </div>

    <div class="section">
      <h3>Faith & Values</h3>
      ${(data.church || data.faith_community) ? `
      <div class="field">
        <div class="field-label">Church/Faith Community</div>
        <div class="field-value">${data.church || data.faith_community}</div>
      </div>
      ` : ''}
      <div class="field">
        <div class="field-label">Faith Background</div>
        <div class="field-value" style="white-space: pre-wrap;">${data.faithBackground || data.faith_background}</div>
      </div>
      <div class="field">
        <div class="field-label">Family Values</div>
        <div class="field-value" style="white-space: pre-wrap;">${data.familyValues || data.family_values}</div>
      </div>
    </div>

    <div class="section">
      <h3>Preferences</h3>
      ${(data.nannyAgeRange || data.nanny_age_range) ? `
      <div class="field">
        <div class="field-label">Preferred Nanny Age Range</div>
        <div class="field-value">${data.nannyAgeRange || data.nanny_age_range}</div>
      </div>
      ` : ''}
      ${(data.experienceLevel || data.experience_level) ? `
      <div class="field">
        <div class="field-label">Preferred Experience Level</div>
        <div class="field-value">${data.experienceLevel || data.experience_level}</div>
      </div>
      ` : ''}
      <div class="field">
        <div class="field-label">Personality & Style Preferences</div>
        <div class="field-value" style="white-space: pre-wrap;">${data.personalityPreferences || data.personality_preferences}</div>
      </div>
      ${(data.additionalInfo || data.additional_info) ? `
      <div class="field">
        <div class="field-label">Additional Information</div>
        <div class="field-value" style="white-space: pre-wrap;">${data.additionalInfo || data.additional_info}</div>
      </div>
      ` : ''}
    </div>

    <center>
      <a href="mailto:${data.email}" class="cta-button">Contact Family</a>
    </center>

    <p class="timestamp">Submitted on ${new Date().toLocaleDateString('en-US')}</p>

    <!-- Copy to Spreadsheet Section -->
    <div style="margin-top: 32px; padding: 20px; background: #f5f5f5; border-radius: 8px; border: 1px dashed #ccc;">
      <p style="font-size: 12px; color: #666; margin-bottom: 8px; font-weight: 600;">📋 COPY TO SPREADSHEET (select & copy the line below):</p>
      <p style="font-size: 11px; color: #888; margin-bottom: 12px;">Columns: Date | Type | Name | Email | Phone | Location | Children | Dates | Hours/Week</p>
      <div style="background: white; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 12px; word-break: break-all; border: 1px solid #ddd;">
        ${copyPasteRow}
      </div>
    </div>
  </div>
`);
};

const familyApplicationUserTemplate = (data) => baseTemplate(`
  <div class="email-body">
    <h1 class="greeting">Application Received</h1>
    <p class="message">
      Dear ${data.parentName || data.parent_name},
    </p>
    <p class="message">
      Thank you for applying to Club Nanny. We're excited that you're interested in finding exceptional childcare for your family.
    </p>

    <div class="highlight-box">
      <h3>What Happens Next?</h3>
      <p>Our team will review your application and reach out within <strong>2-3 business days</strong> to discuss your family's needs and how we can help.</p>
    </div>

    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Application Type</span>
        <span class="info-value">Family</span>
      </div>
      <div class="info-row">
        <span class="info-label">Submitted</span>
        <span class="info-value">${new Date().toLocaleDateString('en-US')}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status</span>
        <span class="info-value" style="color: #8BA99E;">Under Review</span>
      </div>
    </div>

    <p class="message">
      While you wait, feel free to explore our website to learn more about our nannies and the Club Nanny experience.
    </p>

    <p class="help-text">
      Questions? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
    </p>
  </div>
`);

// ============================================
// NANNY APPLICATION TEMPLATES
// ============================================

const nannyApplicationAdminTemplate = (data) => {
  const date = new Date().toLocaleDateString('en-US');
  const name = data.fullName || data.full_name;
  const location = `${data.city}, ${data.state}`;
  const dates = `${data.availableStartDate || data.available_start_date} to ${data.availableEndDate || data.available_end_date}`;
  const copyPasteRow = `${date}\tNanny App\t${name}\t${data.email}\t${data.phone}\t${location}\t${data.university}\t${data.yearsExperience || data.years_experience}\t${dates}\t${data.hoursAvailable || data.hours_available}`;

  return baseTemplate(`
  <div class="email-body">
    <div style="margin-bottom: 20px;">
      <span class="badge badge-new">New</span>
      <span class="badge badge-nanny">Nanny Application</span>
    </div>
    <h1 class="greeting">New Nanny Application</h1>
    <p class="message">
      A new nanny has applied to join Club Nanny.
    </p>

    <div class="section">
      <h3>Personal Information</h3>
      <div class="field">
        <div class="field-label">Full Name</div>
        <div class="field-value">${data.fullName || data.full_name}</div>
      </div>
      <div class="field">
        <div class="field-label">Email Address</div>
        <div class="field-value"><a href="mailto:${data.email}" style="color: #8BA99E;">${data.email}</a></div>
      </div>
      <div class="field">
        <div class="field-label">Phone Number</div>
        <div class="field-value">${data.phone}</div>
      </div>
      <div class="field">
        <div class="field-label">Location</div>
        <div class="field-value">${data.city}, ${data.state}</div>
      </div>
      ${(data.howDidYouHear || data.how_did_you_hear) ? `
      <div class="field">
        <div class="field-label">How They Heard About Us</div>
        <div class="field-value">${data.howDidYouHear || data.how_did_you_hear}</div>
      </div>
      ` : ''}
      <div class="field">
        <div class="field-label">Date of Birth</div>
        <div class="field-value">${data.dateOfBirth || data.date_of_birth}</div>
      </div>
      <div class="field">
        <div class="field-label">School or Training Program</div>
        <div class="field-value">${data.university}</div>
      </div>
    </div>

    <div class="section">
      <h3>Experience</h3>
      <div class="field">
        <div class="field-label">Years of Experience</div>
        <div class="field-value">${data.yearsExperience || data.years_experience}</div>
      </div>
      <div class="field">
        <div class="field-label">Age Groups Worked With</div>
        <div class="field-value">${data.ageGroups || data.age_groups}</div>
      </div>
      <div class="field">
        <div class="field-label">Types of Experience</div>
        <div class="field-value">${data.experienceTypes || data.experience_types}</div>
      </div>
      <div class="field">
        <div class="field-label">Experience Details</div>
        <div class="field-value" style="white-space: pre-wrap;">${data.experienceDetails || data.experience_details}</div>
      </div>
    </div>

    <div class="section">
      <h3>Faith Journey</h3>
      ${(data.church || data.faith_community) ? `
      <div class="field">
        <div class="field-label">Church/Faith Community</div>
        <div class="field-value">${data.church || data.faith_community}</div>
      </div>
      ` : ''}
      <div class="field">
        <div class="field-label">Faith Journey</div>
        <div class="field-value" style="white-space: pre-wrap;">${data.faithJourney || data.faith_journey}</div>
      </div>
      <div class="field">
        <div class="field-label">Why Called to Serve Families</div>
        <div class="field-value" style="white-space: pre-wrap;">${data.whyCalled || data.why_called}</div>
      </div>
    </div>

    <div class="section">
      <h3>Availability</h3>
      <div class="field">
        <div class="field-label">Available Start Date</div>
        <div class="field-value">${data.availableStartDate || data.available_start_date}</div>
      </div>
      <div class="field">
        <div class="field-label">Available End Date</div>
        <div class="field-value">${data.availableEndDate || data.available_end_date}</div>
      </div>
      <div class="field">
        <div class="field-label">Hours Available Per Week</div>
        <div class="field-value">${data.hoursAvailable || data.hours_available}</div>
      </div>
      ${(data.locationPreferences || data.location_preferences) ? `
      <div class="field">
        <div class="field-label">Location Preferences</div>
        <div class="field-value">${data.locationPreferences || data.location_preferences}</div>
      </div>
      ` : ''}
      ${(data.ageGroupPreferences || data.age_group_preferences) ? `
      <div class="field">
        <div class="field-label">Age Group Preferences</div>
        <div class="field-value">${data.ageGroupPreferences || data.age_group_preferences}</div>
      </div>
      ` : ''}
      ${(data.additionalInfo || data.additional_info) ? `
      <div class="field">
        <div class="field-label">Additional Information</div>
        <div class="field-value" style="white-space: pre-wrap;">${data.additionalInfo || data.additional_info}</div>
      </div>
      ` : ''}
    </div>

    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Background Check Consent</span>
        <span class="info-value" style="color: #2E7D32;">Agreed</span>
      </div>
      <div class="info-row">
        <span class="info-label">Terms & Conditions</span>
        <span class="info-value" style="color: #2E7D32;">Agreed</span>
      </div>
    </div>

    <center>
      <a href="mailto:${data.email}" class="cta-button">Contact Applicant</a>
    </center>

    <p class="timestamp">Submitted on ${new Date().toLocaleDateString('en-US')}</p>

    <!-- Copy to Spreadsheet Section -->
    <div style="margin-top: 32px; padding: 20px; background: #f5f5f5; border-radius: 8px; border: 1px dashed #ccc;">
      <p style="font-size: 12px; color: #666; margin-bottom: 8px; font-weight: 600;">📋 COPY TO SPREADSHEET (select & copy the line below):</p>
      <p style="font-size: 11px; color: #888; margin-bottom: 12px;">Columns: Date | Type | Name | Email | Phone | Location | University | Experience | Dates | Hours/Week</p>
      <div style="background: white; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 12px; word-break: break-all; border: 1px solid #ddd;">
        ${copyPasteRow}
      </div>
    </div>
  </div>
`);
};

const nannyApplicationUserTemplate = (data) => baseTemplate(`
  <div class="email-body">
    <h1 class="greeting">Application Received</h1>
    <p class="message">
      Dear ${data.fullName || data.full_name},
    </p>
    <p class="message">
      Thank you for applying to become a Club Nanny caregiver. We're thrilled that you're interested in joining our community of exceptional childcare providers.
    </p>

    <div class="highlight-box">
      <h3>What Happens Next?</h3>
      <p>Our team will carefully review your application. If your profile matches what our families are looking for, we'll reach out within <strong>3-5 business days</strong> to schedule an interview.</p>
    </div>

    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Application Type</span>
        <span class="info-value">Nanny</span>
      </div>
      <div class="info-row">
        <span class="info-label">Submitted</span>
        <span class="info-value">${new Date().toLocaleDateString('en-US')}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status</span>
        <span class="info-value" style="color: #8BA99E;">Under Review</span>
      </div>
    </div>

    <p class="message">
      In the meantime, make sure your phone and email are accessible so we can reach you.
    </p>

    <p class="help-text">
      Questions about your application? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
    </p>
  </div>
`);

// ============================================
// EMAIL SERVICE CLASS
// ============================================

class EmailService {
  constructor() {
    this.mg = mg;
    this.domain = DOMAIN;
    this.from = FROM_EMAIL;
    this.replyTo = REPLY_TO_EMAIL;
    this.adminEmails = ADMIN_EMAILS;
  }

  async send({ to, subject, html }) {
    if (!this.mg) {
      console.warn(`Email skipped (Mailgun not configured): "${subject}"`);
      return { success: false, error: 'Email not configured' };
    }
    try {
      const result = await this.mg.messages.create(this.domain, {
        from: this.from,
        to: Array.isArray(to) ? to : [to],
        'h:Reply-To': this.replyTo,
        subject,
        html
      });

      console.log(`Email sent successfully: ${result.id}`);
      return { success: true, id: result.id };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // CONTACT FORM
  // ============================================

  async sendContactFormToAdmin(data) {
    return this.send({
      to: this.adminEmails,
      subject: `New Contact Form: ${data.subject}`,
      html: contactFormAdminTemplate(data)
    });
  }

  async sendContactFormConfirmation(data) {
    return this.send({
      to: data.email,
      subject: "We've Received Your Message - Club Nanny",
      html: contactFormUserTemplate(data)
    });
  }

  async handleContactForm(data) {
    const adminResult = await this.sendContactFormToAdmin(data);
    const userResult = await this.sendContactFormConfirmation(data);

    return {
      admin: adminResult,
      user: userResult,
      success: adminResult.success && userResult.success
    };
  }

  // ============================================
  // FAMILY APPLICATION
  // ============================================

  async sendFamilyApplicationToAdmin(data) {
    const name = data.parentName || data.parent_name;
    return this.send({
      to: this.adminEmails,
      subject: `New Family Application: ${name}`,
      html: familyApplicationAdminTemplate(data)
    });
  }

  async sendFamilyApplicationConfirmation(data) {
    return this.send({
      to: data.email,
      subject: 'Application Received - Club Nanny',
      html: familyApplicationUserTemplate(data)
    });
  }

  async handleFamilyApplication(data) {
    const adminResult = await this.sendFamilyApplicationToAdmin(data);
    const userResult = await this.sendFamilyApplicationConfirmation(data);

    return {
      admin: adminResult,
      user: userResult,
      success: adminResult.success && userResult.success
    };
  }

  // ============================================
  // NANNY APPLICATION
  // ============================================

  async sendNannyApplicationToAdmin(data) {
    const name = data.fullName || data.full_name;
    return this.send({
      to: this.adminEmails,
      subject: `New Nanny Application: ${name}`,
      html: nannyApplicationAdminTemplate(data)
    });
  }

  async sendNannyApplicationConfirmation(data) {
    return this.send({
      to: data.email,
      subject: 'Application Received - Club Nanny',
      html: nannyApplicationUserTemplate(data)
    });
  }

  async handleNannyApplication(data) {
    const adminResult = await this.sendNannyApplicationToAdmin(data);
    const userResult = await this.sendNannyApplicationConfirmation(data);

    return {
      admin: adminResult,
      user: userResult,
      success: adminResult.success && userResult.success
    };
  }

  // ============================================
  // PASSWORD RESET
  // ============================================

  async sendPasswordResetEmail(email, resetUrl) {
    const html = baseTemplate(`
      <div class="email-body">
        <h1 class="greeting">Reset Your Password</h1>
        <p class="message">
          We received a request to reset your Club Nanny password. Click the button below to create a new password.
        </p>

        <center>
          <a href="${resetUrl}" class="cta-button">Reset Password</a>
        </center>

        <div class="highlight-box">
          <h3>Important</h3>
          <p>This link will expire in <strong>1 hour</strong>.</p>
          <p style="margin-top: 8px;">If you didn't request this reset, you can safely ignore this email.</p>
        </div>

        <p class="help-text">
          Having trouble? Copy and paste this link into your browser:<br/>
          <a href="${resetUrl}" style="word-break: break-all;">${resetUrl}</a>
        </p>
      </div>
    `);

    return this.send({
      to: email,
      subject: 'Reset Your Password - Club Nanny',
      html
    });
  }

  // ============================================
  // PAYMENT CONFIRMATION
  // ============================================

  async sendPaymentConfirmation(data) {
    const { email, name, type, amount } = data;
    const typeLabel = type === 'family' ? 'Family' : 'Nanny';
    const formattedAmount = `$${(amount / 100).toFixed(2)}`;

    const html = baseTemplate(`
      <div class="email-body">
        <h1 class="greeting">Payment Confirmed</h1>
        <p class="message">
          Dear ${name},
        </p>
        <p class="message">
          Thank you for your payment. Your ${typeLabel.toLowerCase()} application fee has been successfully processed.
        </p>

        <div class="info-card">
          <div class="info-row">
            <span class="info-label">Application Type</span>
            <span class="info-value">${typeLabel}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Amount Paid</span>
            <span class="info-value">${formattedAmount}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date</span>
            <span class="info-value">${new Date().toLocaleDateString('en-US')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status</span>
            <span class="info-value" style="color: #2E7D32;">Confirmed</span>
          </div>
        </div>

        <div class="highlight-box">
          <h3>What's Next?</h3>
          <p>Our team will review your application and contact you within <strong>2-3 business days</strong> to discuss next steps.</p>
        </div>

        <p class="help-text">
          Questions about your application? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
        </p>
      </div>
    `);

    return this.send({
      to: email,
      subject: 'Payment Confirmed - Club Nanny',
      html
    });
  }

  // ============================================
  // SITTER APPLICATION NOTIFICATIONS
  // ============================================

  async sendSitterApplicationSubmittedToAdmin(sitter) {
    const name = `${sitter.firstName || ''} ${sitter.lastName || ''}`.trim() || sitter.email;
    const adminUrl = `${APP_URL}/admin/sitters/${sitter._id}`;

    const html = baseTemplate(`
      <div class="email-body">
        <div style="margin-bottom: 20px;">
          <span class="badge badge-new">New Sitter Application</span>
        </div>
        <h1 class="greeting">New sitter application has been submitted!</h1>
        <p class="message">
          A sitter has submitted their application and completed payment. Please review and vet this applicant in the admin dashboard.
        </p>

        <div class="info-card">
          <div class="info-row">
            <span class="info-label">Applicant</span>
            <span class="info-value">${name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value"><a href="mailto:${sitter.email}" style="color: #8BA99E;">${sitter.email}</a></span>
          </div>
          <div class="info-row">
            <span class="info-label">Location</span>
            <span class="info-value">${[sitter.city, sitter.state].filter(Boolean).join(', ') || 'Not provided'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status</span>
            <span class="info-value" style="color: #ED6C02;">Pending Approval</span>
          </div>
        </div>

        <center>
          <a href="${adminUrl}" class="cta-button">Vet Sitter</a>
        </center>
      </div>
    `);

    return this.send({
      to: SUPPORT_EMAIL,
      subject: 'New sitter application has been submitted!',
      html
    });
  }

  async sendSitterApplicationSubmittedToApplicant(sitter) {
    const name = `${sitter.firstName || ''} ${sitter.lastName || ''}`.trim() || 'there';

    const html = baseTemplate(`
      <div class="email-body">
        <h1 class="greeting">Application Submitted</h1>
        <p class="message">
          Dear ${name},
        </p>
        <p class="message">
          Your application with Club Nanny has been submitted and is currently being processed. We will notify you when your journey with us can start!
        </p>

        <div class="highlight-box">
          <h3>What's Next?</h3>
          <p>Our team will review your application and notify you by email once your account has been approved.</p>
          <p>Please send 2 references with email addresses to <a href="mailto:${SUPPORT_EMAIL}" style="color: #8BA99E !important; text-decoration: none;">${SUPPORT_EMAIL}</a>.</p>
          <p>Be looking in your inbox for an email to approve the background check. Please note: if you are under age 16, you WILL need your parent's permission and approval for this step.</p>
          <p>Our team will reach out to schedule your video call.</p>
        </div>
      </div>
    `);

    return this.send({
      to: sitter.email,
      subject: 'Your Club Nanny Application Has Been Submitted',
      html
    });
  }

  async sendSitterApprovalEmail(sitter) {
    const name = `${sitter.firstName || ''} ${sitter.lastName || ''}`.trim() || 'there';
    const appUrl = `${APP_URL}/sitting/login`;

    const html = baseTemplate(`
      <div class="email-body">
        <h1 class="greeting">You're Approved!</h1>
        <p class="message">
          Dear ${name},
        </p>
        <p class="message">
          Your Club Nanny sitter application has been approved. You can now open the Club Nanny web app, finish setting up your profile, and start browsing available sitter jobs.
        </p>

        <center>
          <a href="${appUrl}" class="cta-button" style="background-color: #F7F8F6; border: 1px solid #8BA99E; color: #8BA99E !important; text-decoration: none;">Open the Club Nanny Web App</a>
        </center>

        <div class="highlight-box">
          <h3>How to download the app</h3>
          <p>Club Nanny is a web app. You do not download it from the App Store or Google Play.</p>
          <p>Open this link in your browser: <a href="${appUrl}" style="color: #8BA99E;">${appUrl}</a></p>
          <p>On iPhone or iPad, tap the Share button and choose <strong>Add to Home Screen</strong>. On Android, Chrome, Edge, or desktop, use the browser menu or install icon and choose <strong>Install</strong> or <strong>Add to Home screen</strong>.</p>
        </div>

        <div class="highlight-box">
          <h3>Turn on notifications</h3>
          <p>After logging in, go to <strong>My Profile</strong> and enable Club Nanny push notifications. Please make sure browser notifications are allowed for Club Nanny.</p>
          <p>You can use the <strong>Test Notification</strong> button in the app to confirm notifications are working on your device.</p>
        </div>

        <p class="help-text">
          Questions? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
        </p>
      </div>
    `);

    return this.send({
      to: sitter.email,
      subject: 'Your Club Nanny Sitter Application Has Been Approved',
      html
    });
  }

  async sendSitterRejectionEmail(sitter, options = {}) {
    const name = `${sitter.firstName || ''} ${sitter.lastName || ''}`.trim() || 'there';
    const membershipRefunded = Boolean(options.membershipRefunded);

    const html = baseTemplate(`
      <div class="email-body">
        <h1 class="greeting">An Update on Your Application</h1>
        <p class="message">
          Dear ${name},
        </p>
        <p class="message">
          Thank you so much for taking the time to apply to Club Nanny. We are grateful for your interest in serving families through our community.
        </p>
        <p class="message">
          After careful review, we are unable to move forward with your sitter application at this time. This decision does not take away from the care, effort, and heart you put into your application.
        </p>

        ${membershipRefunded ? `
        <div class="highlight-box">
          <h3>Refund Notice</h3>
          <p>
            Your $12 first month subscription fee has been refunded. This refund may not reflect in your account immediately; please allow up to 3 business days for it to appear with your bank or card provider.
          </p>
        </div>
        ` : ''}

        <p class="message">
          We wish you the very best as you continue forward, and we appreciate the opportunity to get to know you.
        </p>

        <p class="help-text">
          Questions? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
        </p>
      </div>
    `);

    return this.send({
      to: sitter.email,
      subject: 'An Update on Your Club Nanny Application',
      html
    });
  }

  async handleSitterApplicationSubmitted(sitter) {
    const adminResult = await this.sendSitterApplicationSubmittedToAdmin(sitter);
    const applicantResult = await this.sendSitterApplicationSubmittedToApplicant(sitter);

    return {
      admin: adminResult,
      applicant: applicantResult,
      success: adminResult.success && applicantResult.success
    };
  }

  async sendSittingFamilyApplicationSubmittedToAdmin(family) {
    const name = family.householdName || family.email;
    const adminUrl = `${APP_URL}/admin/sitting-families`;

    const html = baseTemplate(`
      <div class="email-body">
        <div style="margin-bottom: 20px;">
          <span class="badge badge-new">New Sitter Family</span>
        </div>
        <h1 class="greeting">New sitter-family application has been submitted!</h1>
        <p class="message">
          A family has completed payment and registered for Club Nanny sitter services.
        </p>

        <div class="info-card">
          <div class="info-row">
            <span class="info-label">Household</span>
            <span class="info-value">${name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value"><a href="mailto:${family.email}" style="color: #8BA99E;">${family.email}</a></span>
          </div>
          <div class="info-row">
            <span class="info-label">Location</span>
            <span class="info-value">${[family.city, family.state].filter(Boolean).join(', ') || 'Not provided'}</span>
          </div>
        </div>

        <center>
          <a href="${adminUrl}" class="cta-button">View Sitter Families</a>
        </center>
      </div>
    `);

    return this.send({
      to: SUPPORT_EMAIL,
      subject: 'New sitter-family application has been submitted!',
      html
    });
  }

  async sendSittingFamilyApplicationSubmittedToApplicant(family) {
    const name = family.householdName || 'there';
    const appUrl = `${APP_URL}/sitting/login`;

    const html = baseTemplate(`
      <div class="email-body">
        <h1 class="greeting">Application Submitted</h1>
        <p class="message">
          Dear ${name},
        </p>
        <p class="message">
          Your Club Nanny family application has been submitted and your account is ready for sitter services.
        </p>

        <div class="highlight-box">
          <h3>What's Next?</h3>
          <p>You can log in to the Club Nanny app to create requests and connect with approved sitters.</p>
        </div>

        <center>
          <a href="${appUrl}" class="cta-button">Open Club Nanny App</a>
        </center>
      </div>
    `);

    return this.send({
      to: family.email,
      subject: 'Your Club Nanny Family Application Has Been Submitted',
      html
    });
  }

  async handleSittingFamilyApplicationSubmitted(family) {
    const adminResult = await this.sendSittingFamilyApplicationSubmittedToAdmin(family);
    const applicantResult = await this.sendSittingFamilyApplicationSubmittedToApplicant(family);

    return {
      admin: adminResult,
      applicant: applicantResult,
      success: adminResult.success && applicantResult.success
    };
  }

  async sendPlacementFeeConfirmation(data) {
    const { email, name, feeType, amount } = data;
    const feeTypeLabel = feeType === 'placement_local' ? 'Local Placement' : 'Live-In Placement';
    const formattedAmount = `$${(amount / 100).toFixed(2)}`;

    const html = baseTemplate(`
      <div class="email-body">
        <h1 class="greeting">Placement Fee Confirmed</h1>
        <p class="message">
          Dear ${name},
        </p>
        <p class="message">
          Thank you for your payment. Your placement fee has been successfully processed, and we're excited to begin the matching process!
        </p>

        <div class="info-card">
          <div class="info-row">
            <span class="info-label">Fee Type</span>
            <span class="info-value">${feeTypeLabel}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Amount Paid</span>
            <span class="info-value">${formattedAmount}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date</span>
            <span class="info-value">${new Date().toLocaleDateString('en-US')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status</span>
            <span class="info-value" style="color: #2E7D32;">Confirmed</span>
          </div>
        </div>

        <div class="highlight-box">
          <h3>What's Next?</h3>
          <p>Our team will now begin the matching process to find you the perfect nanny. We'll be in touch soon with potential matches!</p>
        </div>

        <p class="help-text">
          Questions? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
        </p>
      </div>
    `);

    return this.send({
      to: email,
      subject: 'Placement Fee Confirmed - Club Nanny',
      html
    });
  }

  // ============================================
  // APPLICATION STATUS UPDATE
  // ============================================

  async sendApplicationStatusUpdate(data) {
    const { email, name, type, status, notes } = data;
    const typeLabel = type === 'family' ? 'Family' : 'Nanny';

    const statusMessages = {
      approved: {
        title: 'Application Approved!',
        message: `Congratulations! Your ${typeLabel.toLowerCase()} application has been approved. Our team will be in touch shortly to discuss next steps.`,
        color: '#2E7D32'
      },
      rejected: {
        title: 'An Update on Your Application',
        message: `Thank you so much for taking the time to apply to Club Nanny. After careful review, we're unable to move forward with your ${typeLabel.toLowerCase()} application at this time. We are grateful for the care and effort you shared with us, and we wish you the very best as you continue forward.`,
        color: '#D32F2F'
      },
      reviewing: {
        title: 'Application Under Review',
        message: `Your ${typeLabel.toLowerCase()} application is currently being reviewed by our team. We'll be in touch soon.`,
        color: '#ED6C02'
      },
      inactive: {
        title: 'Application Update',
        message: `Your application has been marked as inactive.`,
        color: '#757575'
      }
    };

    const statusInfo = statusMessages[status] || statusMessages.reviewing;

    const html = baseTemplate(`
      <div class="email-body">
        <h1 class="greeting">${statusInfo.title}</h1>
        <p class="message">
          Dear ${name},
        </p>
        <p class="message">
          ${statusInfo.message}
        </p>

        <div class="info-card">
          <div class="info-row">
            <span class="info-label">Application Type</span>
            <span class="info-value">${typeLabel}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status</span>
            <span class="info-value" style="color: ${statusInfo.color}; text-transform: capitalize;">${status}</span>
          </div>
        </div>

        ${notes ? `
        <div class="highlight-box">
          <h3>Additional Notes</h3>
          <p>${notes}</p>
        </div>
        ` : ''}

        <p class="help-text">
          Questions? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
        </p>
      </div>
    `);

    return this.send({
      to: email,
      subject: `${statusInfo.title} - Club Nanny`,
      html
    });
  }

  // ============================================
  // CUSTOM EMAIL
  // ============================================

  async sendCustomEmail(data) {
    const { to, subject, message, applicantName } = data;
    const name = applicantName || 'there';

    const html = baseTemplate(`
      <div class="email-body">
        <h1 class="greeting">Hello ${name}</h1>
        <div class="message" style="white-space: pre-wrap;">
          ${message}
        </div>

        <p class="help-text">
          Questions? Reply to this email or contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
        </p>
      </div>
    `);

    return this.send({
      to,
      subject,
      html
    });
  }

  // ============================================
  // PLACEMENT FEE INVOICE
  // ============================================

  async sendInvoiceEmail(data) {
    const {
      applicantEmail,
      applicantName,
      invoiceNumber,
      feeType,
      amount,
      paymentUrl,
      pdfBuffer,
      customMessage
    } = data;

    const feeLabel = feeType === 'placement_local' ? 'Local Placement' : 'Live-In Placement';
    const formattedAmount = `$${(amount / 100).toFixed(2)}`;

    const html = baseTemplate(`
      <div class="email-body">
        <h1 class="greeting">Invoice for ${feeLabel} Fee</h1>
        <p class="message">
          Dear ${applicantName},
        </p>
        <p class="message">
          Thank you for choosing Club Nanny! We're excited to help you find the perfect childcare match for your family.
        </p>

        ${customMessage ? `
        <div class="highlight-box">
          <h3>Message from Club Nanny</h3>
          <p style="white-space: pre-wrap;">${customMessage}</p>
        </div>
        ` : ''}

        <div class="info-card">
          <div class="info-row">
            <span class="info-label">Invoice Number</span>
            <span class="info-value">${invoiceNumber}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Fee Type</span>
            <span class="info-value">${feeLabel}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Amount Due</span>
            <span class="info-value" style="font-size: 18px; color: #1A1A1A;">${formattedAmount}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status</span>
            <span class="info-value" style="color: #ED6C02;">Payment Required</span>
          </div>
        </div>

        <center>
          <a href="${paymentUrl}" class="cta-button" style="background-color: #8BA99E;">Pay Now - ${formattedAmount}</a>
        </center>

        <p class="message" style="margin-top: 24px;">
          A PDF invoice is attached for your records. If you have any questions about this invoice, please don't hesitate to reach out.
        </p>

        <p class="help-text">
          Questions? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
        </p>
      </div>
    `);

    if (!this.mg) {
      console.warn(`Invoice email skipped (Mailgun not configured): ${invoiceNumber}`);
      return { success: false, error: 'Email not configured' };
    }
    try {
      const result = await this.mg.messages.create(this.domain, {
        from: this.from,
        to: applicantEmail,
        'h:Reply-To': this.replyTo,
        subject: `Invoice ${invoiceNumber} - Club Nanny ${feeLabel} Fee`,
        html,
        attachment: pdfBuffer ? [{
          data: pdfBuffer,
          filename: `ClubNanny_Invoice_${invoiceNumber}.pdf`,
          contentType: 'application/pdf'
        }] : undefined
      });

      console.log(`Invoice email sent successfully: ${result.id}`);
      return { success: true, id: result.id };
    } catch (error) {
      console.error('Invoice email send error:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // TEAM NOTIFICATION
  // ============================================

  async notifyTeamAboutApplication(data) {
    const { application, applicationType, message, notifiedBy } = data;
    const typeLabel = applicationType === 'family' ? 'Family' : 'Nanny';
    const name = applicationType === 'family' ? application.parentName : application.fullName;
    const location = application.city && application.state ? `${application.city}, ${application.state}` : 'Not specified';

    const html = baseTemplate(`
      <div class="email-body">
        <div style="margin-bottom: 20px;">
          <span class="badge badge-new">Team Alert</span>
          <span class="badge ${applicationType === 'family' ? 'badge-family' : 'badge-nanny'}">${typeLabel} Application</span>
        </div>
        <h1 class="greeting">Attention Required</h1>
        <p class="message">
          ${notifiedBy} has flagged a ${typeLabel.toLowerCase()} application for team review.
        </p>

        <div class="info-card">
          <div class="info-row">
            <span class="info-label">Applicant</span>
            <span class="info-value">${name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value"><a href="mailto:${application.email}" style="color: #8BA99E;">${application.email}</a></span>
          </div>
          <div class="info-row">
            <span class="info-label">Location</span>
            <span class="info-value">${location}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status</span>
            <span class="info-value" style="text-transform: capitalize;">${application.status}</span>
          </div>
        </div>

        ${message ? `
        <div class="highlight-box">
          <h3>Message from ${notifiedBy}</h3>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
        ` : ''}

        <center>
          <a href="${APP_URL}/admin/${applicationType === 'family' ? 'families' : 'nannies'}/${application._id}" class="cta-button">View Application</a>
        </center>
      </div>
    `);

    return this.send({
      to: this.adminEmails,
      subject: `Team Alert: ${typeLabel} Application - ${name}`,
      html
    });
  }

  // ============================================
  // IMMEDIATE APPLICATION NOTIFICATIONS
  // ============================================

  /**
   * Send immediate notification to applicant when they submit (before payment)
   */
  async sendApplicationReceivedToApplicant(data) {
    const { email, name, type } = data;
    const typeLabel = type === 'family' ? 'Family' : 'Nanny';

    const html = baseTemplate(`
      <div class="email-body">
        <h1 class="greeting">We Received Your Application!</h1>
        <p class="message">
          Dear ${name},
        </p>
        <p class="message">
          Thank you for applying to Club Nanny! We've received your ${typeLabel.toLowerCase()} application and are excited to learn more about you.
        </p>

        <div class="highlight-box">
          <h3>What's Next?</h3>
          <p>
            <strong>Step 1:</strong> Complete your application fee payment (${type === 'family' ? '$250' : '$75'})<br/>
            <strong>Step 2:</strong> Our team reviews your application<br/>
            <strong>Step 3:</strong> We'll contact you within 2-3 business days
          </p>
        </div>

        <p class="message">
          If you haven't completed payment yet, please do so to finalize your application. You should have been redirected to our secure payment page.
        </p>

        <p class="help-text">
          Questions? We're here to help! Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
        </p>
      </div>
    `);

    return this.send({
      to: email,
      subject: `Application Received - Club Nanny`,
      html
    });
  }

  /**
   * Send immediate notification to admins when new application is submitted
   */
  async sendNewApplicationAlertToAdmin(data) {
    const { type, name, email, phone, city, state, applicationId } = data;
    const typeLabel = type === 'family' ? 'Family' : 'Nanny';
    const location = city && state ? `${city}, ${state}` : 'Not specified';
    const adminUrl = `${APP_URL}/admin/${type === 'family' ? 'families' : 'nannies'}/${applicationId}`;

    const html = baseTemplate(`
      <div class="email-body">
        <div style="margin-bottom: 20px;">
          <span class="badge badge-new">New Application</span>
          <span class="badge ${type === 'family' ? 'badge-family' : 'badge-nanny'}">${typeLabel}</span>
        </div>

        <h1 class="greeting">New ${typeLabel} Application</h1>
        <p class="message">
          A new ${typeLabel.toLowerCase()} application has been submitted. Payment is pending.
        </p>

        <div class="info-card">
          <div class="info-row">
            <span class="info-label">Applicant</span>
            <span class="info-value">${name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value"><a href="mailto:${email}" style="color: #8BA99E;">${email}</a></span>
          </div>
          <div class="info-row">
            <span class="info-label">Phone</span>
            <span class="info-value">${phone || 'Not provided'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Location</span>
            <span class="info-value">${location}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Payment</span>
            <span class="info-value" style="color: #ED6C02;">Pending</span>
          </div>
        </div>

        <center>
          <a href="${adminUrl}" class="cta-button">View Application</a>
        </center>

        <p class="help-text" style="margin-top: 24px;">
          You'll receive another notification once payment is completed.
        </p>
      </div>
    `);

    return this.send({
      to: this.adminEmails,
      subject: `New ${typeLabel} Application: ${name} (Payment Pending)`,
      html
    });
  }

  /**
   * Handle immediate notification when application is submitted
   */
  async handleApplicationSubmitted(data) {
    const { type, application } = data;
    const name = type === 'family' ? application.parentName : application.fullName;

    try {
      // Send to applicant
      const applicantResult = await this.sendApplicationReceivedToApplicant({
        email: application.email,
        name,
        type
      });

      // Send to admins
      const adminResult = await this.sendNewApplicationAlertToAdmin({
        type,
        name,
        email: application.email,
        phone: application.phone,
        city: application.city,
        state: application.state,
        applicationId: application._id
      });

      return {
        applicant: applicantResult,
        admin: adminResult,
        success: applicantResult.success && adminResult.success
      };
    } catch (error) {
      console.error('Error sending application submitted notifications:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // ADMIN ALERT (Urgent notifications)
  // ============================================

  /**
   * Send urgent alert to admin team
   * Used for edge cases like orphaned payments
   */
  async sendAdminAlert(data) {
    const { subject, message } = data;

    const html = baseTemplate(`
      <div class="email-body">
        <div style="margin-bottom: 20px;">
          <span class="badge" style="background-color: #D32F2F; color: white;">URGENT</span>
        </div>
        <h1 class="greeting">Admin Alert</h1>
        <div class="highlight-box" style="border-left-color: #D32F2F; background-color: #FFF3F3;">
          <pre style="white-space: pre-wrap; font-family: inherit; margin: 0;">${message}</pre>
        </div>
        <p class="timestamp">Alert sent on ${new Date().toLocaleString('en-US')}</p>
      </div>
    `);

    return this.send({
      to: this.adminEmails,
      subject: `[ALERT] ${subject}`,
      html
    });
  }

  // ============================================
  // CLUB NANNY — BOOKING NOTIFICATIONS
  // ============================================

  /**
   * New job posted in the sitter's area
   */
  async sendNewJobAlert(data) {
    const { to, sitterName, date, startTime, endTime, city, state, numberOfChildren, requestId } = data;
    const dateLabel = formatBookingDate(date);
    const timeRange = formatEmailTimeRange(startTime, endTime);
    const jobUrl = `${APP_URL}/sitting/sitter/jobs/${requestId || ''}`;

    const html = baseTemplate(`
      <div class="email-body">
        <h1 class="greeting">New Babysitting Request Near You</h1>
        <p class="message">Hi ${sitterName || 'there'},</p>
        <p class="message">A family in <strong>${city}, ${state}</strong> just posted a new babysitting request. If you're available, respond before someone else does!</p>

        <div class="info-card">
          <div class="info-row">
            <span class="info-label">Date</span>
            <span class="info-value">${dateLabel}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Time</span>
            <span class="info-value">${timeRange}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Children</span>
            <span class="info-value">${numberOfChildren}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Location</span>
            <span class="info-value">${city}, ${state}</span>
          </div>
        </div>

        <center>
          <a href="${jobUrl}" class="cta-button" style="background-color: #8BA99E;">View Job</a>
        </center>
      </div>
    `);

    return this.send({ to, subject: `New Babysitting Request in ${city} — Club Nanny`, html });
  }

  /**
   * A sitter expressed interest — notify the family
   */
  async sendSitterRespondedToFamily(data) {
    const { to, familyName, sitterName, date, startTime, endTime, requestId } = data;
    const dateLabel = formatBookingDate(date);
    const timeRange = formatEmailTimeRange(startTime, endTime);
    const requestUrl = `${APP_URL}/sitting/family/requests/${requestId || ''}`;

    const html = baseTemplate(`
      <div class="email-body">
        <h1 class="greeting">A Sitter Is Interested!</h1>
        <p class="message">Hi ${familyName || 'there'},</p>
        <p class="message"><strong>${sitterName}</strong> responded to your babysitting request for <strong>${dateLabel}</strong> (${timeRange}). Review their profile and confirm them when you're ready.</p>

        <center>
          <a href="${requestUrl}" class="cta-button" style="background-color: #8BA99E;">View Responses</a>
        </center>
      </div>
    `);

    return this.send({ to, subject: 'A Sitter Responded to Your Request — Club Nanny', html });
  }

  /**
   * Family confirmed the sitter — notify the sitter
   */
  async sendBookingConfirmedToSitter(data) {
    const { to, sitterName, familyName, date, startTime, endTime, address, city, state } = data;
    const dateLabel = formatBookingDate(date);
    const timeRange = formatEmailTimeRange(startTime, endTime);
    const location = [address, [city, state].filter(Boolean).join(', ')].filter(Boolean).join(' — ');

    const html = baseTemplate(`
      <div class="email-body">
        <h1 class="greeting">You're Booked!</h1>
        <p class="message">Hi ${sitterName || 'there'},</p>
        <p class="message"><strong>${familyName || 'A family'}</strong> confirmed you for their babysitting request. The contact details are now available in your dashboard.</p>

        <div class="info-card">
          <div class="info-row">
            <span class="info-label">Date</span>
            <span class="info-value">${dateLabel}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Time</span>
            <span class="info-value">${timeRange}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Location</span>
            <span class="info-value">${location || 'See dashboard'}</span>
          </div>
        </div>

        <center>
          <a href="${APP_URL}/sitting/sitter/bookings" class="cta-button" style="background-color: #8BA99E;">View Booking</a>
        </center>
      </div>
    `);

    return this.send({ to, subject: 'Booking Confirmed — Club Nanny', html });
  }

  /**
   * A booking was cancelled — notify the affected party.
   * `by` is 'family' or 'sitter'.
   */
  async sendBookingCancelled(data) {
    const { to, recipientName, by, date, startTime, endTime, reason } = data;
    const dateLabel = formatBookingDate(date);
    const timeRange = formatEmailTimeRange(startTime, endTime);
    const whoCancelled = by === 'sitter' ? 'The sitter' : 'The family';
    const followUp = by === 'sitter'
      ? 'Your request has been reopened so other sitters in your area can respond.'
      : 'No further action is needed.';
    const reasonHtml = reason
      ? `<div class="highlight-box"><h3>Cancellation Reason</h3><p>${escapeHtml(reason)}</p></div>`
      : '';

    const html = baseTemplate(`
      <div class="email-body">
        <h1 class="greeting">Booking Cancelled</h1>
        <p class="message">Hi ${recipientName || 'there'},</p>
        <p class="message">${whoCancelled} cancelled the booking scheduled for <strong>${dateLabel}</strong> (${timeRange}). ${followUp}</p>
        ${reasonHtml}
      </div>
    `);

    return this.send({ to, subject: 'Booking Cancelled — Club Nanny', html });
  }
}

// Export singleton instance
const emailService = new EmailService();

export default emailService;
export { EmailService };
