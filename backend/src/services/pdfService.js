import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Club Nanny brand colors (RGB)
const COLORS = {
  // Brand colors
  sage: [139, 169, 158],           // #8BA99E - primary green
  sageLight: [232, 240, 237],      // Light sage background

  // Neutrals
  black: [26, 26, 26],             // #1A1A1A
  darkGrey: [55, 65, 81],
  grey: [107, 114, 128],
  lightGrey: [156, 163, 175],
  border: [229, 231, 235],
  background: [249, 250, 251],
  white: [255, 255, 255],

  // Status colors
  green: [34, 197, 94],
  greenLight: [220, 252, 231],
  amber: [217, 119, 6],
  amberLight: [254, 243, 199]
};

const PLACEMENT_FEES = {
  placement_local: { cents: 50000, dollars: 500, label: 'Local Placement Fee', description: 'Perfect for families seeking a part-time or full-time nanny who lives locally.' },
  placement_livein: { cents: 100000, dollars: 1000, label: 'Live-In Placement Fee', description: 'Ideal for families who prefer a nanny residing in their home for added flexibility and support.' }
};

const APP_URL = (process.env.FRONTEND_URL || 'https://clubnanny.com').replace(/\/+$/, '');
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'Leigh@clubnanny.com';

/**
 * Generate a professional PDF invoice
 */
export async function generateInvoicePDF(options) {
  const {
    invoiceNumber,
    applicantName,
    applicantEmail,
    feeType,
    paymentStatus = 'pending',
    paymentUrl,
    issueDate = new Date(),
    dueDate
  } = options;

  const feeInfo = PLACEMENT_FEES[feeType];
  if (!feeInfo) {
    throw new Error(`Invalid fee type: ${feeType}`);
  }

  const isPaid = paymentStatus === 'completed';

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        info: {
          Title: `Invoice ${invoiceNumber}`,
          Author: 'Club Nanny',
          Subject: 'Placement Fee Invoice'
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const W = doc.page.width;
      const H = doc.page.height;
      const M = 50;
      const CW = W - (M * 2);

      // ════════════════════════════════════════════════════════════
      // HEADER
      // ════════════════════════════════════════════════════════════

      doc.rect(0, 0, W, 110).fill(COLORS.black);

      // Logo
      const logoPath = path.join(__dirname, '../../../public/FinalLogo.jpg');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, M, 25, { height: 60 });
      } else {
        doc.font('Helvetica-Bold').fontSize(24).fillColor(COLORS.white)
          .text('Club Nanny', M, 42);
      }

      // Invoice title
      doc.font('Helvetica-Bold').fontSize(32).fillColor(COLORS.white)
        .text('INVOICE', W - M - 180, 30, { width: 180, align: 'right' });

      doc.font('Helvetica').fontSize(11).fillColor(COLORS.grey)
        .text(invoiceNumber, W - M - 180, 68, { width: 180, align: 'right' });

      // ════════════════════════════════════════════════════════════
      // STATUS & DATES
      // ════════════════════════════════════════════════════════════

      let y = 140;

      // Status badge
      const badgeBg = isPaid ? COLORS.greenLight : COLORS.amberLight;
      const badgeText = isPaid ? COLORS.green : COLORS.amber;
      const badgeLabel = isPaid ? 'PAID' : 'PAYMENT DUE';

      doc.roundedRect(M, y, 120, 30, 15).fill(badgeBg);
      doc.font('Helvetica-Bold').fontSize(11).fillColor(badgeText)
        .text(badgeLabel, M, y + 9, { width: 120, align: 'center' });

      // Dates
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.grey)
        .text('Issued:', W - M - 180, y + 2);
      doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.black)
        .text(formatDate(issueDate), W - M - 100, y + 2, { width: 100, align: 'right' });

      if (dueDate) {
        doc.font('Helvetica').fontSize(10).fillColor(COLORS.grey)
          .text('Due:', W - M - 180, y + 18);
        doc.font('Helvetica-Bold').fontSize(11).fillColor(isPaid ? COLORS.black : COLORS.amber)
          .text(formatDate(dueDate), W - M - 100, y + 18, { width: 100, align: 'right' });
      }

      // ════════════════════════════════════════════════════════════
      // BILL TO
      // ════════════════════════════════════════════════════════════

      y = 210;

      doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.grey)
        .text('BILL TO', M, y);

      doc.font('Helvetica-Bold').fontSize(18).fillColor(COLORS.black)
        .text(applicantName, M, y + 18);

      doc.font('Helvetica').fontSize(11).fillColor(COLORS.grey)
        .text(applicantEmail, M, y + 42);

      // ════════════════════════════════════════════════════════════
      // SERVICE TABLE
      // ════════════════════════════════════════════════════════════

      y = 300;

      // Table header - light grey background
      doc.rect(M, y, CW, 40).fill(COLORS.background);

      doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.darkGrey)
        .text('SERVICE', M + 20, y + 14)
        .text('AMOUNT', W - M - 80, y + 14, { width: 60, align: 'right' });

      y += 40;
      doc.moveTo(M, y).lineTo(W - M, y).strokeColor(COLORS.border).lineWidth(1).stroke();

      // Service row
      y += 25;

      // Dot indicator (green for local, amber for live-in)
      const dotColor = feeType === 'placement_local' ? COLORS.green : COLORS.amber;
      doc.circle(M + 14, y + 6, 5).fill(dotColor);

      doc.font('Helvetica-Bold').fontSize(14).fillColor(COLORS.black)
        .text(feeInfo.label, M + 30, y);

      doc.font('Helvetica').fontSize(10).fillColor(COLORS.grey)
        .text(feeInfo.description, M + 30, y + 22, { width: 320 });

      doc.font('Helvetica-Bold').fontSize(18).fillColor(COLORS.black)
        .text(`$${feeInfo.dollars.toLocaleString()}`, W - M - 80, y + 6, { width: 60, align: 'right' });

      y += 60;
      doc.moveTo(M, y).lineTo(W - M, y).strokeColor(COLORS.border).lineWidth(1).stroke();

      // ════════════════════════════════════════════════════════════
      // TOTALS
      // ════════════════════════════════════════════════════════════

      y += 20;
      const totalsX = W - M - 200;

      doc.font('Helvetica').fontSize(11).fillColor(COLORS.grey)
        .text('Subtotal', totalsX, y);
      doc.font('Helvetica').fontSize(11).fillColor(COLORS.black)
        .text(`$${feeInfo.dollars.toLocaleString()}.00`, totalsX + 100, y, { width: 100, align: 'right' });

      y += 22;

      doc.font('Helvetica').fontSize(11).fillColor(COLORS.grey)
        .text('Processing', totalsX, y);
      doc.font('Helvetica').fontSize(11).fillColor(COLORS.black)
        .text('$0.00', totalsX + 100, y, { width: 100, align: 'right' });

      y += 30;

      // Total box - sage green
      doc.roundedRect(totalsX, y, 200, 55, 8).fill(COLORS.sage);

      doc.font('Helvetica').fontSize(10).fillColor(COLORS.white)
        .text('TOTAL DUE', totalsX + 16, y + 12);

      doc.font('Helvetica-Bold').fontSize(24).fillColor(COLORS.white)
        .text(`$${feeInfo.dollars.toLocaleString()}.00`, totalsX + 16, y + 26, { width: 168, align: 'right' });

      y += 75;

      // ════════════════════════════════════════════════════════════
      // PAYMENT SECTION (if unpaid)
      // ════════════════════════════════════════════════════════════

      if (!isPaid && paymentUrl) {
        doc.roundedRect(M, y, CW, 80, 10).fill(COLORS.background);

        // Grey dollar icon
        const iconX = M + 30;
        const iconY = y + 40;
        doc.circle(iconX, iconY, 18).fill(COLORS.grey);
        doc.font('Helvetica-Bold').fontSize(18).fillColor(COLORS.white)
          .text('$', iconX - 6, iconY - 7);

        // Text
        doc.font('Helvetica-Bold').fontSize(14).fillColor(COLORS.black)
          .text('Complete Your Payment', M + 60, y + 22);

        doc.font('Helvetica').fontSize(10).fillColor(COLORS.grey)
          .text('Pay securely via Stripe', M + 60, y + 42);

        // Pay button - sage green
        const btnX = W - M - 130;
        const btnY = y + 20;
        doc.roundedRect(btnX, btnY, 110, 40, 6).fill(COLORS.sage);

        doc.font('Helvetica-Bold').fontSize(13).fillColor(COLORS.white)
          .text('Pay Now', btnX, btnY + 13, { width: 110, align: 'center' });

        doc.link(btnX, btnY, 110, 40, paymentUrl);

        y += 100;
      }

      // ════════════════════════════════════════════════════════════
      // PAYMENT TERMS
      // ════════════════════════════════════════════════════════════

      doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.grey)
        .text('PAYMENT TERMS', M, y);

      y += 16;

      doc.font('Helvetica').fontSize(10).fillColor(COLORS.grey);
      doc.text('•  Payment due within 14 days of invoice date.', M, y);
      doc.text('•  One-time fee for professional placement services.', M, y + 16);
      doc.text(`•  Questions? Contact ${SUPPORT_EMAIL}`, M, y + 32);

      // ════════════════════════════════════════════════════════════
      // FOOTER
      // ════════════════════════════════════════════════════════════

      const footerY = H - 60;

      doc.moveTo(M, footerY).lineTo(W - M, footerY).strokeColor(COLORS.border).lineWidth(1).stroke();

      doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.black)
        .text('Club Nanny', M, footerY + 16);

      doc.font('Helvetica').fontSize(9).fillColor(COLORS.grey)
        .text('Faith-centered childcare partnership', M, footerY + 30);

      doc.font('Helvetica').fontSize(9).fillColor(COLORS.grey)
        .text(APP_URL.replace(/^https?:\/\//, ''), 0, footerY + 23, { width: W, align: 'center' });

      doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.sage)
        .text('Thank you!', W - M - 80, footerY + 23, { width: 80, align: 'right' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(applicationId) {
  const d = new Date();
  const yy = d.getFullYear().toString().slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const id = applicationId.slice(-4).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `INV-${yy}${mm}-${id}${rand}`;
}

/**
 * Format date
 */
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
}

/**
 * Get fee info
 */
export function getFeeInfo(feeType) {
  return PLACEMENT_FEES[feeType];
}

export default {
  generateInvoicePDF,
  generateInvoiceNumber,
  getFeeInfo
};
