import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Mail, CheckCircle2, Send } from 'lucide-react';

const LS_KEY_NOTIF = 'aleph-recon-notifications';

const DEFAULT_RULES = {
  newDiscrepancy: true,
  weeklySummary: true,
  escalation7d: false,
  autoReminder: true,
  resolveConfirm: false,
};

const DEFAULT_TEMPLATE = `Hi {manager},

We identified a reconciliation discrepancy for IO {io_number}.

Account: {account}
SF Net Budget: {sf_budget}
Twitter Billing: {tw_billing}
Discrepancy: {diff}

Please review and update Salesforce at your earliest convenience.

Regards,
Aleph Finance Operations Team`;

const NOTIFICATION_LOG = [
  { id: 1, type: 'Follow-up', to: 'Silvia Rodriguez', io: 'TW-10573655', sentAt: '2026-03-31 15:42', status: 'Delivered' },
  { id: 2, type: 'Follow-up', to: 'Bautista B.', io: 'TW-10573662', sentAt: '2026-03-31 15:41', status: 'Delivered' },
  { id: 3, type: 'Escalation', to: 'Finance Director', io: 'N/A - 14 open errors', sentAt: '2026-03-30 09:00', status: 'Delivered' },
  { id: 4, type: 'Follow-up', to: 'Mariana Tunno', io: 'TW-10590112', sentAt: '2026-03-29 17:10', status: 'Delivered' },
  { id: 5, type: 'Reminder', to: 'Silvia Rodriguez', io: 'TW-10573729', sentAt: '2026-03-28 09:00', status: 'Delivered' },
];

const Toggle = ({ label, description, value, onChange }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
    <div>
      <div style={{ fontWeight: '600', fontSize: '14px' }}>{label}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{description}</div>
    </div>
    <div
      onClick={onChange}
      style={{
        width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
        background: value ? 'var(--primary)' : '#D1D5DB', position: 'relative', flexShrink: 0
      }}>
      <div style={{
        position: 'absolute', top: '3px', left: value ? '23px' : '3px', width: '18px', height: '18px',
        borderRadius: '50%', background: 'white', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
      }} />
    </div>
  </div>
);

export default function NotificationsView() {
  const saved = (() => { try { return JSON.parse(localStorage.getItem(LS_KEY_NOTIF)) || {}; } catch { return {}; } })();
  const [rules, setRules] = useState({ ...DEFAULT_RULES, ...saved.rules });
  const [template, setTemplate] = useState(saved.template || DEFAULT_TEMPLATE);
  const [templateSaved, setTemplateSaved] = useState(false);

  const toggleRule = (key) => setRules(prev => ({ ...prev, [key]: !prev[key] }));

  const saveAll = () => {
    localStorage.setItem(LS_KEY_NOTIF, JSON.stringify({ rules, template }));
    setTemplateSaved(true);
    setTimeout(() => setTemplateSaved(false), 2500);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Alert Rules */}
        <div className="bento-card">
          <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Bell size={15} style={{ color: 'var(--primary)' }} /> Alert Rules
          </div>
          <Toggle label="New Discrepancy Alert" description="Notify manager when a new error is detected" value={rules.newDiscrepancy} onChange={() => toggleRule('newDiscrepancy')} />
          <Toggle label="Weekly Summary" description="Send weekly digest every Monday 9am" value={rules.weeklySummary} onChange={() => toggleRule('weeklySummary')} />
          <Toggle label="Escalation (7 days)" description="Escalate to Finance Director after 7 days open" value={rules.escalation7d} onChange={() => toggleRule('escalation7d')} />
          <Toggle label="Auto-Reminder" description="Re-notify manager every 3 days while status is Error" value={rules.autoReminder} onChange={() => toggleRule('autoReminder')} />
          <Toggle label="Resolution Confirmation" description="Notify when an item is marked Resolved" value={rules.resolveConfirm} onChange={() => toggleRule('resolveConfirm')} />
          <button className="btn-premium btn-solid" style={{ marginTop: '1rem', fontSize: '12px', padding: '8px 16px' }} onClick={saveAll}>
            {templateSaved ? <><CheckCircle2 size={13} /> Saved!</> : <><Send size={13} /> Save Rules</>}
          </button>
        </div>

        {/* Email Template */}
        <div className="bento-card">
          <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Mail size={15} style={{ color: 'var(--primary)' }} /> Follow-up Email Template
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '600' }}>
            Variables: {`{manager} {io_number} {account} {sf_budget} {tw_billing} {diff}`}
          </div>
          <textarea
            value={template}
            onChange={e => setTemplate(e.target.value)}
            style={{
              width: '100%', height: '200px', padding: '12px', border: '1px solid var(--border-strong)',
              borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px', outline: 'none',
              color: 'var(--text-primary)', resize: 'vertical', lineHeight: '1.5'
            }}
          />
          <button className="btn-premium btn-solid" style={{ marginTop: '12px', fontSize: '12px', padding: '8px 16px' }} onClick={saveAll}>
            {templateSaved ? <><CheckCircle2 size={13} /> Saved!</> : <><Send size={13} /> Save Template</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
