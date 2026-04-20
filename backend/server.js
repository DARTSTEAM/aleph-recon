const express    = require('express');
const cors       = require('cors');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const rateLimit  = require('express-rate-limit');
const multer     = require('multer');
const upload     = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const app  = express();
const PORT = process.env.PORT || 8081;

// ─── Firestore Admin (optional — used for scheduled jobs) ─────────────────────
let db = null;
try {
  const admin = require('firebase-admin');
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
  db = admin.firestore();
  console.log('[firestore] Admin SDK connected');
} catch (e) {
  console.warn('[firestore] Admin SDK not available — scheduled jobs will be no-ops:', e.message);
}

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

app.use(express.json({ limit: '2mb' }));

// ─── RATE LIMIT ───────────────────────────────────────────────────────────────
app.use('/api', rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — slow down.' },
}));

// ─── API KEY AUTH ─────────────────────────────────────────────────────────────
const API_KEY = process.env.API_KEY;

const requireApiKey = (req, res, next) => {
  if (!API_KEY) {
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

// ─── Cron Secret (for Cloud Scheduler) ───────────────────────────────────────
const CRON_SECRET = process.env.CRON_SECRET;

const requireCronSecret = (req, res, next) => {
  const secret = req.headers['x-cron-secret'] || req.query.secret;
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized cron request.' });
  }
  next();
};

// ─── NODEMAILER ───────────────────────────────────────────────────────────────
const createTransporter = () => {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    console.warn('[email] GMAIL_USER / GMAIL_APP_PASSWORD not set — email disabled');
    return null;
  }
  return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
};

// ─── Email builder helpers ────────────────────────────────────────────────────
const buildFollowUpHtml = ({ io, account, manager, sfBudget, twBilling, diff, category, sentBy }) => `
<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a2e">
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #E5E7EB">
    <div style="background:#0037FF;border-radius:8px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:14px">A</div>
    <span style="font-size:16px;font-weight:700;color:#0037FF">Aleph Recon Studio</span>
  </div>
  <h2 style="font-size:20px;font-weight:800;margin:0 0 8px">Reconciliation Discrepancy — Action Required</h2>
  <p style="color:#6B7280;font-size:14px;margin:0 0 24px">Hi <strong>${manager}</strong>, please review the discrepancy below and update Salesforce.</p>
  <div style="background:#F8F9FF;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #E0E7FF">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div><div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;margin-bottom:4px">IO Number</div><div style="font-weight:700;color:#0037FF">${io}</div></div>
      <div><div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;margin-bottom:4px">Account</div><div style="font-weight:600">${account}</div></div>
      <div><div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;margin-bottom:4px">SF Net Budget</div><div style="font-weight:600">$${Number(sfBudget).toLocaleString('en-US',{minimumFractionDigits:2})}</div></div>
      <div><div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;margin-bottom:4px">Billed Amount</div><div style="font-weight:600">$${Number(twBilling).toLocaleString('en-US',{minimumFractionDigits:2})}</div></div>
      <div><div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;margin-bottom:4px">Discrepancy</div><div style="font-weight:800;font-size:18px;color:#EF4444">-$${Math.abs(Number(diff)).toLocaleString('en-US',{minimumFractionDigits:2})}</div></div>
      <div><div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;margin-bottom:4px">Category</div><span style="background:#FFF7ED;color:#C2410C;padding:3px 10px;border-radius:4px;font-size:12px;font-weight:700">${category}</span></div>
    </div>
  </div>
  <div style="background:#FFF5F5;border-radius:8px;padding:16px;border-left:3px solid #EF4444;margin-bottom:24px">
    <strong style="color:#EF4444">Action Required:</strong> Please update Salesforce to match the billed amount. Reply to this email if you need to escalate.
  </div>
  <div style="border-top:1px solid #E5E7EB;padding-top:20px;font-size:12px;color:#9CA3AF">
    Sent on behalf of <strong style="color:#374151">${sentBy}</strong> via Aleph Recon Studio · ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}<br/>
    <span style="color:#10B981">↩ Replies go directly to ${sentBy}</span>
  </div>
</div>`;

// ─── HEALTH ──────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    emailConfigured: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
    firestoreConnected: !!db,
    features: ['followup', 'bulk-notify', 'escalation', 'reminders', 'weekly-summary', 'inbound-email'],
  });
});

// ─── FOLLOW-UP EMAIL ─────────────────────────────────────────────────────────
app.post('/api/followup',
  requireApiKey,
  [
    body('io').notEmpty(),
    body('account').notEmpty(),
    body('manager').notEmpty(),
    body('managerEmail').isEmail(),
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
    } = req.body;

    try {
      const transporter = createTransporter();
      if (!transporter) return res.status(503).json({ error: 'Email service not configured.' });

      const info = await transporter.sendMail({
        from: `"Aleph Recon Studio" <${process.env.GMAIL_USER}>`,
        to: managerEmail,
        replyTo: sentBy,
        subject: `[Aleph Finance] Reconciliation Discrepancy — IO ${io} | ${account}`,
        html: buildFollowUpHtml({ io, account, manager, sfBudget, twBilling, diff, category, sentBy }),
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
  [body('items').isArray({ min: 1 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { items, sentBy = 'finance-ops@alephholding.com' } = req.body;
    const transporter = createTransporter();
    if (!transporter) return res.status(503).json({ error: 'Email service not configured' });

    const results = await Promise.allSettled(
      items.map(item =>
        transporter.sendMail({
          from: `"Aleph Finance Ops" <${process.env.GMAIL_USER}>`,
          to: item.managerEmail,
          replyTo: sentBy,
          subject: `[Aleph Finance] Reconciliation Discrepancy — IO ${item.io} | ${item.account}`,
          html: buildFollowUpHtml({ ...item, sentBy }),
        })
      )
    );

    const sent   = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    console.log(`[email] Bulk notify: ${sent} sent, ${failed} failed`);
    res.json({ success: true, sent, failed, total: items.length });
  }
);

// ─── SCHEDULED: ESCALATION (7 days) ─────────────────────────────────────────
// Called by Cloud Scheduler daily at 09:00 ART
// POST /api/scheduled/escalate  (x-cron-secret header)
app.post('/api/scheduled/escalate', requireCronSecret, async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Firestore not connected' });

  const transporter = createTransporter();
  const escalationDays = parseInt(process.env.ESCALATION_DAYS || '7', 10);
  const escalationEmail = process.env.ESCALATION_EMAIL || 'regional-director@alephholding.com';
  const cutoff = new Date(Date.now() - escalationDays * 24 * 60 * 60 * 1000);

  try {
    const snap = await db.collection('reconciliation_items')
      .where('status', '==', 'Error')
      .get();

    const toEscalate = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(item => {
        const created = item.createdAt?.toDate?.() || new Date(item.createdAt || 0);
        return created < cutoff && !item.escalated;
      });

    if (!toEscalate.length) {
      console.log('[escalation] No items to escalate today');
      return res.json({ escalated: 0 });
    }

    const batch = db.batch();
    const emailPromises = [];

    for (const item of toEscalate) {
      // Mark escalated in Firestore
      const ref = db.collection('reconciliation_items').doc(item.id);
      const logEntry = {
        action: 'escalated',
        actor: 'system',
        timestamp: new Date().toISOString(),
        note: `Auto-escalated after ${escalationDays} days without resolution`
      };
      batch.update(ref, {
        escalated: true,
        escalatedAt: new Date(),
        auditLog: [...(item.auditLog || []), logEntry]
      });

      // Send escalation email if transporter available
      if (transporter) {
        emailPromises.push(
          transporter.sendMail({
            from: `"Aleph Recon Studio" <${process.env.GMAIL_USER}>`,
            to: escalationEmail,
            subject: `[ESCALATION] IO ${item.io} — ${item.account} — ${escalationDays}d unresolved`,
            html: `<div style="font-family:system-ui;padding:24px;max-width:600px;margin:0 auto">
              <h2 style="color:#EF4444">⚠ Escalation Alert</h2>
              <p>IO <strong>${item.io}</strong> (${item.account}) has been in <strong>Error</strong> status for over ${escalationDays} days without action from manager <strong>${item.manager}</strong>.</p>
              <div style="background:#FEF2F2;border-radius:8px;padding:16px;margin:16px 0;border-left:3px solid #EF4444">
                <div>Discrepancy: <strong>-$${Math.abs(item.diff||0).toLocaleString()}</strong></div>
                <div>Category: <strong>${item.category}</strong></div>
                <div>Manager: <strong>${item.manager}</strong></div>
              </div>
              <p style="color:#6B7280;font-size:13px">This is an automated escalation from Aleph Recon Studio.</p>
            </div>`
          })
        );
      }
    }

    await batch.commit();
    await Promise.allSettled(emailPromises);

    console.log(`[escalation] Escalated ${toEscalate.length} items`);
    res.json({ escalated: toEscalate.length, items: toEscalate.map(i => i.io) });
  } catch (err) {
    console.error('[escalation] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── SCHEDULED: REMINDERS (3 days) ───────────────────────────────────────────
// Called by Cloud Scheduler every 3 days
// POST /api/scheduled/reminders
app.post('/api/scheduled/reminders', requireCronSecret, async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Firestore not connected' });

  const transporter = createTransporter();
  const reminderDays = parseInt(process.env.REMINDER_DAYS || '3', 10);
  const cutoff = new Date(Date.now() - reminderDays * 24 * 60 * 60 * 1000);

  try {
    const snap = await db.collection('reconciliation_items')
      .where('status', '==', 'Error')
      .get();

    const toRemind = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(item => {
        const lastNotified = item.followUpDate?.toDate?.() || item.createdAt?.toDate?.() || new Date(0);
        return lastNotified < cutoff;
      });

    if (!toRemind.length) return res.json({ reminded: 0 });

    const emailPromises = [];
    const batch = db.batch();

    for (const item of toRemind) {
      // Default domain for managers without explicit email
      const defaultDomain = (process.env.INBOUND_EMAIL_DOMAIN || 'alephholding.com').split(',')[0].trim();
      const managerEmail = item.managerEmail || `${(item.manager||'').toLowerCase().replace(/\s+/g,'.').replace(/[^a-z.]/g,'')}@${defaultDomain}`;

      if (transporter) {
        emailPromises.push(
          transporter.sendMail({
            from: `"Aleph Recon Studio" <${process.env.GMAIL_USER}>`,
            to: managerEmail,
            subject: `[Reminder] IO ${item.io} — ${item.account} still requires attention`,
            html: buildFollowUpHtml({
              ...item,
              manager: item.manager || 'Manager',
              managerEmail,
              sentBy: 'finance-ops@alephholding.com',
            }).replace('Action Required:', 'Friendly Reminder:')
          })
        );
      }

      const logEntry = {
        action: 'reminder_sent',
        actor: 'system',
        timestamp: new Date().toISOString(),
        note: `Auto-reminder sent — ${reminderDays} days since last notification`
      };
      const ref = db.collection('reconciliation_items').doc(item.id);
      batch.update(ref, {
        followUpDate: new Date(),
        auditLog: [...(item.auditLog || []), logEntry]
      });
    }

    await batch.commit();
    await Promise.allSettled(emailPromises);

    console.log(`[reminders] Sent ${toRemind.length} reminders`);
    res.json({ reminded: toRemind.length });
  } catch (err) {
    console.error('[reminders] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── SCHEDULED: WEEKLY SUMMARY ────────────────────────────────────────────────
// Called by Cloud Scheduler every Monday at 09:00 ART
// POST /api/scheduled/weekly-summary
app.post('/api/scheduled/weekly-summary', requireCronSecret, async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Firestore not connected' });

  const transporter = createTransporter();
  const summaryEmail = process.env.WEEKLY_SUMMARY_EMAIL || 'regional-director@alephholding.com';

  try {
    const snap = await db.collection('reconciliation_items').get();
    const all  = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const errors  = all.filter(i => i.status === 'Error');
    const fixing  = all.filter(i => i.status === 'Fixing');
    const matched = all.filter(i => i.status === 'Matched');

    // Group errors by region/manager
    const byManager = errors.reduce((acc, i) => {
      const key = i.manager || 'Unknown';
      if (!acc[key]) acc[key] = [];
      acc[key].push(i);
      return acc;
    }, {});

    const tableRows = Object.entries(byManager)
      .map(([mgr, items]) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;font-weight:600">${mgr}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;color:#EF4444;font-weight:700">${items.length}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;color:#6B7280">${items.map(i=>i.io).join(', ')}</td>
        </tr>`)
      .join('');

    if (transporter) {
      await transporter.sendMail({
        from: `"Aleph Recon Studio" <${process.env.GMAIL_USER}>`,
        to: summaryEmail,
        subject: `[Aleph Weekly] Reconciliation Summary — ${new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}`,
        html: `<div style="font-family:system-ui;padding:24px;max-width:680px;margin:0 auto;color:#1a1a2e">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #E5E7EB">
            <div style="background:#0037FF;border-radius:8px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;color:white;font-weight:800">A</div>
            <span style="font-size:16px;font-weight:700;color:#0037FF">Aleph Recon Studio — Weekly Summary</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:24px">
            <div style="background:#FEF2F2;border-radius:10px;padding:16px;text-align:center"><div style="font-size:28px;font-weight:800;color:#EF4444">${errors.length}</div><div style="font-size:12px;color:#6B7280;margin-top:4px">Open Errors</div></div>
            <div style="background:#FFFBEB;border-radius:10px;padding:16px;text-align:center"><div style="font-size:28px;font-weight:800;color:#D97706">${fixing.length}</div><div style="font-size:12px;color:#6B7280;margin-top:4px">In Progress</div></div>
            <div style="background:#F0FDF4;border-radius:10px;padding:16px;text-align:center"><div style="font-size:28px;font-weight:800;color:#16A34A">${matched.length}</div><div style="font-size:12px;color:#6B7280;margin-top:4px">Matched</div></div>
          </div>
          ${errors.length > 0 ? `
          <h3 style="font-size:14px;font-weight:700;margin:0 0 12px">Open Errors by Manager</h3>
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead><tr style="background:#F8F9FF"><th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase">Manager</th><th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase">Errors</th><th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase">IOs</th></tr></thead>
            <tbody>${tableRows}</tbody>
          </table>` : '<p style="color:#10B981;font-weight:700">🎉 No open errors this week!</p>'}
          <div style="margin-top:24px;padding-top:16px;border-top:1px solid #E5E7EB;font-size:12px;color:#9CA3AF">
            Automated weekly summary from Aleph Recon Studio · ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}
          </div>
        </div>`
      });
    }

    console.log(`[weekly-summary] Sent to ${summaryEmail}: ${errors.length} errors, ${fixing.length} fixing, ${matched.length} matched`);
    res.json({ success: true, errors: errors.length, fixing: fixing.length, matched: matched.length });
  } catch (err) {
    console.error('[weekly-summary] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── INBOUND EMAIL / FILE PARSING ─────────────────────────────────────────────
// POST /api/inbound-email — accepts multipart/form-data with an .xlsx attachment
// Called by Mailgun/Gmail webhook when a new Billing File arrives
// Body: { from, subject, attachments[] }
app.post('/api/inbound-email', upload.array('attachments', 5), async (req, res) => {
  const files = req.files || [];
  const from    = req.body.from || '';
  const subject = req.body.subject || '';

  console.log(`[inbound-email] from=${from} subject=${subject} files=${files.length}`);

  const xlsxFiles = files.filter(f =>
    f.originalname.endsWith('.xlsx') ||
    f.originalname.endsWith('.xls') ||
    f.mimetype.includes('spreadsheet')
  );

  if (!xlsxFiles.length) {
    return res.status(200).json({ received: true, processed: 0, reason: 'No Excel attachments found' });
  }

  // Detect file type from filename / subject
  const detectedFiles = xlsxFiles.map(f => {
    const name = f.originalname.toLowerCase();
    const isBilling = name.includes('ims') || name.includes('billing') || subject.toLowerCase().includes('billing');
    const isSF      = name.includes('sf') || name.includes('salesforce') || name.includes('export');
    return {
      originalname: f.originalname,
      size: f.size,
      type: isBilling ? 'twitter_billing' : isSF ? 'salesforce' : 'unknown',
      buffer: f.buffer.toString('base64'), // send as base64 to frontend if needed
    };
  });

  console.log(`[inbound-email] Detected: ${detectedFiles.map(f => `${f.originalname}(${f.type})`).join(', ')}`);

  // If Firestore available, log the inbound file event
  if (db) {
    try {
      await db.collection('inbound_files').add({
        from,
        subject,
        files: detectedFiles.map(f => ({ name: f.originalname, type: f.type, size: f.size })),
        receivedAt: new Date(),
        status: 'pending_processing',
      });
    } catch (e) {
      console.warn('[inbound-email] Could not log to Firestore:', e.message);
    }
  }

  res.json({
    received: true,
    processed: detectedFiles.length,
    files: detectedFiles.map(f => ({ name: f.originalname, type: f.type, size: f.size })),
  });
});

// ─── START ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`[api] Aleph Recon API v2 running on port ${PORT}`));
