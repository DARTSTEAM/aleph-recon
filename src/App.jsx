import React, { useState, useEffect, useCallback } from 'react';
import { 
  CreditCard, Upload, Search, Activity, Mail, AlertCircle, FileText,
  RefreshCw, PlusCircle, CheckCircle2, XCircle, Clock, ShieldCheck,
  TrendingDown, Layers, LayoutDashboard, Users, Settings, HelpCircle,
  Bell, Database, LogOut, FileSpreadsheet, DownloadCloud, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { reconcileData, readExcelFile } from './utils/reconciler';
import { subscribeToItems, saveReconciliationRun, updateItemStatus, resolveItem } from './utils/firestoreService';

const MOCK_RECON_ITEMS = [
  { id: '1', io: 'TW-50473210', account: "L'Oréal Argentina", manager: 'Mariana Tunno', sfBudget: 12500, twBilling: 12500, diff: 0, status: 'Matched', category: 'Budget' },
  { id: '2', io: 'TW-10573655', account: 'Mercado Libre MEX', manager: 'Silvia Rodriguez', sfBudget: 45200, twBilling: 48900.50, diff: -3700.50, status: 'Error', category: 'Taxes', comment: 'LATAM Retención 5% not applied in SF' },
  { id: '3', io: 'TW-10573702', account: 'Netflix BR', manager: 'Santiago G.', sfBudget: 82000, twBilling: 82000, diff: 0, status: 'Matched', category: 'Budget' },
  { id: '4', io: 'TW-10573662', account: 'Samsung AR', manager: 'Bautista B.', sfBudget: 15400, twBilling: 18200, diff: -2800, status: 'Error', category: 'Commission', comment: 'Wrong Commission tier (15% vs 8%)' },
  { id: '5', io: 'TW-10573626', account: 'Coca-Cola CL', manager: 'Mariana Tunno', sfBudget: 22000, twBilling: 22000, diff: 0, status: 'Matched', category: 'Budget' },
  { id: '6', io: 'TW-10573729', account: 'Unilever AR', manager: 'Silvia Rodriguez', sfBudget: 5600, twBilling: 7200, diff: -1600, status: 'Error', category: 'Budget', comment: 'Delivery report vs Billing report mismatch' },
];

// --- Login Screen ---
function LoginScreen({ onLogin }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'white', borderRadius: '16px', padding: '3rem', textAlign: 'center', boxShadow: 'var(--shadow-lg)', maxWidth: '420px', width: '90%', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '2rem' }}>
          <div style={{ width: '36px', height: '36px', background: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Layers size={20} />
          </div>
          <img src="https://lever-client-logos.s3.us-west-2.amazonaws.com/939c1eda-6bdd-4f5f-b213-5316b3e62e2c-1695365909215.png" style={{ height: '24px' }} alt="Aleph" />
        </div>
        <h2 style={{ fontWeight: '800', fontSize: '1.5rem', letterSpacing: '-0.03em', marginBottom: '8px' }}>Recon Studio</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '2.5rem', lineHeight: '1.6' }}>
          Twitter (X) Reconciliation & Follow-up<br />Management Platform
        </p>
        <button onClick={onLogin} className="btn-premium btn-solid" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>
        <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '1.5rem' }}>Access restricted to Aleph Finance Operations team</p>
      </motion.div>
    </div>
  );
}

// --- Sidebar Item ---
const SidebarItem = ({ icon: Icon, label, active = false }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px',
    cursor: 'pointer', transition: 'all 0.2s', color: active ? 'var(--primary)' : 'var(--text-secondary)',
    backgroundColor: active ? 'rgba(0,55,255,0.06)' : 'transparent',
    fontWeight: active ? '700' : '500', fontSize: '14px', marginBottom: '2px'
  }}>
    <Icon size={17} /> {label}
  </div>
);

// --- Bento Stat Card ---
const BentoStat = ({ label, value, sub, icon: Icon }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bento-card">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
      <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#F0F3FF', color: 'var(--primary)' }}>
        <Icon size={18} />
      </div>
    </div>
    <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '4px', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>{value}</div>
    {sub && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>{sub}</div>}
  </motion.div>
);

// --- Main App ---
function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sfData, setSfData] = useState(null);
  const [twData, setTwData] = useState(null);
  const [files, setFiles] = useState({ sf: null, tw: null });
  const [useFirestore, setUseFirestore] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- Auth listener ---
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

  // --- Firestore real-time listener ---
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToItems((firestoreItems) => {
      if (firestoreItems.length > 0) {
        setItems(firestoreItems);
        setUseFirestore(true);
      } else {
        setItems(MOCK_RECON_ITEMS);
      }
    });
    return unsub;
  }, [user]);

  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); }
    catch (e) { console.error(e); }
  };

  const handleLogout = () => signOut(auth);

  const handleFileUpload = async (type, file) => {
    setFiles(prev => ({ ...prev, [type]: file }));
    try {
      const data = await readExcelFile(file);
      if (type === 'sf') setSfData(data);
      if (type === 'tw') setTwData(data);
    } catch (err) { alert('Error reading file. Make sure it is a valid .xlsx'); }
  };

  // --- Reconcile + save to Firestore ---
  useEffect(() => {
    if (!sfData || !twData || !user) return;
    const reconciled = reconcileData(sfData, twData);
    setSaving(true);
    saveReconciliationRun(reconciled)
      .then(() => setSaving(false))
      .catch(() => setSaving(false));
  }, [sfData, twData, user]);

  // --- Follow-up: update Firestore + open pre-filled email ---
  const handleFollowUp = async (item) => {
    try {
      await updateItemStatus(item.io, 'Fixing', item.manager, user.email);
      // Generate pre-filled email
      const subject = encodeURIComponent(`[Aleph Finance] Reconciliation Discrepancy - IO ${item.io}`);
      const body = encodeURIComponent(
        `Hi ${item.manager},\n\n` +
        `We identified a reconciliation discrepancy for the following campaign IO:\n\n` +
        `IO Number: ${item.io}\n` +
        `Account: ${item.account}\n` +
        `SF Net Budget: $${item.sfBudget?.toLocaleString()}\n` +
        `Twitter Billing: $${item.twBilling?.toLocaleString()}\n` +
        `Discrepancy: $${Math.abs(item.diff)?.toLocaleString()}\n` +
        `Category: ${item.category || 'Unknown'}\n\n` +
        `Please review and update Salesforce at your earliest convenience.\n\n` +
        `Regards,\nAleph Revenue Recognition Team\n\nTicket auto-generated by Aleph Recon Studio`
      );
      window.open(`mailto:?subject=${subject}&body=${body}`);
    } catch (err) {
      console.error('Follow-up error:', err);
    }
  };

  const handleResolve = async (item) => {
    try { await resolveItem(item.io); }
    catch (err) { console.error('Resolve error:', err); }
  };

  if (authLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
      <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
    </div>
  );

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  const filtered = items.filter(i =>
    (i.io || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.account || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.manager || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const errorCount = items.filter(i => i.status === 'Error').length;
  const fixingCount = items.filter(i => i.status === 'Fixing').length;
  const totalVolume = items.reduce((acc, i) => acc + (i.twBilling || 0), 0);

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside style={{ width: '260px', minHeight: '100vh', padding: '2rem 1.25rem', backgroundColor: 'white', borderRight: '1px solid var(--border-subtle)', position: 'sticky', top: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '30px', height: '30px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Layers size={16} />
          </div>
          <img src="https://lever-client-logos.s3.us-west-2.amazonaws.com/939c1eda-6bdd-4f5f-b213-5316b3e62e2c-1695365909215.png" style={{ height: '20px' }} alt="Aleph" />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', paddingLeft: '14px' }}>Workspace</div>
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active />
          <SidebarItem icon={Activity} label="Reconciliations" />
          <SidebarItem icon={Database} label="Data Sources" />
          <SidebarItem icon={Users} label="Commercial Teams" />
          <SidebarItem icon={Bell} label="Notifications" />
          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '1.5rem 0' }} />
          <SidebarItem icon={Settings} label="Settings" />
          <SidebarItem icon={HelpCircle} label="Help" />
        </div>

        {/* User Badge */}
        <div style={{ padding: '12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {user.photoURL && <img src={user.photoURL} style={{ width: '30px', height: '30px', borderRadius: '50%' }} alt="" />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.displayName?.split(' ')[0]}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
          </div>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="content-area">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Dashboard &rsaquo; Twitter (X) Close {useFirestore && <span style={{ color: '#10B981', marginLeft: '8px' }}>● Live</span>}
            </div>
            <h1>Q1 2026 Reconciliation</h1>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {saving && <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><RefreshCw size={14} className="animate-spin" /> Syncing...</span>}
            <button className="btn-premium btn-solid" onClick={() => {
              const el = document.createElement('input');
              el.type = 'file';
              el.click();
            }}>
              <DownloadCloud size={16} /> Import Dataset
            </button>
          </div>
        </header>

        {/* KPI Bento Grid */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <BentoStat label="Settled Volume" value={`$${(totalVolume / 1000).toFixed(0)}K`} sub="Twitter (X) spend" icon={CreditCard} />
          <BentoStat label="Unresolved Errors" value={errorCount} sub={`${fixingCount} in progress`} icon={AlertCircle} />
          <BentoStat label="Follow-ups Sent" value={fixingCount} sub="Awaiting SF update" icon={Mail} />
          <BentoStat label="Match Rate" value={`${items.length > 0 ? ((items.filter(i => i.status === 'Matched').length / items.length) * 100).toFixed(0) : 0}%`} sub="Target: 99%" icon={ShieldCheck} />
        </section>

        {/* File Upload Row */}
        <div className="bento-card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DownloadCloud size={16} style={{ color: 'var(--primary)' }} /> Data Sources
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[{ key: 'sf', label: 'Salesforce Export', color: '#1D4ED8' }, { key: 'tw', label: 'Twitter Billing File', color: '#6D28D9' }].map(({ key, label, color }) => (
              <label key={key} className="dropzone-inner" style={{ cursor: 'pointer', display: 'block' }}>
                <input type="file" hidden accept=".xlsx,.csv" onChange={(e) => e.target.files[0] && handleFileUpload(key, e.target.files[0])} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileSpreadsheet size={16} style={{ color }} />
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '13px', color }}>{label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{files[key] ? `✓ ${files[key].name}` : 'Click to upload .xlsx'}</div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Reconciliation Table */}
        <div className="data-table-wrapper">
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="search-container" style={{ width: '380px' }}>
              <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Filter by IO, account or manager..." className="search-input-bespoke" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {errorCount > 0 && (
                <button className="btn-premium" style={{ padding: '8px 14px', fontSize: '12px', background: '#FFF5F5', color: '#E53E3E', border: '1px solid #FED7D7' }}
                  onClick={() => {
                    if (confirm(`Bulk send follow-up for all ${errorCount} open discrepancies?`)) {
                      items.filter(i => i.status === 'Error').forEach(i => handleFollowUp(i));
                    }
                  }}>
                  <Mail size={13} /> Bulk Notify ({errorCount})
                </button>
              )}
              <button className="btn-premium btn-solid" style={{ padding: '8px 14px', fontSize: '12px' }}>
                <FileText size={13} /> Export Report
              </button>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Publisher POID</th>
                <th>Account</th>
                <th>SF Budget</th>
                <th>Twitter Cost</th>
                <th>Discrepancy</th>
                <th>Status</th>
                <th>Resolution Log</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((item) => (
                  <motion.tr key={item.id || item.io} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <td className="io-code">{item.io}</td>
                    <td>
                      <span style={{ display: 'block', fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>{item.account}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>Mgr: {item.manager}</span>
                    </td>
                    <td style={{ fontWeight: '600' }}>${(item.sfBudget || 0).toLocaleString()}</td>
                    <td style={{ fontWeight: '600' }}>${(item.twBilling || 0).toLocaleString()}</td>
                    <td>
                      {item.diff !== 0
                        ? <span style={{ color: 'var(--accent-error)', fontWeight: '800' }}>-${Math.abs(item.diff || 0).toLocaleString()}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>
                      <span className={`status-pill status-${(item.status || 'error').toLowerCase()}`}>
                        {item.status === 'Matched' ? <CheckCircle2 size={11} /> : item.status === 'Fixing' ? <Clock size={11} /> : <XCircle size={11} />}
                        {item.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {item.comment || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No discrepancies</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {item.status === 'Error' && (
                          <button className="btn-premium btn-solid" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => handleFollowUp(item)}>
                            <Mail size={12} /> Follow-up
                          </button>
                        )}
                        {item.status === 'Fixing' && (
                          <button className="btn-premium" style={{ padding: '6px 12px', fontSize: '11px', background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }} onClick={() => handleResolve(item)}>
                            <CheckCircle2 size={12} /> Mark Resolved
                          </button>
                        )}
                        <button className="btn-premium btn-ghost" style={{ padding: '6px' }}><ExternalLink size={13} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default App;
