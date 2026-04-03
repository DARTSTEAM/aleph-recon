const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 8081;

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)
  .concat([
    'http://localhost:5173',
    'http://localhost:4173',
    'https://aleph-automation-4772ziyq2a-uc.a.run.app'
  ]);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) return cb(null, true);
    cb(new Error(`CORS: ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '1mb' }));

// ─── RATE LIMIT ───────────────────────────────────────────────────────────────
app.use('/api', rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 20,                    // max 20 requests/min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — slow down.' },
}));

// ─── API KEY AUTH ─────────────────────────────────────────────────────────────
const API_KEY = process.env.API_KEY;

const requireApiKey = (req, res, next) => {
  if (!API_KEY) {
    // Dev mode: no key configured, allow all (log warning)
    console.warn('[auth] API_KEY not set — running in open mode (dev only)');
    return next();
  }
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token || token !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized — invalid or missing API key.' });
  }
  next();
};

// ─── NODEMAILER TRANSPORTER ───────────────────────────────────────────────────
const createTransporter = () => {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn('[email] GMAIL_USER / GMAIL_APP_PASSWORD not set — email disabled');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
};

// ─── HEALTH ──────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    emailConfigured: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
  });
});

// ─── FOLLOW-UP EMAIL ─────────────────────────────────────────────────────────
app.post('/api/followup',
  requireApiKey,
  [
    body('io').notEmpty().withMessage('IO number is required'),
    body('account').notEmpty(),
    body('manager').notEmpty(),
    body('managerEmail').isEmail().withMessage('Valid manager email required'),
    body('sfBudget').isNumeric(),
    body('twBilling').isNumeric(),
    body('diff').isNumeric(),
    body('category').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
      io, account, manager, managerEmail,
      sfBudget, twBilling, diff, category,
      sentBy = 'finance-ops@alephholding.com',
      templateOverride,
    } = req.body;

    const defaultBody = `Hi ${manager},

We identified a reconciliation discrepancy for the following campaign IO and need your assistance to update Salesforce before month-end close.

── DISCREPANCY DETAILS ──────────────────────
IO Number:       ${io}
Account:         ${account}
SF Net Budget:   $${Number(sfBudget).toLocaleString('en-US', { minimumFractionDigits: 2 })}
Twitter Billing: $${Number(twBilling).toLocaleString('en-US', { minimumFractionDigits: 2 })}
Discrepancy:     -$${Math.abs(Number(diff)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
Category:        ${category}
────────────────────────────────────────────

Action Required: Please review and update the corresponding Salesforce Opportunity/IO so that it matches the Twitter billing amount.

Once corrected, the Finance team will mark this as resolved in Recon Studio.

If you believe this discrepancy is incorrect or requires escalation, please reply to this email.

Regards,
Aleph Revenue Recognition Team
(Sent automatically via Aleph Recon Studio)
`;

    const html = `
<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a2e">
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #E5E7EB">
    <div style="background:#0037FF;border-radius:8px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:14px">A</div>
    <span style="font-size:16px;font-weight:700;color:#0037FF">Aleph Recon Studio</span>
  </div>
  <h2 style="font-size:20px;font-weight:800;margin:0 0 8px">Reconciliation Discrepancy — Action Required</h2>
  <p style="color:#6B7280;font-size:14px;margin:0 0 24px">Hi <strong>${manager}</strong>, please review the discrepancy below and update Salesforce.</p>

  <div style="background:#F8F9FF;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #E0E7FF">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div><div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">IO Number</div><div style="font-weight:700;color:#0037FF;font-size:15px">${io}</div></div>
      <div><div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Account</div><div style="font-weight:600;font-size:15px">${account}</div></div>
      <div><div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">SF Net Budget</div><div style="font-weight:600;font-size:15px">$${Number(sfBudget).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div></div>
      <div><div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Twitter Billing</div><div style="font-weight:600;font-size:15px">$${Number(twBilling).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div></div>
      <div><div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Discrepancy</div><div style="font-weight:800;font-size:18px;color:#EF4444">-$${Math.abs(Number(diff)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div></div>
      <div><div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Category</div><span style="background:#FFF7ED;color:#C2410C;padding:3px 10px;border-radius:4px;font-size:12px;font-weight:700">${category}</span></div>
    </div>
  </div>

  <div style="background:#FFF5F5;border-radius:8px;padding:16px;border-left:3px solid #EF4444;margin-bottom:24px">
    <strong style="color:#EF4444">Action Required:</strong> Please update the Salesforce IO to match the Twitter billing amount. Reply to this email if you need to escalate.
  </div>

  <div style="border-top:1px solid #E5E7EB;padding-top:20px;font-size:12px;color:#9CA3AF">
    Sent by <strong>${sentBy}</strong> via Aleph Recon Studio · ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
  </div>
</div>`;

    try {
      const transporter = createTransporter();
      if (!transporter) {
        return res.status(503).json({ error: 'Email service not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD env vars.' });
      }

      const info = await transporter.sendMail({
        from: `"Aleph Finance Ops" <${process.env.GMAIL_USER}>`,
        to: managerEmail,
        cc: sentBy !== process.env.GMAIL_USER ? sentBy : undefined,
        subject: `[Aleph Finance] Reconciliation Discrepancy — IO ${io} | ${account}`,
        text: templateOverride || defaultBody,
        html,
      });

      console.log(`[email] Follow-up sent for ${io} → ${managerEmail} (${info.messageId})`);
      res.json({ success: true, messageId: info.messageId, to: managerEmail });

    } catch (err) {
      console.error('[email] Send error:', err.message);
      res.status(500).json({ error: 'Failed to send email', detail: err.message });
    }
  }
);

// ─── BULK NOTIFY ──────────────────────────────────────────────────────────────
app.post('/api/bulk-notify',
  requireApiKey,
  [body('items').isArray({ min: 1 }).withMessage('items array is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { items, sentBy = 'finance-ops@alephholding.com' } = req.body;
    const transporter = createTransporter();

    if (!transporter) {
      return res.status(503).json({ error: 'Email service not configured' });
    }

    const results = await Promise.allSettled(
      items.map(item =>
        transporter.sendMail({
          from: `"Aleph Finance Ops" <${process.env.GMAIL_USER}>`,
          to: item.managerEmail,
          subject: `[Aleph Finance] Reconciliation Discrepancy — IO ${item.io} | ${item.account}`,
          text: `Hi ${item.manager},\n\nIO ${item.io} (${item.account}) has a discrepancy of -$${Math.abs(item.diff || 0).toLocaleString()}.\n\nPlease update Salesforce.\n\nRegards,\nAleph Finance Ops`,
        })
      )
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`[email] Bulk notify: ${sent} sent, ${failed} failed`);
    res.json({ success: true, sent, failed, total: items.length });
  }
);

// ─── START ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`[api] Aleph Recon API running on port ${PORT}`));
