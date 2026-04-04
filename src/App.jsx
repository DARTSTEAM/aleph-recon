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
import ReconciliationsView from './views/ReconciliationsView';
import DataSourcesView from './views/DataSourcesView';
import CommercialTeamsView from './views/CommercialTeamsView';
import NotificationsView from './views/NotificationsView';
import SettingsView from './views/SettingsView';
import HelpView from './views/HelpView';
import { sendFollowUpEmail, sendBulkFollowUpEmails, checkApiHealth } from './utils/apiService';

const MOCK_RECON_ITEMS = [
  { id: '1', io: 'TW-50473210', account: "L'Oréal Argentina", manager: 'Mariana Tunno', sfBudget: 12500, twBilling: 12500, diff: 0, status: 'Matched', category: 'Budget' },
  { id: '2', io: 'TW-10573655', account: 'Mercado Libre MEX', manager: 'Silvia Rodriguez', sfBudget: 45200, twBilling: 48900.50, diff: -3700.50, status: 'Error', category: 'Taxes', comment: 'LATAM Retención 5% not applied in SF' },
  { id: '3', io: 'TW-10573702', account: 'Netflix BR', manager: 'Santiago G.', sfBudget: 82000, twBilling: 82000, diff: 0, status: 'Matched', category: 'Budget' },
  { id: '4', io: 'TW-10573662', account: 'Samsung AR', manager: 'Bautista B.', sfBudget: 15400, twBilling: 18200, diff: -2800, status: 'Error', category: 'Commission', comment: 'Wrong Commission tier (15% vs 8%)' },
  { id: '5', io: 'TW-10573626', account: 'Coca-Cola CL', manager: 'Mariana Tunno', sfBudget: 22000, twBilling: 22000, diff: 0, status: 'Matched', category: 'Budget' },
  { id: '6', io: 'TW-10573729', account: 'Unilever AR', manager: 'Silvia Rodriguez', sfBudget: 5600, twBilling: 7200, diff: -1600, status: 'Error', category: 'Budget', comment: 'Delivery report vs Billing report mismatch' },
];

// --- Login Screen ---
function LoginScreen({ onLogin, onDevLogin }) {
  const [creds, setCreds] = useState({ user: '', pass: '' });
  const [error, setError] = useState('');

  const handleDevLogin = (e) => {
    e.preventDefault();
    if (creds.user === 'admin' && creds.pass === 'admin') {
      onDevLogin();
    } else {
      setError('Invalid credentials');
      setTimeout(() => setError(''), 2000);
    }
  };

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
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '2rem', lineHeight: '1.6' }}>
          Twitter (X) Reconciliation &amp; Follow-up<br />Management Platform
        </p>

        {/* Google Sign In */}
        <button onClick={onLogin} className="btn-premium btn-solid" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '14px', marginBottom: '1.5rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>OR TEST ACCESS</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        {/* Dev Login Form */}
        <form onSubmit={handleDevLogin} style={{ textAlign: 'left' }}>
          <input
            type="text" placeholder="Username" value={creds.user}
            onChange={e => setCreds(p => ({ ...p, user: e.target.value }))}
            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: '14px', outline: 'none', marginBottom: '8px', fontFamily: 'var(--font-brand)' }}
          />
          <input
            type="password" placeholder="Password" value={creds.pass}
            onChange={e => setCreds(p => ({ ...p, pass: e.target.value }))}
            style={{ width: '100%', padding: '10px 14px', border: `1px solid ${error ? '#FCA5A5' : 'var(--border-strong)'}`, borderRadius: '8px', fontSize: '14px', outline: 'none', marginBottom: '8px', fontFamily: 'var(--font-brand)' }}
          />
          {error && <p style={{ color: '#EF4444', fontSize: '12px', marginBottom: '8px' }}>{error}</p>}
          <button type="submit" className="btn-premium btn-ghost" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
            Enter as Test User
          </button>
        </form>

        <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '1.5rem' }}>Production access restricted to Aleph Finance Operations</p>
      </motion.div>
    </div>
  );
}

// --- Sidebar Item ---
const SidebarItem = ({ icon: Icon, label, active = false, onClick }) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px',
      cursor: 'pointer', transition: 'all 0.2s', color: active ? 'var(--primary)' : 'var(--text-secondary)',
      backgroundColor: active ? 'rgba(0,55,255,0.06)' : 'transparent',
      fontWeight: active ? '700' : '500', fontSize: '14px', marginBottom: '2px',
      userSelect: 'none'
    }}
  >
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
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [devUser, setDevUser] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [apiStatus, setApiStatus] = useState(null); // null | 'ok' | 'no-email' | 'down'
  const [toast, setToast] = useState(null); // { message, type: 'success'|'error' }
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
      setFirebaseUser(u);
      setAuthLoading(false);
    });
  }, []);

  // --- Firestore real-time listener ---
  useEffect(() => {
    if (!firebaseUser && !devUser) return;
    let unsub = () => {};
    try {
      unsub = subscribeToItems((firestoreItems) => {
        if (firestoreItems.length > 0) {
          setItems(firestoreItems);
          setUseFirestore(true);
        } else {
          setItems(MOCK_RECON_ITEMS);
        }
      });
    } catch (err) {
      console.warn('Firestore unavailable, using mock data:', err);
      setItems(MOCK_RECON_ITEMS);
    }
    return unsub;
  }, [firebaseUser, devUser]);

  // --- API health check on login ---
  useEffect(() => {
    if (!firebaseUser && !devUser) return;
    checkApiHealth().then(h => {
      if (h.status === 'unreachable') setApiStatus('down');
      else if (!h.emailConfigured) setApiStatus('no-email');
      else setApiStatus('ok');
    });
  }, [firebaseUser, devUser]);

  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); }
    catch (e) { console.error(e); }
  };

  const handleDevLogin = () => setDevUser(true);

  const handleLogout = () => { signOut(auth); setDevUser(false); };

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
    if (!sfData || !twData) return;
    const reconciled = reconcileData(sfData, twData);
    setSaving(true);
    saveReconciliationRun(reconciled)
      .then(() => setSaving(false))
      .catch((err) => { console.warn('Firestore write failed:', err); setSaving(false); setItems(reconciled); });
  }, [sfData, twData]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleFollowUp = async (item) => {
    const activeUser = firebaseUser || { email: 'admin@aleph.test' };
    // Optimistic local update
    setItems(prev => prev.map(i => i.io === item.io ? { ...i, status: 'Fixing', comment: `Follow-up sent to ${item.manager}` } : i));
    // Firestore update (best effort)
    try { await updateItemStatus(item.io, 'Fixing', item.manager, activeUser.email); } catch (_) {}
    // Real email via API
    const result = await sendFollowUpEmail(item, activeUser.email);
    if (result.success) showToast(`Email sent to ${item.manager} ✓`);
    else if (result.fallback) showToast('API unavailable — email draft opened instead', 'warn');
    else showToast(`Email failed: ${result.error}`, 'error');
  };

  const handleResolve = async (item) => {
    try {
      await resolveItem(item.io);
    } catch (err) {
      // Firestore unavailable: update local state
      setItems(prev => prev.map(i => i.io === item.io ? { ...i, status: 'Matched', comment: 'Resolved manually' } : i));
    }
  };

  const user = firebaseUser || (devUser ? { displayName: 'Admin', email: 'admin@aleph.test', photoURL: null } : null);

  if (authLoading && !devUser) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
      <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
    </div>
  );

  if (!user) return <LoginScreen onLogin={handleLogin} onDevLogin={handleDevLogin} />;

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

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
              padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              background: toast.type === 'error' ? '#FEF2F2' : toast.type === 'warn' ? '#FFFBEB' : '#F0FDF4',
              color: toast.type === 'error' ? '#991B1B' : toast.type === 'warn' ? '#92400E' : '#14532D',
              border: `1px solid ${toast.type === 'error' ? '#FECACA' : toast.type === 'warn' ? '#FDE68A' : '#BBF7D0'}`,
              display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '360px'
            }}>
            {toast.type === 'error' ? '✕' : toast.type === 'warn' ? '⚠' : '✓'} {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

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
          <SidebarItem icon={LayoutDashboard} label="Dashboard"         active={activeView === 'dashboard'}         onClick={() => setActiveView('dashboard')} />
          <SidebarItem icon={Activity}         label="Reconciliations"   active={activeView === 'recon'}            onClick={() => setActiveView('recon')} />
          <SidebarItem icon={Database}         label="Data Sources"       active={activeView === 'sources'}          onClick={() => setActiveView('sources')} />
          <SidebarItem icon={Users}            label="Commercial Teams"   active={activeView === 'teams'}            onClick={() => setActiveView('teams')} />
          <SidebarItem icon={Bell}             label="Notifications"      active={activeView === 'notifications'}    onClick={() => setActiveView('notifications')} />
          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '1.5rem 0' }} />
          <SidebarItem icon={Settings}         label="Settings"           active={activeView === 'settings'}         onClick={() => setActiveView('settings')} />
          <SidebarItem icon={HelpCircle}       label="Help"               active={activeView === 'help'}             onClick={() => setActiveView('help')} />
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
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <h1>{
              activeView === 'dashboard' ? 'Q1 2026 Reconciliation' :
              activeView === 'recon' ? 'Reconciliations' :
              activeView === 'sources' ? 'Data Sources' :
              activeView === 'teams' ? 'Commercial Teams' :
              activeView === 'notifications' ? 'Notifications' :
              activeView.charAt(0).toUpperCase() + activeView.slice(1)
            }</h1>
            {useFirestore && <span style={{ fontSize: '11px', color: '#10B981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>● Live</span>}
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {saving && <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><RefreshCw size={14} className="animate-spin" /> Syncing...</span>}
            <button className="btn-premium btn-solid" onClick={() => setActiveView('sources')}>
              <DownloadCloud size={16} /> Import Dataset
            </button>
          </div>
        </header>

        {/* View Router */}
        {activeView === 'recon' && <ReconciliationsView />}
        {activeView === 'sources' && <DataSourcesView />}
        {activeView === 'teams' && <CommercialTeamsView />}
        {activeView === 'notifications' && <NotificationsView />}
        {activeView === 'settings' && <SettingsView />}
        {activeView === 'help' && <HelpView />}

        {activeView === 'dashboard' && <>
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
                  onClick={async () => {
                    if (!confirm(`Bulk send follow-up emails for all ${errorCount} open discrepancies?`)) return;
                    const activeUser = firebaseUser || { email: 'admin@aleph.test' };
                    showToast(`Sending ${errorCount} emails...`, 'info');
                    const result = await sendBulkFollowUpEmails(items, activeUser.email);
                    if (result.success) showToast(`${result.sent} emails sent successfully ✓`);
                    else showToast(`Bulk send failed: ${result.error}`, 'error');
                  }}>
                  <Mail size={13} /> Bulk Notify ({errorCount})
                </button>
              )}
              <button className="btn-premium btn-solid" style={{ padding: '8px 14px', fontSize: '12px' }}
                onClick={() => {
                  const headers = ['IO Number', 'Account', 'Manager', 'SF Budget', 'Twitter Billing', 'Discrepancy', 'Category', 'Status', 'Comment'];
                  const rows = items.map(i => [
                    i.io, i.account, i.manager,
                    i.sfBudget, i.twBilling, i.diff,
                    i.category || '', i.status, i.comment || ''
                  ]);
                  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Aleph_Recon_Q1-2026_${new Date().toISOString().slice(0,10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}>
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
        </> }
      </main>
    </div>
  );
}

export default App;
