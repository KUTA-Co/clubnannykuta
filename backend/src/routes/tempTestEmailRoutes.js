import express from 'express';
import emailService from '../services/emailService.js';

const router = express.Router();
const TEMP_TEST_TOKEN = 'club-nanny-temp-email-20260629-1640';

router.post('/sitter-emails', async (req, res) => {
  if (req.get('x-temp-test-token') !== TEMP_TEST_TOKEN) {
    return res.status(404).json({ success: false });
  }

  const testSitter = {
    firstName: 'Test',
    lastName: 'Sitter',
    email: 'hello@kuta.co.za'
  };

  const submitted = await emailService.sendSitterApplicationSubmittedToApplicant(testSitter);
  const approved = await emailService.sendSitterApprovalEmail(testSitter);

  res.json({
    success: Boolean(submitted?.success && approved?.success),
    submitted: { success: submitted?.success, id: submitted?.id },
    approved: { success: approved?.success, id: approved?.id }
  });
});

export default router;
