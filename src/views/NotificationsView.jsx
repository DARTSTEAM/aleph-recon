import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Mail, CheckCircle2, Send } from 'lucide-react';
import { useT } from '../i18n/index.jsx';

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
  const { t } = useT();
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
            <Bell size={15} style={{ color: 'var(--primary)' }} /> {t('notif.alertRules')}
          </div>
          <Toggle label={t('notif.toggle.newDiscrepancy')} description={t('notif.toggle.newDiscrepancy.desc')} value={rules.newDiscrepancy} onChange={() => toggleRule('newDiscrepancy')} />
          <Toggle label={t('notif.toggle.weeklySummary')} description={t('notif.toggle.weeklySummary.desc')} value={rules.weeklySummary} onChange={() => toggleRule('weeklySummary')} />
          <Toggle label={t('notif.toggle.escalation')} description={t('notif.toggle.escalation.desc')} value={rules.escalation7d} onChange={() => toggleRule('escalation7d')} />
          <Toggle label={t('notif.toggle.autoReminder')} description={t('notif.toggle.autoReminder.desc')} value={rules.autoReminder} onChange={() => toggleRule('autoReminder')} />
          <Toggle label={t('notif.toggle.resolveConfirm')} description={t('notif.toggle.resolveConfirm.desc')} value={rules.resolveConfirm} onChange={() => toggleRule('resolveConfirm')} />
          <button className="btn-premium btn-solid" style={{ marginTop: '1rem', fontSize: '12px', padding: '8px 16px' }} onClick={saveAll}>
            {templateSaved ? <><CheckCircle2 size={13} /> {t('action.saved')}</> : <><Send size={13} /> {t('action.saveRules')}</>}
          </button>
        </div>

        {/* Email Template */}
        <div className="bento-card">
          <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Mail size={15} style={{ color: 'var(--primary)' }} /> {t('notif.templateTitle')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '600' }}>
            {t('notif.templateVars')}
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
            {templateSaved ? <><CheckCircle2 size={13} /> {t('action.saved')}</> : <><Send size={13} /> {t('action.saveTemplate')}</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
