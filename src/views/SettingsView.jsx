import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, DollarSign, Globe, FileText, Save, RefreshCw } from 'lucide-react';

const Section = ({ title, icon: Icon, children }) => (
  <div className="bento-card" style={{ marginBottom: '1.25rem' }}>
    <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '6px', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
      <Icon size={15} style={{ color: 'var(--primary)' }} /> {title}
    </div>
    {children}
  </div>
);

const Field = ({ label, defaultValue, type = 'text', suffix }) => (
  <div>
    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input defaultValue={defaultValue} type={type} style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: '13px', fontFamily: 'var(--font-brand)', outline: 'none', color: 'var(--text-primary)' }} />
      {suffix && <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>{suffix}</span>}
    </div>
  </div>
);

const REGIONS = [
  { name: 'Argentina', currency: 'ARS', taxRate: '21', active: true },
  { name: 'Mexico', currency: 'MXN', taxRate: '16', active: true },
  { name: 'Brazil', currency: 'BRL', taxRate: '9.25', active: true },
  { name: 'Chile', currency: 'CLP', taxRate: '19', active: true },
  { name: 'Colombia', currency: 'COP', taxRate: '19', active: false },
];

export default function SettingsView() {
  const [regions, setRegions] = useState(REGIONS);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div>
          <Section title="Reconciliation Thresholds" icon={Settings}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Field label="Match Tolerance (USD)" defaultValue="10.00" type="number" suffix="USD" />
              <Field label="Auto-escalation (days)" defaultValue="7" type="number" suffix="days" />
              <Field label="Error threshold (%)" defaultValue="3" type="number" suffix="%" />
              <Field label="Max Discrepancy Alert" defaultValue="5000" type="number" suffix="USD" />
            </div>
          </Section>

          <Section title="Export Preferences" icon={FileText}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Field label="Default Export Format" defaultValue="xlsx" />
              <Field label="Report Naming Convention" defaultValue="AlephRecon_{period}_{date}" />
            </div>
            <div style={{ marginTop: '1rem' }}>
              <Field label="CC Email on Export" defaultValue="finance-ops@alephholding.com" />
            </div>
          </Section>
        </div>

        <div>
          <Section title="Region & Currency Config" icon={Globe}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '6px 0', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Region</th>
                  <th style={{ textAlign: 'left', padding: '6px 0', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Currency</th>
                  <th style={{ textAlign: 'left', padding: '6px 0', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tax Rate</th>
                  <th style={{ textAlign: 'center', padding: '6px 0', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((r, i) => (
                  <tr key={r.name} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 0', fontWeight: '600', color: 'var(--text-primary)' }}>{r.name}</td>
                    <td><span style={{ padding: '2px 8px', background: '#F0F3FF', color: 'var(--primary)', borderRadius: '4px', fontWeight: '700', fontSize: '11px' }}>{r.currency}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.taxRate}%</td>
                    <td style={{ textAlign: 'center' }}>
                      <div
                        onClick={() => setRegions(prev => prev.map((x, idx) => idx === i ? { ...x, active: !x.active } : x))}
                        style={{ width: '36px', height: '20px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', background: r.active ? 'var(--primary)' : '#D1D5DB', position: 'relative', margin: '0 auto' }}>
                        <div style={{ position: 'absolute', top: '2px', left: r.active ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: 'white', transition: 'all 0.2s' }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="Billing Currency" icon={DollarSign}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Field label="Base Currency" defaultValue="USD" />
              <Field label="FX Rate Source" defaultValue="Banco Nación (AR)" />
            </div>
          </Section>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <button className="btn-premium btn-solid" onClick={handleSave} style={{ padding: '12px 28px' }}>
          {saved ? <><RefreshCw size={15} /> Saved!</> : <><Save size={15} /> Save Settings</>}
        </button>
      </div>
    </motion.div>
  );
}
