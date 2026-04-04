import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ChevronDown, ChevronRight, AlertCircle, Clock, CheckCircle2, X, ArrowRight, Eye } from 'lucide-react';

const MANAGERS = [
  {
    id: 'm1', name: 'Mariana Tunno', email: 'mariana.tunno@alephholding.com', region: 'LATAM South', totalIOs: 48, okCount: 45, errors: 2, fixing: 1,
    portfolio: [
      { io: 'TW-50473210', account: "L'Oréal Argentina", sfBudget: 12500, twBilling: 12500, diff: 0, status: 'Matched', category: 'Budget' },
      { io: 'TW-10573626', account: 'Coca-Cola CL', sfBudget: 22000, twBilling: 22000, diff: 0, status: 'Matched', category: 'Budget' },
      { io: 'TW-10590112', account: 'Reckitt AR', sfBudget: 9800, twBilling: 10740, diff: -940, status: 'Error', category: 'Taxes', comment: 'IVA not applied in SF' },
    ],
  },
  {
    id: 'm2', name: 'Silvia Rodriguez', email: 'silvia.rodriguez@alephholding.com', region: 'LATAM North', totalIOs: 61, okCount: 58, errors: 3, fixing: 0,
    portfolio: [
      { io: 'TW-10573655', account: 'Mercado Libre MEX', sfBudget: 45200, twBilling: 48900.50, diff: -3700.50, status: 'Error', category: 'Taxes', comment: 'LATAM Retención 5% not applied in SF' },
      { io: 'TW-10573729', account: 'Unilever MX', sfBudget: 38000, twBilling: 39600, diff: -1600, status: 'Error', category: 'Budget', comment: 'Budget updated in Twitter but not SF' },
      { io: 'TW-10573741', account: 'Nestlé CO', sfBudget: 14200, twBilling: 14200, diff: 0, status: 'Matched', category: 'Budget' },
    ],
  },
  {
    id: 'm3', name: 'Santiago G.', email: 'santiago.g@alephholding.com', region: 'Brazil', totalIOs: 72, okCount: 72, errors: 0, fixing: 0,
    portfolio: [
      { io: 'TW-10573702', account: 'Netflix BR', sfBudget: 82000, twBilling: 82000, diff: 0, status: 'Matched', category: 'Budget' },
    ],
  },
  {
    id: 'm4', name: 'Bautista B.', email: 'bautista.b@alephholding.com', region: 'Andean', totalIOs: 29, okCount: 27, errors: 1, fixing: 1,
    portfolio: [
      { io: 'TW-10573662', account: 'Samsung AR', sfBudget: 15400, twBilling: 18200, diff: -2800, status: 'Error', category: 'Commission', comment: 'Wrong Commission tier (15% vs 8%)' },
    ],
  },
];

// ─── IO Preview Modal ─────────────────────────────────────────────────────────
const IOPreview = ({ item, onClose }) => {
  if (!item) return null;
  const hasDiff = item.diff !== 0;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ background: 'white', borderRadius: '16px', width: '640px', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: '800', fontSize: '16px', color: 'var(--primary)', marginBottom: '4px' }}>{item.io}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{item.account}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><X size={20} /></button>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Side-by-side comparison</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'start' }}>
            <div style={{ background: '#EFF6FF', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Salesforce</div>
              {[['IO Number', item.io], ['Account', item.account], ['Net Budget', `$${item.sfBudget?.toLocaleString()}`], ['Category', item.category]].map(([label, value]) => (
                <div key={label} style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10px', color: '#60A5FA', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontSize: '14px', fontWeight: label === 'Net Budget' && hasDiff ? '800' : '500', color: label === 'Net Budget' && hasDiff ? '#1D4ED8' : 'var(--text-primary)' }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', paddingTop: '3rem' }}><ArrowRight size={18} style={{ color: 'var(--text-muted)' }} /></div>
            <div style={{ background: hasDiff ? '#FEF2F2' : '#F0FDF4', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: hasDiff ? '#DC2626' : '#16A34A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Twitter Billing</div>
              {[['IO Number', item.io], ['Account', item.account], ['Billed Amount', `$${item.twBilling?.toLocaleString()}`], ['Category', item.category]].map(([label, value]) => (
                <div key={label} style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10px', color: hasDiff ? '#FCA5A5' : '#86EFAC', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontSize: '14px', fontWeight: label === 'Billed Amount' && hasDiff ? '800' : '500', color: label === 'Billed Amount' && hasDiff ? '#DC2626' : 'var(--text-primary)' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
          {hasDiff ? (
            <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#FEF2F2', borderRadius: '10px', border: '1px solid #FECACA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '700', color: '#991B1B', fontSize: '13px' }}>Discrepancy detected</div>
                {item.comment && <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px' }}>{item.comment}</div>}
              </div>
              <div style={{ fontWeight: '800', fontSize: '20px', color: '#DC2626' }}>-${Math.abs(item.diff).toLocaleString()}</div>
            </div>
          ) : (
            <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#F0FDF4', borderRadius: '10px', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={18} style={{ color: '#16A34A' }} />
              <span style={{ fontWeight: '700', color: '#15803D' }}>Fully matched — no discrepancy</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function CommercialTeamsView() {
  const [expanded, setExpanded] = useState(null);
  const [showClean, setShowClean] = useState(false);
  const [previewIO, setPreviewIO] = useState(null);

  const withErrors = MANAGERS.filter(m => m.errors > 0 || m.fixing > 0);
  const clean = MANAGERS.filter(m => m.errors === 0 && m.fixing === 0);
  const visibleManagers = showClean ? MANAGERS : withErrors;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <AnimatePresence>
        {previewIO && <IOPreview item={previewIO} onClose={() => setPreviewIO(null)} />}
      </AnimatePresence>

      {/* Portfolio table */}
      <div className="data-table-wrapper">
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: '700', fontSize: '14px' }}>Manager Portfolio Detail</div>
          <div style={{ display: 'flex', align: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {clean.length} manager{clean.length !== 1 ? 's' : ''} clean (hidden)
            </span>
            <button className="btn-premium btn-ghost" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => setShowClean(s => !s)}>
              {showClean ? 'Hide clean' : 'Show all'}
            </button>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th></th><th>Manager</th><th>Region</th><th>Total IOs</th><th>Health</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleManagers.map(m => (
              <React.Fragment key={m.id}>
                <motion.tr onClick={() => setExpanded(expanded === m.id ? null : m.id)} style={{ cursor: 'pointer' }} whileHover={{ backgroundColor: '#F8F9FF' }}>
                  <td style={{ width: '32px' }}>
                    {expanded === m.id ? <ChevronDown size={16} style={{ color: 'var(--primary)' }} /> : <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '11px', flexShrink: 0 }}>
                        {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '13px' }}>{m.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{m.region}</td>
                  <td>{m.totalIOs}</td>
                  <td>
                    {m.errors === 0 && m.fixing === 0 ? (
                      <span className="status-pill status-matched"><CheckCircle2 size={11} /> Clean</span>
                    ) : (
                      <span style={{ color: '#EF4444', fontWeight: '700', fontSize: '13px' }}>
                        <AlertCircle size={13} style={{ display: 'inline', marginRight: '4px' }} />
                        {m.errors} open{m.fixing > 0 ? `, ${m.fixing} fixing` : ''}
                      </span>
                    )}
                  </td>
                  <td>
                    <a href={`mailto:${m.email}`} onClick={e => e.stopPropagation()} className="btn-premium btn-ghost" style={{ fontSize: '12px', padding: '6px 12px' }}>
                      <Mail size={13} /> Contact
                    </a>
                  </td>
                </motion.tr>
                <AnimatePresence>
                  {expanded === m.id && (
                    <tr>
                      <td colSpan={6} style={{ padding: 0, backgroundColor: '#FAFAFD' }}>
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          style={{ padding: '1rem 2.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Portfolio IOs — click to see detail</div>
                          {m.portfolio.map(io => (
                            <div key={io.io}
                              onClick={() => setPreviewIO(io)}
                              style={{ display: 'flex', gap: '1.5rem', padding: '10px 12px', borderRadius: '8px', marginBottom: '4px', fontSize: '13px', alignItems: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#F0F3FF'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              <span style={{ fontWeight: '700', color: 'var(--primary)', width: '120px' }}>{io.io}</span>
                              <span style={{ flex: 1 }}>{io.account}</span>
                              <span className={`status-pill status-${io.status.toLowerCase()}`}>
                                {io.status === 'Matched' ? <CheckCircle2 size={10} /> : io.status === 'Fixing' ? <Clock size={10} /> : <AlertCircle size={10} />}
                                {io.status}
                              </span>
                              {io.diff !== 0 && <span style={{ color: '#EF4444', fontWeight: '700', width: '80px', textAlign: 'right' }}>-${Math.abs(io.diff).toLocaleString()}</span>}
                              <span style={{ color: 'var(--primary)', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={12} /> View</span>
                            </div>
                          ))}
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
