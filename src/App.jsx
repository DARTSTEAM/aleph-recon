import React, { useState, useEffect, useCallback } from 'react';
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
  Clock,
  ShieldCheck,
  TrendingDown,
  FileSpreadsheet,
  DownloadCloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { processReconciliation, readExcel } from './utils/reconciler';

const MOCK_RECON_ITEMS = [
  { id: 1, io: 'TW-50473210', account: 'L\'Oréal Argentina', manager: 'Mariana Tunno', sf_budget: 12500, tw_billing: 12500, diff: 0, status: 'Matched', type: 'Budget' },
  { id: 2, io: 'TW-10573655', account: 'Mercado Libre MEX', manager: 'Silvia Rodriguez', sf_budget: 45200, tw_billing: 48900.50, diff: -3700.50, status: 'Error', type: 'Taxes', comment: 'LATAM Retención 5% not applied in SF' },
  { id: 3, io: 'TW-10573702', account: 'Netflix BR', manager: 'Santiago G.', sf_budget: 82000, tw_billing: 82000, diff: 0, status: 'Matched', type: 'Budget' },
  { id: 4, io: 'TW-10573662', account: 'Samsung AR', manager: 'Bautista B.', sf_budget: 15400, tw_billing: 18200, diff: -2800, status: 'Fixing', type: 'Commission', comment: 'Wrong Commission tier (15% vs 8%)' },
  { id: 5, io: 'TW-10573626', account: 'Coca-Cola CL', manager: 'Mariana Tunno', sf_budget: 22000, tw_billing: 22000, diff: 0, status: 'Matched', type: 'Budget' },
  { id: 6, io: 'TW-10573729', account: 'Unilever AR', manager: 'Silvia Rodriguez', sf_budget: 5600, tw_billing: 7200, diff: -1600, status: 'Error', type: 'Budget', comment: 'Delivery report vs Billing report mismatch' },
];

const SummaryCard = ({ label, value, trend, trendColor, icon: Icon }) => (
  <motion.div 
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    className="card-panel stat-card"
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
      <div style={{ padding: '0.625rem', backgroundColor: '#EFF6FF', borderRadius: '10px' }}>
        <Icon size={18} style={{ color: '#2563EB' }} />
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '1rem', fontSize: '0.75rem', fontWeight: '500' }}>
      <span style={{ color: trendColor }}>{trend || '+12.5%'}</span>
      <span style={{ color: 'var(--text-muted)' }}>since last close</span>
    </div>
  </motion.div>
);

function App() {
  const [items, setItems] = useState(MOCK_RECON_ITEMS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [files, setFiles] = useState({ sf: null, tw: null, statement: null });

  const handleFileUpload = (type, file) => {
    setFiles(prev => ({ ...prev, [type]: file }));
    handleRefresh();
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const stats = [
    { label: 'Total Volume', value: `$${items.reduce((acc, curr) => acc + curr.tw_billing, 0).toLocaleString()}`, icon: FileSpreadsheet, trend: '98 countries active', trendColor: '#16A34A' },
    { label: 'Unresolved Issues', value: items.filter(i => i.status === 'Error').length.toString(), icon: AlertCircle, trend: '4 critical', trendColor: '#DC2626' },
    { label: 'Team Actions', value: '12', icon: Mail, trend: 'Follow-ups pending', trendColor: '#2563EB' },
    { label: 'Success Rate', value: '92%', icon: BarChart3, trend: '+2% from last week', trendColor: '#16A34A' },
  ];

  const filteredItems = items.filter(i => 
    i.io.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.manager.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="main-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <img 
            src="https://lever-client-logos.s3.us-west-2.amazonaws.com/939c1eda-6bdd-4f5f-b213-5316b3e62e2c-1695365909215.png" 
            alt="Aleph Logo" 
            style={{ height: '36px', width: 'auto' }}
          />
          <div style={{ height: '24px', width: '1px', backgroundColor: '#E5E7EB' }}></div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>Recon Studio</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>Twitter (X) Automation Engine</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={handleRefresh}>
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            Sync Salesforce
          </button>
          <button className="btn btn-primary shadow-blue">
            <PlusCircle size={16} />
            New Close
          </button>
        </div>
      </header>

      {/* Analytics Summary */}
      <section className="dashboard-grid">
        {stats.map((stat, idx) => (
          <SummaryCard key={idx} {...stat} />
        ))}
      </section>

      {/* Corporate Data Ingestion */}
      <div className="card-panel" style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <DownloadCloud size={18} className="text-blue-600" style={{ color: '#2563EB' }} /> Data Ingestion Center
        </h3>
        <div className="dashboard-grid" style={{ marginBottom: 0 }}>
          <div className="dropzone-inner">
            <div style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#1E40AF' }}>Salesforce Source</div>
            <label style={{ cursor: 'pointer' }}>
               <input type="file" hidden onChange={(e) => handleFileUpload('sf', e.target.files[0])} />
               <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{files.sf ? files.sf.name : 'Drop Salesforce .xlsx here'}</div>
            </label>
          </div>
          <div className="dropzone-inner">
            <div style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#1E40AF' }}>Twitter Billing</div>
            <label style={{ cursor: 'pointer' }}>
               <input type="file" hidden onChange={(e) => handleFileUpload('tw', e.target.files[0])} />
               <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{files.tw ? files.tw.name : 'Drop Billing .xlsx here'}</div>
            </label>
          </div>
          <div className="dropzone-inner">
            <div style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#1E40AF' }}>Partner Statement</div>
            <label style={{ cursor: 'pointer' }}>
               <input type="file" hidden onChange={(e) => handleFileUpload('statement', e.target.files[0])} />
               <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{files.statement ? files.statement.name : 'Drop Statement .xlsx here'}</div>
            </label>
          </div>
        </div>
      </div>

      {/* Global Reconciliation Table */}
      <div className="card-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
            <input 
              type="text" 
              placeholder="Filter by account, IO or manager..." 
              className="search-input"
              style={{
                width: '100%',
                padding: '0.5rem 1rem 0.5rem 2.25rem',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '0.875rem',
                outline: 'none'
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
             <button className="btn btn-outline" style={{ padding: '0.4rem 0.75rem' }}>Region: All</button>
             <button className="btn btn-primary" style={{ padding: '0.4rem 0.75rem' }}>Export Close</button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="reconcile-table">
            <thead>
              <tr>
                <th>Publisher POID</th>
                <th>Account & Responsible</th>
                <th>SF Budget</th>
                <th>X Billing</th>
                <th>Difference</th>
                <th>Status</th>
                <th>Issue Details</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredItems.map((item) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={item.id}
                  >
                    <td style={{ fontWeight: '700', color: '#1E40AF' }}>{item.io}</td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{item.account}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{item.manager}</div>
                    </td>
                    <td style={{ fontWeight: '500' }}>${item.sf_budget.toLocaleString()}</td>
                    <td style={{ fontWeight: '500' }}>${item.tw_billing.toLocaleString()}</td>
                    <td>
                      {item.diff !== 0 ? (
                        <span style={{ color: 'var(--accent-error)', fontWeight: '700' }}>
                           ${item.diff.toLocaleString()}
                        </span>
                      ) : (
                        <span style={{ color: '#16A34A', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${item.status.toLowerCase()}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                       <div style={{ maxWidth: '220px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {item.comment ? (
                             <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <AlertCircle size={14} style={{ color: 'var(--accent-warning)', flexShrink: 0 }} />
                                <span>{item.comment}</span>
                             </div>
                          ) : 'No discrepancies found'}
                       </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                         {item.status !== 'Matched' && (
                            <button 
                              className="btn btn-primary" 
                              style={{ padding: '0.4rem', backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #DBEAFE' }}
                              onClick={() => alert(`Sending follow-up to ${item.manager}`)}
                            >
                               <Mail size={14} />
                            </button>
                         )}
                         <button className="btn btn-outline" style={{ padding: '0.4rem' }}>
                            <ExternalLink size={14} />
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

      <footer style={{ marginTop: '4rem', paddingBottom: '2rem', display: 'flex', justifyContent: 'space-between', color: '#9CA3AF', fontSize: '0.75rem' }}>
          <div>&copy; 2026 Aleph Global Finance Operations. Confidential.</div>
          <div style={{ display: 'flex', gap: '1rem' }}>
             <span>Terms of Data</span>
             <span>System Status: Optimal</span>
          </div>
      </footer>
    </div>
  );
}

export default App;
