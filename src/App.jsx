import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Upload, 
  Search, 
  FileCheck, 
  Mail, 
  MessageSquare, 
  AlertCircle,
  FileText,
  ChevronDown,
  ExternalLink,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SummaryCard = ({ label, value, trend, trendColor, icon: Icon }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-panel stat-card"
  >
    <div className="flex items-center justify-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="stat-label">{label}</div>
      <div className="p-2 bg-slate-700/50 rounded-lg">
        <Icon size={20} className="text-sky-400" />
      </div>
    </div>
    <div className="stat-value">{value}</div>
    <div className="flex items-center gap-1 mt-2 text-xs" style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem', fontSize: '0.75rem' }}>
      <span style={{ color: trendColor }}>{trend || '+12% from last month'}</span>
    </div>
  </motion.div>
);

const MOCK_RECON_ITEMS = [
  { id: 1, io: 'TW-50473210', account: 'L&apos;Oréal Argentina', manager: 'Mariana Tunno', sf_budget: 12500, tw_billing: 12500, diff: 0, status: 'Matched', type: 'Budget' },
  { id: 2, io: 'TW-10573655', account: 'Mercado Libre MEX', manager: 'Silvia Rodriguez', sf_budget: 45200, tw_billing: 48900.50, diff: -3700.50, status: 'Error', type: 'Taxes', comment: 'LATAM Retención 5% not applied in SF' },
  { id: 3, io: 'TW-10573702', account: 'Netflix BR', manager: 'Santiago G.', sf_budget: 82000, tw_billing: 82000, diff: 0, status: 'Matched', type: 'Budget' },
  { id: 4, io: 'TW-10573662', account: 'Samsung AR', manager: 'Bautista B.', sf_budget: 15400, tw_billing: 18200, diff: -2800, status: 'Fixing', type: 'Commission', comment: 'Wrong Commission tier (15% vs 8%)' },
  { id: 5, io: 'TW-10573626', account: 'Coca-Cola CL', manager: 'Mariana Tunno', sf_budget: 22000, tw_billing: 22000, diff: 0, status: 'Matched', type: 'Budget' },
  { id: 6, io: 'TW-10573729', account: 'Unilever AR', manager: 'Silvia Rodriguez', sf_budget: 5600, tw_billing: 7200, diff: -1600, status: 'Error', type: 'Budget', comment: 'Delivery report vs Billing report mismatch' },
];

function App() {
  const [items, setItems] = useState(MOCK_RECON_ITEMS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const stats = [
    { label: 'Total IOs Processed', value: '1,284', icon: FileText, trend: '+8% vs prev period', trendColor: '#10B981' },
    { label: 'Active Discrepancies', value: '42', icon: AlertCircle, trend: '-14% resolution time', trendColor: '#10B981' },
    { label: 'Pending Follow-ups', value: '18', icon: Mail, trend: '9 priority critical', trendColor: '#EF4444' },
    { label: 'Reconciliation Health', value: '96.4%', icon: BarChart3, trend: 'Target: 98%', trendColor: '#F59E0B' },
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const notifyUser = (manager) => {
    alert(`Mock: Sending follow-up email to ${manager} regarding discrepancies...`);
  };

  return (
    <div className="main-container">
      <header className="flex justify-between items-start" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            Aleph Recon Studio
          </motion.h1>
          <p className="subtitle">Twitter (X) Reconciliation & Automated Follow-up Management</p>
        </div>
        <div className="flex gap-3" style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={handleRefresh}>
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            Sync Sources
          </button>
          <button className="btn btn-primary">
            <PlusCircle size={18} />
            New Reconcile
          </button>
        </div>
      </header>

      {/* Stats Board */}
      <section className="dashboard-grid">
        {stats.map((stat, idx) => (
          <SummaryCard key={idx} {...stat} />
        ))}
      </section>

      {/* Control Area */}
      <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flexGrow: 1 }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} size={18} />
            <input 
              type="text" 
              placeholder="Search by IO, Account or Manager..." 
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.5rem',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius)',
                color: 'white',
                outline: 'none'
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>
              <Clock size={14} /> Quarter 1, 2026
            </div>
            <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>
              Region: LATAM <ChevronDown size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Recon Feed */}
      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Active Reconciliation Log</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
             <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Export PDF</button>
             <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Export Excel</button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="reconcile-table">
            <thead>
              <tr>
                <th>Publisher POID (IO)</th>
                <th>Account Name</th>
                <th>SF Budget</th>
                <th>Twitter Billing</th>
                <th>Difference</th>
                <th>Status</th>
                <th>Reason</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {items
                  .filter(i => i.io.includes(searchTerm) || i.account.toLowerCase().includes(searchTerm.toLowerCase()) || i.manager.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((item) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={item.id} 
                    className="row-item"
                  >
                    <td style={{ fontWeight: '600' }}>{item.io}</td>
                    <td>
                      <div style={{ fontWeight: '500' }}>{item.account}</div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Res: {item.manager}</div>
                    </td>
                    <td>${item.sf_budget.toLocaleString()}</td>
                    <td>${item.tw_billing.toLocaleString()}</td>
                    <td style={{ color: item.diff < 0 ? '#EF4444' : 'inherit', fontWeight: item.diff !== 0 ? '700' : '400' }}>
                      {item.diff !== 0 ? `$${item.diff.toLocaleString()}` : '-'}
                    </td>
                    <td>
                      <span className={`badge badge-${item.status.toLowerCase()}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                       <div style={{ maxWidth: '200px', fontSize: '0.8rem' }}>
                          {item.comment ? (
                            <div className="flex items-start gap-1" style={{ display: 'flex', gap: '0.25rem' }}>
                              <MessageSquare size={12} className="mt-1" />
                              <span>{item.comment}</span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>No errors detected</span>
                          )}
                       </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                         {item.status !== 'Matched' && (
                           <button 
                             className="btn btn-primary" 
                             style={{ padding: '0.4rem', borderRadius: '8px' }} 
                             title="Send Follow-up Email"
                             onClick={() => notifyUser(item.manager)}
                           >
                              <Mail size={16} />
                           </button>
                         )}
                         <button className="btn btn-outline" style={{ padding: '0.4rem', borderRadius: '8px' }}>
                            <ExternalLink size={16} />
                         </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <footer style={{ marginTop: '3rem', borderTop: '1px solid var(--glass-border)', padding: '1.5rem 0', display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
         <div>Aleph Hike-FAFO Automation Project. &copy; 2026</div>
         <div>Last data sync: 12 minutes ago from Salesforce API V2</div>
      </footer>
    </div>
  );
}

export default App;
