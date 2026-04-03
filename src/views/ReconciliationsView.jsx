import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronRight, Download, Calendar } from 'lucide-react';

const MOCK_RUNS = [
  { id: 'run-mar-2026', label: 'March 2026', date: '2026-03-31', total: 312, matched: 298, errors: 14, fixing: 0, matchRate: 95.5, volume: 2840000 },
  { id: 'run-feb-2026', label: 'February 2026', date: '2026-02-28', total: 287, matched: 281, errors: 4, fixing: 2, matchRate: 97.9, volume: 2510000 },
  { id: 'run-jan-2026', label: 'January 2026', date: '2026-01-31', total: 301, matched: 288, errors: 9, fixing: 4, matchRate: 95.7, volume: 2690000 },
  { id: 'run-dec-2025', label: 'December 2025', date: '2025-12-31', total: 334, matched: 334, errors: 0, fixing: 0, matchRate: 100.0, volume: 3120000 },
  { id: 'run-nov-2025', label: 'November 2025', date: '2025-11-30', total: 294, matched: 285, errors: 6, fixing: 3, matchRate: 96.9, volume: 2450000 },
];

const MOCK_DETAILS = {
  'run-mar-2026': [
    { io: 'TW-10573655', account: 'Mercado Libre MEX', diff: -3700.50, status: 'Error', category: 'Taxes' },
    { io: 'TW-10573662', account: 'Samsung AR', diff: -2800, status: 'Error', category: 'Commission' },
    { io: 'TW-10573729', account: 'Unilever AR', diff: -1600, status: 'Error', category: 'Budget' },
  ],
  'run-feb-2026': [
    { io: 'TW-10481203', account: 'Coca-Cola BR', diff: -820, status: 'Matched', category: 'Taxes' },
    { io: 'TW-10481250', account: 'P&G CL', diff: -150, status: 'Fixing', category: 'Budget' },
  ],
};

export default function ReconciliationsView() {
  const [expanded, setExpanded] = useState(null);

  const maxRate = 100;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Trend Chart — SVG Sparkline */}
      <div className="bento-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700' }}>Match Rate Trend</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Last 5 billing periods</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              {MOCK_RUNS[0].matchRate}%
            </div>
            <div style={{ fontSize: '11px', color: MOCK_RUNS[0].matchRate > MOCK_RUNS[1].matchRate ? '#EF4444' : '#10B981', fontWeight: '600' }}>
              {MOCK_RUNS[0].matchRate > MOCK_RUNS[1].matchRate ? '▲' : '▼'} vs prev. period
            </div>
          </div>
        </div>

        {/* SVG Line Chart */}
        {(() => {
          const runs = [...MOCK_RUNS].reverse();
          const W = 100, H = 60;
          const minR = 93, maxR = 101;
          const pts = runs.map((r, i) => ({
            x: (i / (runs.length - 1)) * W,
            y: H - ((r.matchRate - minR) / (maxR - minR)) * H,
            run: r
          }));
          const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
          const areaD = `${pathD} L ${pts[pts.length-1].x} ${H} L 0 ${H} Z`;

          return (
            <svg viewBox={`0 0 100 ${H + 20}`} style={{ width: '100%', height: '100px', overflow: 'visible' }} preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0037FF" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#0037FF" stopOpacity="0" />
                </linearGradient>
                {/* Target line at 99% */}
                <line id="target" x1="0" y1={H - ((99 - minR) / (maxR - minR)) * H} x2="100" y2={H - ((99 - minR) / (maxR - minR)) * H} />
              </defs>
              {/* Target 99% dashed */}
              <line x1="0" y1={H - ((99 - minR) / (maxR - minR)) * H} x2="100" y2={H - ((99 - minR) / (maxR - minR)) * H}
                stroke="#10B981" strokeWidth="0.4" strokeDasharray="2,1.5" opacity="0.5" />
              <text x="101" y={H - ((99 - minR) / (maxR - minR)) * H + 1} fontSize="3.5" fill="#10B981" opacity="0.7">Target 99%</text>
              {/* Area fill */}
              <path d={areaD} fill="url(#areaGrad)" />
              {/* Line */}
              <path d={pathD} fill="none" stroke="#0037FF" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
              {/* Dots + Labels */}
              {pts.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="1.8" fill="white" stroke="#0037FF" strokeWidth="1" />
                  <text x={p.x} y={H + 8} textAnchor="middle" fontSize="3.5" fill="#98A0B4" fontWeight="600">
                    {p.run.label.split(' ')[0].slice(0, 3)}
                  </text>
                  <text x={p.x} y={p.y - 4} textAnchor="middle" fontSize="3.2"
                    fill={p.run.matchRate >= 99 ? '#10B981' : p.run.matchRate >= 97 ? '#F59E0B' : '#EF4444'}
                    fontWeight="700">
                    {p.run.matchRate}%
                  </text>
                </g>
              ))}
            </svg>
          );
        })()}

        {/* Mini KPI row */}
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

      {/* Run History Table */}
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
                <motion.tr
                  onClick={() => setExpanded(expanded === run.id ? null : run.id)}
                  style={{ cursor: 'pointer' }}
                  whileHover={{ backgroundColor: '#F8F9FF' }}
                >
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
                          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Discrepancies in this run</div>
                          {MOCK_DETAILS[run.id].map((d) => (
                            <div key={d.io} style={{ display: 'flex', gap: '1.5rem', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px', alignItems: 'center' }}>
                              <span style={{ fontWeight: '700', color: 'var(--primary)', width: '120px' }}>{d.io}</span>
                              <span style={{ flex: 1 }}>{d.account}</span>
                              <span style={{ color: 'var(--text-muted)' }}>{d.category}</span>
                              <span style={{ color: '#EF4444', fontWeight: '700' }}>-${Math.abs(d.diff).toLocaleString()}</span>
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
