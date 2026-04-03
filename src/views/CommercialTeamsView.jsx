import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ChevronDown, ChevronRight, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const TEAMS = [
  {
    manager: 'Mariana Tunno', email: 'mariana.tunno@alephholding.com', region: 'LATAM South', avatar: 'MT',
    total: 48, errors: 2, fixing: 1, matched: 45,
    items: [
      { io: 'TW-50473210', account: "L'Oréal Argentina", diff: 0, status: 'Matched' },
      { io: 'TW-10573626', account: 'Coca-Cola CL', diff: 0, status: 'Matched' },
      { io: 'TW-10590112', account: 'Reckitt AR', diff: -940, status: 'Error' },
    ]
  },
  {
    manager: 'Silvia Rodriguez', email: 'silvia.rodriguez@alephholding.com', region: 'LATAM North', avatar: 'SR',
    total: 61, errors: 3, fixing: 0, matched: 58,
    items: [
      { io: 'TW-10573655', account: 'Mercado Libre MEX', diff: -3700.50, status: 'Error' },
      { io: 'TW-10573729', account: 'Unilever AR', diff: -1600, status: 'Error' },
      { io: 'TW-10573808', account: 'Bimbo MEX', diff: 0, status: 'Matched' },
    ]
  },
  {
    manager: 'Santiago G.', email: 'santiago.g@alephholding.com', region: 'Brazil', avatar: 'SG',
    total: 72, errors: 0, fixing: 0, matched: 72,
    items: [
      { io: 'TW-10573702', account: 'Netflix BR', diff: 0, status: 'Matched' },
      { io: 'TW-10573741', account: 'Ambev BR', diff: 0, status: 'Matched' },
    ]
  },
  {
    manager: 'Bautista B.', email: 'bautista.b@alephholding.com', region: 'Andean', avatar: 'BB',
    total: 29, errors: 1, fixing: 1, matched: 27,
    items: [
      { io: 'TW-10573662', account: 'Samsung AR', diff: -2800, status: 'Error' },
      { io: 'TW-10573700', account: 'Claro CO', diff: 0, status: 'Fixing' },
    ]
  },
];

export default function CommercialTeamsView() {
  const [expanded, setExpanded] = useState(null);

  const getHealthColor = (errors) => errors === 0 ? '#10B981' : errors <= 2 ? '#F59E0B' : '#EF4444';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {TEAMS.map(t => (
          <div key={t.manager} className="bento-card" style={{ padding: '1.25rem', cursor: 'pointer' }} onClick={() => setExpanded(expanded === t.manager ? null : t.manager)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', flexShrink: 0 }}>
                {t.avatar}
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '13px' }}>{t.manager}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.region}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
              <span style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontWeight: '800', color: '#10B981' }}>{t.matched}</div>
                <div style={{ color: 'var(--text-muted)' }}>OK</div>
              </span>
              <span style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontWeight: '800', color: getHealthColor(t.errors) }}>{t.errors}</div>
                <div style={{ color: 'var(--text-muted)' }}>Errors</div>
              </span>
              <span style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontWeight: '800', color: '#F59E0B' }}>{t.fixing}</div>
                <div style={{ color: 'var(--text-muted)' }}>Fixing</div>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Table */}
      <div className="data-table-wrapper">
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', fontWeight: '700', fontSize: '14px' }}>
          Manager Portfolio Detail
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th></th>
              <th>Manager</th>
              <th>Region</th>
              <th>Total IOs</th>
              <th>Health</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {TEAMS.map(t => (
              <React.Fragment key={t.manager}>
                <motion.tr onClick={() => setExpanded(expanded === t.manager ? null : t.manager)} style={{ cursor: 'pointer' }}>
                  <td style={{ width: '32px' }}>
                    {expanded === t.manager ? <ChevronDown size={16} style={{ color: 'var(--primary)' }} /> : <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' }}>
                        {t.avatar}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{t.manager}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{t.region}</td>
                  <td style={{ fontWeight: '600' }}>{t.total}</td>
                  <td>
                    <span className={`status-pill ${t.errors === 0 ? 'status-matched' : 'status-error'}`}>
                      {t.errors === 0 ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                      {t.errors === 0 ? 'Clean' : `${t.errors} open`}
                    </span>
                  </td>
                  <td>
                    <a href={`mailto:${t.email}?subject=[Aleph Recon] Portfolio Update&body=Hi ${t.manager.split(' ')[0]}, please review your open discrepancies in Recon Studio.`}
                      onClick={e => e.stopPropagation()}
                      className="btn-premium btn-ghost" style={{ padding: '6px 10px', fontSize: '11px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={12} /> Contact
                    </a>
                  </td>
                </motion.tr>
                <AnimatePresence>
                  {expanded === t.manager && (
                    <tr>
                      <td colSpan={6} style={{ padding: 0, backgroundColor: '#FAFAFD' }}>
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          style={{ padding: '1rem 2.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Portfolio IOs</div>
                          {t.items.map((item) => (
                            <div key={item.io} style={{ display: 'flex', gap: '1.5rem', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px', alignItems: 'center' }}>
                              <span style={{ fontWeight: '700', color: 'var(--primary)', width: '120px' }}>{item.io}</span>
                              <span style={{ flex: 1 }}>{item.account}</span>
                              <span className={`status-pill status-${item.status.toLowerCase()}`}>
                                {item.status === 'Matched' ? <CheckCircle2 size={10} /> : item.status === 'Fixing' ? <Clock size={10} /> : <AlertCircle size={10} />}
                                {item.status}
                              </span>
                              {item.diff !== 0 && <span style={{ color: '#EF4444', fontWeight: '700' }}>-${Math.abs(item.diff).toLocaleString()}</span>}
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
