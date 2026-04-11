import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle2, AlertCircle, Search, ChevronLeft, ChevronRight, RefreshCw, X } from 'lucide-react';
import { useT } from '../i18n/index.jsx';
import { readExcelFile, reconcileData } from '../utils/reconciler.js';
import { saveReconciliationRun } from '../utils/firestoreService.js';

// ─── Static upload history (cosmetic) ─────────────────────────────────────────
const UPLOAD_HISTORY = [
  { id: 1, type: 'Salesforce',      filename: 'SF_Export_Mar26_v3.xlsx',            records: 312, uploadedAt: '2026-03-31 14:22', status: 'Processed' },
  { id: 2, type: 'Twitter Billing', filename: '03-2026 IMS Billing File.xlsx',       records: 298, uploadedAt: '2026-03-31 14:18', status: 'Processed' },
  { id: 3, type: 'Salesforce',      filename: 'SF_Export_Feb26_final.xlsx',          records: 287, uploadedAt: '2026-02-28 11:05', status: 'Processed' },
  { id: 4, type: 'Criteo Billing',  filename: 'BillingReport_Aleph&Directs_Feb26.xlsx', records: 28, uploadedAt: '2026-02-28 11:00', status: 'Processed' },
  { id: 5, type: 'Salesforce',      filename: 'SF_Export_Jan26.xlsx',               records: 301, uploadedAt: '2026-01-31 16:30', status: 'Processed' },
  { id: 6, type: 'Twitter Billing', filename: '01-2026 IMS Billing File.xlsx',       records: 292, uploadedAt: '2026-01-31 16:11', status: 'Processed' },
];

const PAGE_SIZE = 4;

// ─── File type auto-detection ──────────────────────────────────────────────────
function detectFileType(filename = '') {
  const lower = filename.toLowerCase();
  if (lower.includes('sf_') || lower.includes('salesforce') || lower.includes('export')) return 'Salesforce';
  // Criteo before generic 'billing' / 'reconc' checks
  if (lower.includes('criteo') || lower.startsWith('billingreport_aleph')) return 'Criteo Billing';
  if (lower.includes('reconc') || lower.includes('reconcilia')) return 'Salesforce';
  if (lower.includes('ims') || lower.includes('billing') || lower.includes('twitter') || lower.includes(' x ')) return 'Twitter Billing';
  return null;
}

const PLATFORM_COLORS = {
  'Twitter Billing': '#1a1a1a',
  'Criteo Billing':  '#F96900',
  'Meta Billing':    '#1877F2',
  'Salesforce':      '#1D4ED8',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function DataSourcesView() {
  const { t } = useT();
  const [sfFile, setSfFile]           = useState(null);
  const [billingFile, setBillingFile] = useState(null);   // Twitter | Criteo | Meta
  const [billingType, setBillingType] = useState(null);   // detected platform
  const [unknownFile, setUnknownFile] = useState(null);
  const [dragging, setDragging]       = useState(false);
  const [processing, setProcessing]   = useState(false);
  const [result, setResult]           = useState(null);   // { matched, errors, saved }
  const [error, setError]             = useState(null);
  const inputRef = useRef();

  // Upload history table
  const [historySearch, setHistorySearch] = useState('');
  const [historyPage, setHistoryPage]     = useState(1);

  // ─── File selection ──────────────────────────────────────────────────────────
  const processFiles = (files) => {
    files.forEach(file => {
      const type = detectFileType(file.name);
      if (type === 'Salesforce') {
        setSfFile(file);
      } else if (type === 'Twitter Billing' || type === 'Criteo Billing' || type === 'Meta Billing') {
        setBillingFile(file);
        setBillingType(type);
      } else {
        setUnknownFile(file);
      }
    });
    setResult(null);
    setError(null);
  };

  const handleDrop     = (e) => { e.preventDefault(); setDragging(false); processFiles(Array.from(e.dataTransfer.files)); };
  const handleInput    = (e) => processFiles(Array.from(e.target.files));
  const handleClassify = (type) => {
    if (type === 'Salesforce') {
      setSfFile(unknownFile);
    } else {
      setBillingFile(unknownFile);
      setBillingType(type);
    }
    setUnknownFile(null);
  };

  // ─── Real reconciliation ─────────────────────────────────────────────────────
  const handleProcess = async () => {
    if (!sfFile || !billingFile) return;
    setProcessing(true);
    setError(null);
    setResult(null);
    try {
      // Read both files
      const sfData      = await readExcelFile(sfFile, 'sf');
      const billingData = await readExcelFile(billingFile, 'auto');  // auto-detects twitter|criteo|meta

      // Reconcile
      const reconciled = reconcileData(sfData, billingData);

      // Save to Firestore
      await saveReconciliationRun(reconciled, 'Latest');

      setResult({
        total:   reconciled.length,
        matched: reconciled.filter(i => i.status === 'Matched').length,
        errors:  reconciled.filter(i => i.status === 'Error').length,
        platform: billingData.platform || 'unknown',
      });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unknown error during reconciliation');
    } finally {
      setProcessing(false);
    }
  };

  // ─── History table ───────────────────────────────────────────────────────────
  const filteredHistory = UPLOAD_HISTORY.filter(h =>
    h.filename.toLowerCase().includes(historySearch.toLowerCase()) ||
    h.type.toLowerCase().includes(historySearch.toLowerCase())
  );
  const totalPages  = Math.ceil(filteredHistory.length / PAGE_SIZE);
  const pagedHistory = filteredHistory.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE);

  const canRun = sfFile && billingFile && !processing;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

      {/* ── Upload Zone ── */}
      <div className="bento-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '4px' }}>{t('sources.uploadTitle')}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('sources.uploadSub')}</div>
          </div>
          {/* Supported platforms */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Supported:</span>
            {[
              { label: '𝕏 Twitter', color: '#1a1a1a' },
              { label: '🟠 Criteo',  color: '#F96900' },
              { label: '🔵 Meta',    color: '#1877F2' },
            ].map(({ label, color }) => (
              <span key={label} style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', border: `1px solid ${color}33`, color, background: `${color}10` }}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--border-strong)'}`,
            borderRadius: '12px', padding: '2.5rem', textAlign: 'center', cursor: 'pointer',
            background: dragging ? '#F0F3FF' : '#FAFBFF', transition: 'all 0.2s', marginBottom: '1.25rem'
          }}>
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" multiple style={{ display: 'none' }} onChange={handleInput} />
          <Upload size={28} style={{ color: dragging ? 'var(--primary)' : 'var(--text-muted)', marginBottom: '8px' }} />
          <div style={{ fontWeight: '600', fontSize: '14px', color: dragging ? 'var(--primary)' : 'var(--text-primary)' }}>
            {t('sources.dropZoneTitle')}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Drop both files together, or click to select. Auto-detects Twitter, Criteo and Meta billing files.
          </div>
        </div>

        {/* Unknown file — ask user to classify */}
        <AnimatePresence>
          {unknownFile && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ fontWeight: '700', fontSize: '13px', color: '#92400E', marginBottom: '8px' }}>
                ⚠ {t('sources.cannotDetect')} <em>{unknownFile.name}</em>
              </div>
              <div style={{ fontSize: '12px', color: '#78350F', marginBottom: '10px' }}>{t('sources.whatType')}</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="btn-premium btn-ghost" style={{ fontSize: '12px' }} onClick={() => handleClassify('Salesforce')}>
                  📊 {t('sources.isSF')}
                </button>
                <button className="btn-premium btn-ghost" style={{ fontSize: '12px' }} onClick={() => handleClassify('Twitter Billing')}>
                  𝕏 {t('sources.isTW')}
                </button>
                <button className="btn-premium btn-ghost" style={{ fontSize: '12px', borderColor: '#F9690033', color: '#F96900' }} onClick={() => handleClassify('Criteo Billing')}>
                  🟠 Criteo Billing
                </button>
                <button className="btn-premium btn-ghost" style={{ fontSize: '12px', borderColor: '#1877F233', color: '#1877F2' }} onClick={() => handleClassify('Meta Billing')}>
                  🔵 Meta Billing
                </button>
                <button className="btn-premium btn-ghost" style={{ fontSize: '11px', color: 'var(--text-muted)' }} onClick={() => setUnknownFile(null)}>
                  <X size={11} /> Discard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detected files — 2 slots */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          {/* SF slot */}
          <label style={{ padding: '1rem', borderRadius: '10px', cursor: 'pointer',
            background: sfFile ? '#EFF6FF' : '#F8F9FF',
            border: `1px solid ${sfFile ? '#1D4ED833' : 'var(--border-subtle)'}` }}>
            <input type="file" hidden accept=".xlsx,.csv" onChange={e => e.target.files[0] && processFiles([e.target.files[0]])} />
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              {t('sources.sfExport')}
            </div>
            {sfFile ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={15} style={{ color: '#10B981', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sfFile.name}</span>
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('sources.waiting')}</div>
            )}
          </label>

          {/* Billing slot — platform-agnostic */}
          <label style={{ padding: '1rem', borderRadius: '10px', cursor: 'pointer',
            background: billingFile ? '#F5F3FF' : '#F8F9FF',
            border: `1px solid ${billingFile ? '#7C3AED33' : 'var(--border-subtle)'}` }}>
            <input type="file" hidden accept=".xlsx,.csv" onChange={e => e.target.files[0] && processFiles([e.target.files[0]])} />
            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px',
              color: billingFile ? (PLATFORM_COLORS[billingType] || '#7C3AED') : '#7C3AED' }}>
              {billingType || 'Billing File'}&nbsp;
              {billingType && <span style={{ textTransform: 'none', fontWeight: '500', fontSize: '10px', opacity: 0.7 }}>auto-detected</span>}
            </div>
            {billingFile ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={15} style={{ color: '#10B981', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{billingFile.name}</span>
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Twitter/X · Criteo · Meta</div>
            )}
          </label>
        </div>

        {/* Run button + results */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            className="btn-premium btn-solid"
            disabled={!canRun}
            onClick={handleProcess}
            style={{ opacity: canRun ? 1 : 0.4, cursor: canRun ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {processing
              ? <><RefreshCw size={14} className="animate-spin" /> {t('action.processing')}</>
              : `⚡ ${t('action.runRecon')}`}
          </button>

          {!sfFile && !billingFile && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('sources.uploadBoth')}</span>
          )}

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', borderRadius: '10px', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <CheckCircle2 size={16} style={{ color: '#16A34A' }} />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#15803D' }}>
                  ✓ Reconciliation complete — {result.total} IOs ({result.matched} matched, {result.errors} errors)
                </span>
                <span style={{ fontSize: '11px', color: '#78350F', background: '#FEF9C3', padding: '2px 8px', borderRadius: '20px', fontWeight: '700' }}>
                  Saved to dashboard
                </span>
              </motion.div>
            )}
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <AlertCircle size={15} style={{ color: '#DC2626' }} />
                <span style={{ fontSize: '12px', color: '#991B1B', fontWeight: '600' }}>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Upload History ── */}
      <div className="data-table-wrapper">
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: '700', fontSize: '14px' }}>{t('sources.historyTitle')}</div>
          <div className="search-container" style={{ width: '280px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder={t('sources.searchHistory')} className="search-input-bespoke"
              value={historySearch} onChange={e => { setHistorySearch(e.target.value); setHistoryPage(1); }} />
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('table.type')}</th><th>{t('table.filename')}</th><th>{t('table.records')}</th><th>{t('table.uploaded')}</th><th>{t('table.status')}</th>
            </tr>
          </thead>
          <tbody>
            {pagedHistory.map(h => (
              <tr key={h.id}>
                <td>
                  <span style={{ padding: '3px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: '700',
                    background: `${PLATFORM_COLORS[h.type] || '#6B7280'}11`,
                    color: PLATFORM_COLORS[h.type] || '#6B7280' }}>
                    {h.type}
                  </span>
                </td>
                <td style={{ fontWeight: '500', fontSize: '13px' }}>{h.filename}</td>
                <td>{h.records.toLocaleString()}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{h.uploadedAt}</td>
                <td><span className="status-pill status-matched"><CheckCircle2 size={11} /> {t('status.processed')}</span></td>
              </tr>
            ))}
            {pagedHistory.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>{t('table.noResults', { q: historySearch })}</td></tr>
            )}
          </tbody>
        </table>
        {/* Pagination */}
        <div style={{ padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-muted)' }}>
          <span>{t('sources.showingResults', { from: Math.min((historyPage - 1) * PAGE_SIZE + 1, filteredHistory.length), to: Math.min(historyPage * PAGE_SIZE, filteredHistory.length), total: filteredHistory.length })}</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="btn-premium btn-ghost" style={{ padding: '4px 10px', fontSize: '12px' }} disabled={historyPage === 1} onClick={() => setHistoryPage(p => p - 1)}>
              <ChevronLeft size={13} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} className="btn-premium" style={{ padding: '4px 10px', fontSize: '12px',
                background: historyPage === i + 1 ? 'var(--primary)' : 'transparent',
                color: historyPage === i + 1 ? 'white' : 'inherit', border: '1px solid var(--border-strong)' }}
                onClick={() => setHistoryPage(i + 1)}>{i + 1}</button>
            ))}
            <button className="btn-premium btn-ghost" style={{ padding: '4px 10px', fontSize: '12px' }} disabled={historyPage === totalPages} onClick={() => setHistoryPage(p => p + 1)}>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
