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
      {/* Trend Chart */}
      <div className="bento-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Match Rate Trend</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>Last 5 periods</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', height: '80px' }}>
          {[...MOCK_RUNS].reverse().map((run) => (
            <div key={run.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: run.matchRate >= 99 ? '#10B981' : run.matchRate >= 97 ? '#F59E0B' : '#EF4444' }}>
                {run.matchRate}%
              </div>
              <div style={{
                width: '100%', borderRadius: '6px 6px 0 0',
                height: `${(run.matchRate / maxRate) * 70}px`,
                background: run.matchRate >= 99 ? 'linear-gradient(135deg,#10B981,#34D399)' : run.matchRate >= 97 ? 'linear-gradient(135deg,#F59E0B,#FCD34D)' : 'linear-gradient(135deg,#EF4444,#FCA5A5)',
                transition: 'all 0.4s ease'
              }} />
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>{run.label.split(' ')[0]}</div>
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
