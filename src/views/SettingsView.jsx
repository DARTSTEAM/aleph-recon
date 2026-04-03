import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, DollarSign, Globe, FileText, Save, CheckCircle2 } from 'lucide-react';

const LS_KEY = 'aleph-recon-settings';

const DEFAULT_SETTINGS = {
  matchTolerance: '10.00',
  escalationDays: '7',
  errorThreshold: '3',
  maxDiscrepancy: '5000',
  exportFormat: 'xlsx',
  namingConvention: 'AlephRecon_{period}_{date}',
  ccEmail: 'finance-ops@alephholding.com',
  baseCurrency: 'USD',
  fxSource: 'Banco Nación (AR)',
};

const REGIONS_DEFAULT = [
  { name: 'Argentina', currency: 'ARS', taxRate: '21', active: true },
  { name: 'Mexico', currency: 'MXN', taxRate: '16', active: true },
  { name: 'Brazil', currency: 'BRL', taxRate: '9.25', active: true },
  { name: 'Chile', currency: 'CLP', taxRate: '19', active: true },
  { name: 'Colombia', currency: 'COP', taxRate: '19', active: false },
];

const Section = ({ title, icon: Icon, children }) => (
  <div className="bento-card" style={{ marginBottom: '1.25rem' }}>
    <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '6px', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
      <Icon size={15} style={{ color: 'var(--primary)' }} /> {title}
    </div>
    {children}
  </div>
);

const Field = ({ label, stateKey, value, onChange, type = 'text', suffix }) => (
  <div>
    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input
        value={value}
        type={type}
        onChange={e => onChange(stateKey, e.target.value)}
        style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: '13px', fontFamily: 'var(--font-brand)', outline: 'none', color: 'var(--text-primary)' }}
      />
      {suffix && <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>{suffix}</span>}
    </div>
  </div>
);

export default function SettingsView() {
  const saved_raw = localStorage.getItem(LS_KEY);
  const saved_data = saved_raw ? JSON.parse(saved_raw) : {};

  const [cfg, setCfg] = useState({ ...DEFAULT_SETTINGS, ...saved_data.cfg });
  const [regions, setRegions] = useState(saved_data.regions || REGIONS_DEFAULT);
  const [saved, setSaved] = useState(false);

  const setField = (key, val) => setCfg(prev => ({ ...prev, [key]: val }));

  const handleSave = () => {
    localStorage.setItem(LS_KEY, JSON.stringify({ cfg, regions }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div>
          <Section title="Reconciliation Thresholds" icon={Settings}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Field label="Match Tolerance (USD)" stateKey="matchTolerance" value={cfg.matchTolerance} onChange={setField} type="number" suffix="USD" />
              <Field label="Auto-escalation (days)" stateKey="escalationDays" value={cfg.escalationDays} onChange={setField} type="number" suffix="days" />
              <Field label="Error threshold (%)" stateKey="errorThreshold" value={cfg.errorThreshold} onChange={setField} type="number" suffix="%" />
              <Field label="Max Discrepancy Alert" stateKey="maxDiscrepancy" value={cfg.maxDiscrepancy} onChange={setField} type="number" suffix="USD" />
            </div>
          </Section>

          <Section title="Export Preferences" icon={FileText}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Field label="Default Export Format" stateKey="exportFormat" value={cfg.exportFormat} onChange={setField} />
              <Field label="Report Naming Convention" stateKey="namingConvention" value={cfg.namingConvention} onChange={setField} />
            </div>
            <div style={{ marginTop: '1rem' }}>
              <Field label="CC Email on Export" stateKey="ccEmail" value={cfg.ccEmail} onChange={setField} />
            </div>
          </Section>
        </div>

        <div>
          <Section title="Region & Currency Config" icon={Globe}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  {['Region', 'Currency', 'Tax Rate', 'Active'].map((h, i) => (
                    <th key={h} style={{ textAlign: i === 3 ? 'center' : 'left', padding: '6px 0', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
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
              <Field label="Base Currency" stateKey="baseCurrency" value={cfg.baseCurrency} onChange={setField} />
              <Field label="FX Rate Source" stateKey="fxSource" value={cfg.fxSource} onChange={setField} />
            </div>
          </Section>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <button className="btn-premium btn-solid" onClick={handleSave} style={{ padding: '12px 28px' }}>
          {saved ? <><CheckCircle2 size={15} /> Settings saved!</> : <><Save size={15} /> Save Settings</>}
        </button>
      </div>
    </motion.div>
  );
}
