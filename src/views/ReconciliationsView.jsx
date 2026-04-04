import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, ChevronDown, ChevronRight, Download, Calendar, X, AlertCircle, ArrowRight } from 'lucide-react';

const MOCK_RUNS = [
  { id: 'run-mar-2026', label: 'March 2026', date: '2026-03-31', total: 312, matched: 298, errors: 14, fixing: 0, matchRate: 95.5, volume: 2840000 },
  { id: 'run-feb-2026', label: 'February 2026', date: '2026-02-28', total: 287, matched: 281, errors: 4, fixing: 2, matchRate: 97.9, volume: 2510000 },
  { id: 'run-jan-2026', label: 'January 2026', date: '2026-01-31', total: 301, matched: 288, errors: 9, fixing: 4, matchRate: 95.7, volume: 2690000 },
  { id: 'run-dec-2025', label: 'December 2025', date: '2025-12-31', total: 334, matched: 334, errors: 0, fixing: 0, matchRate: 100.0, volume: 3120000 },
  { id: 'run-nov-2025', label: 'November 2025', date: '2025-11-30', total: 294, matched: 285, errors: 6, fixing: 3, matchRate: 96.9, volume: 2450000 },
];

const MOCK_DETAILS = {
  'run-mar-2026': [
    { io: 'TW-10573655', account: 'Mercado Libre MEX', manager: 'Silvia Rodriguez', sfBudget: 45200, twBilling: 48900.50, diff: -3700.50, status: 'Error', category: 'Taxes', comment: 'LATAM Retención 5% not applied in SF' },
    { io: 'TW-10573662', account: 'Samsung AR', manager: 'Bautista B.', sfBudget: 15400, twBilling: 18200, diff: -2800, status: 'Error', category: 'Commission', comment: 'Wrong Commission tier (15% vs 8%)' },
    { io: 'TW-10573729', account: 'Unilever AR', manager: 'Silvia Rodriguez', sfBudget: 38000, twBilling: 39600, diff: -1600, status: 'Error', category: 'Budget', comment: 'Budget updated in Twitter but not in SF' },
    { io: 'TW-50473210', account: "L'Oréal Argentina", manager: 'Mariana Tunno', sfBudget: 12500, twBilling: 12500, diff: 0, status: 'Matched', category: 'Budget', comment: '' },
    { io: 'TW-10573626', account: 'Coca-Cola CL', manager: 'Mariana Tunno', sfBudget: 22000, twBilling: 22000, diff: 0, status: 'Matched', category: 'Budget', comment: '' },
  ],
  'run-feb-2026': [
    { io: 'TW-10481203', account: 'Coca-Cola BR', manager: 'Santiago G.', sfBudget: 31000, twBilling: 31820, diff: -820, status: 'Fixing', category: 'Taxes', comment: 'Under review with finance' },
    { io: 'TW-10481250', account: 'P&G CL', manager: 'Mariana Tunno', sfBudget: 18200, twBilling: 18350, diff: -150, status: 'Fixing', category: 'Budget', comment: 'Awaiting SF update' },
  ],
};

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
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: '800', fontSize: '16px', color: 'var(--primary)', marginBottom: '4px' }}>{item.io}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{item.account}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Diff view — SF vs Twitter */}
        <div style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
            Side-by-side comparison
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'start' }}>
            {/* Salesforce */}
            <div style={{ background: '#EFF6FF', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Salesforce</div>
              {[
                { label: 'IO Number', value: item.io },
                { label: 'Account', value: item.account },
                { label: 'Manager', value: item.manager },
                { label: 'Net Budget', value: `$${item.sfBudget?.toLocaleString()}`, highlight: hasDiff, color: '#1D4ED8' },
                { label: 'Category', value: item.category },
              ].map(({ label, value, highlight, color }) => (
                <div key={label} style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10px', color: '#60A5FA', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontSize: '14px', fontWeight: highlight ? '800' : '500', color: highlight ? color : 'var(--text-primary)' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Arrow */}
            <div style={{ display: 'flex', alignItems: 'center', paddingTop: '3rem' }}>
              <ArrowRight size={18} style={{ color: 'var(--text-muted)' }} />
            </div>

            {/* Twitter */}
            <div style={{ background: hasDiff ? '#FEF2F2' : '#F0FDF4', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: hasDiff ? '#DC2626' : '#16A34A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Twitter Billing</div>
              {[
                { label: 'IO Number', value: item.io },
                { label: 'Account', value: item.account },
                { label: 'Manager', value: item.manager },
                { label: 'Billed Amount', value: `$${item.twBilling?.toLocaleString()}`, highlight: hasDiff, color: hasDiff ? '#DC2626' : '#16A34A' },
                { label: 'Category', value: item.category },
              ].map(({ label, value, highlight, color }) => (
                <div key={label} style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10px', color: hasDiff ? '#FCA5A5' : '#86EFAC', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontSize: '14px', fontWeight: highlight ? '800' : '500', color: highlight ? color : 'var(--text-primary)' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Diff Summary */}
          {hasDiff ? (
            <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#FEF2F2', borderRadius: '10px', border: '1px solid #FECACA' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '700', color: '#991B1B', fontSize: '13px' }}>Discrepancy detected</div>
                  {item.comment && <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px' }}>{item.comment}</div>}
                </div>
                <div style={{ fontWeight: '800', fontSize: '20px', color: '#DC2626' }}>-${Math.abs(item.diff).toLocaleString()}</div>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#F0FDF4', borderRadius: '10px', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={18} style={{ color: '#16A34A' }} />
              <span style={{ fontWeight: '700', color: '#15803D' }}>Fully matched — no discrepancy</span>
            </div>
          )}

          {/* Status */}
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '13px' }}>
            <span>Status: <strong>{item.status}</strong></span>
            <span>Category: <strong>{item.category}</strong></span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function ReconciliationsView() {
  const [expanded, setExpanded] = useState(null);
  const [previewIO, setPreviewIO] = useState(null);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* IO Preview Modal */}
      <AnimatePresence>
        {previewIO && <IOPreview item={previewIO} onClose={() => setPreviewIO(null)} />}
      </AnimatePresence>

      {/* SVG Sparkline */}
      <div className="bento-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700' }}>Match Rate Trend</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Last 5 billing periods</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>{MOCK_RUNS[0].matchRate}%</div>
            <div style={{ fontSize: '11px', color: MOCK_RUNS[0].matchRate > MOCK_RUNS[1].matchRate ? '#EF4444' : '#10B981', fontWeight: '600' }}>
              {MOCK_RUNS[0].matchRate > MOCK_RUNS[1].matchRate ? '▲' : '▼'} vs prev. period
            </div>
          </div>
        </div>
        {(() => {
          const runs = [...MOCK_RUNS].reverse();
          const VW = 600, VH = 100;
          const PAD = { top: 24, right: 20, bottom: 28, left: 10 };
          const chartW = VW - PAD.left - PAD.right;
          const chartH = VH - PAD.top - PAD.bottom;
          const minR = 93, maxR = 101;
          const xOf = (i) => PAD.left + (i / (runs.length - 1)) * chartW;
          const yOf = (rate) => PAD.top + chartH - ((rate - minR) / (maxR - minR)) * chartH;
          const pts = runs.map((r, i) => ({ x: xOf(i), y: yOf(r.matchRate), run: r }));
          const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
          const areaD = `${pathD} L${pts[pts.length - 1].x},${PAD.top + chartH} L${pts[0].x},${PAD.top + chartH} Z`;
          const targetY = yOf(99);
          return (
            <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: '100%', height: '110px' }}>
              <defs>
                <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0037FF" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#0037FF" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1={PAD.left} y1={targetY} x2={VW - PAD.right - 2} y2={targetY} stroke="#10B981" strokeWidth="0.8" strokeDasharray="4,3" opacity="0.6" />
              <text x={VW - PAD.right + 2} y={targetY + 3} fontSize="8" fill="#10B981" opacity="0.7" fontFamily="system-ui">99%</text>
              <path d={areaD} fill="url(#areaGrad2)" />
              <path d={pathD} fill="none" stroke="#0037FF" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
              {pts.map((p, i) => {
                const color = p.run.matchRate >= 99 ? '#10B981' : p.run.matchRate >= 97 ? '#F59E0B' : '#EF4444';
                return (
                  <g key={i}>
                    <text x={p.x} y={p.y - 6} textAnchor="middle" fontSize="8.5" fill={color} fontWeight="700" fontFamily="system-ui">{p.run.matchRate}%</text>
                    <circle cx={p.x} cy={p.y} r="3.5" fill="white" stroke="#0037FF" strokeWidth="1.5" />
                    <text x={p.x} y={VH - 4} textAnchor="middle" fontSize="8" fill="#98A0B4" fontFamily="system-ui" fontWeight="600">{p.run.label.split(' ')[0].slice(0, 3)}</text>
                  </g>
                );
              })}
            </svg>
          );
        })()}
        <div style={{ display: 'flex', gap: '0', borderTop: '1px solid var(--border-subtle)', marginTop: '0.5rem', paddingTop: '1rem' }}>
          {[
            { label: 'Best Period', value: 'Dec 2025', sub: '100%', color: '#10B981' },
            { label: 'Avg Match Rate', value: '97.2%', sub: 'Last 5 months', color: 'var(--primary)' },
            { label: 'Total Errors', value: '33', sub: 'Cumulative', color: '#EF4444' },
            { label: 'Total Volume', value: '$13.6M', sub: 'Billed (X)', color: 'var(--text-primary)' },
          ].map(({ label, value, sub, color }, i, arr) => (
            <div key={label} style={{ flex: 1, textAlign: 'center', borderRight: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none', padding: '0 1rem' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color, letterSpacing: '-0.02em' }}>{value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Run History */}
      <div className="data-table-wrapper">
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} style={{ color: 'var(--primary)' }} /> Reconciliation Run History
          </div>
          <button className="btn-premium btn-ghost" style={{ fontSize: '12px', padding: '7px 14px' }}>
            <Download size={13} /> Export All
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th></th>
              <th>Period</th>
              <th>Total IOs</th>
              <th>Matched</th>
              <th>Errors</th>
              <th>In Progress</th>
              <th>Match Rate</th>
              <th>Volume</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_RUNS.map((run) => (
              <React.Fragment key={run.id}>
                <motion.tr onClick={() => setExpanded(expanded === run.id ? null : run.id)} style={{ cursor: 'pointer' }} whileHover={{ backgroundColor: '#F8F9FF' }}>
                  <td style={{ width: '32px' }}>
                    {expanded === run.id ? <ChevronDown size={16} style={{ color: 'var(--primary)' }} /> : <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
                  </td>
                  <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{run.label}</td>
                  <td>{run.total}</td>
                  <td style={{ color: '#10B981', fontWeight: '600' }}>{run.matched}</td>
                  <td style={{ color: run.errors > 0 ? '#EF4444' : 'var(--text-muted)', fontWeight: run.errors > 0 ? '700' : '400' }}>{run.errors}</td>
                  <td style={{ color: run.fixing > 0 ? '#F59E0B' : 'var(--text-muted)' }}>{run.fixing}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: '#F0F1F5', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${run.matchRate}%`, background: run.matchRate >= 99 ? '#10B981' : run.matchRate >= 97 ? '#F59E0B' : '#EF4444', borderRadius: '3px' }} />
                      </div>
                      <span style={{ fontWeight: '700', fontSize: '13px' }}>{run.matchRate}%</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: '600' }}>${(run.volume / 1000000).toFixed(2)}M</td>
                </motion.tr>
                <AnimatePresence>
                  {expanded === run.id && MOCK_DETAILS[run.id] && (
                    <tr>
                      <td colSpan={8} style={{ padding: 0, backgroundColor: '#FAFAFD' }}>
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          style={{ padding: '1rem 2.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>IOs in this run — click to see detail</div>
                          {MOCK_DETAILS[run.id].map((d) => (
                            <div key={d.io}
                              onClick={() => setPreviewIO(d)}
                              style={{ display: 'flex', gap: '1.5rem', padding: '10px 12px', borderRadius: '8px', marginBottom: '4px', fontSize: '13px', alignItems: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#F0F3FF'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <span style={{ fontWeight: '700', color: 'var(--primary)', width: '120px' }}>{d.io}</span>
                              <span style={{ flex: 1 }}>{d.account}</span>
                              <span style={{ color: 'var(--text-muted)', width: '80px' }}>{d.category}</span>
                              <span className={`status-pill status-${d.status.toLowerCase()}`}>
                                {d.status === 'Matched' ? <CheckCircle2 size={10} /> : d.status === 'Fixing' ? <Clock size={10} /> : <AlertCircle size={10} />}
                                {d.status}
                              </span>
                              {d.diff !== 0 && <span style={{ color: '#EF4444', fontWeight: '700', width: '80px', textAlign: 'right' }}>-${Math.abs(d.diff).toLocaleString()}</span>}
                              <span style={{ color: 'var(--primary)', fontSize: '11px', fontWeight: '600' }}>View →</span>
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
