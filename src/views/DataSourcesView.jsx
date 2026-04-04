import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle2, AlertCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const UPLOAD_HISTORY = [
  { id: 1, type: 'Salesforce', filename: 'SF_Export_Mar26_v3.xlsx', records: 312, uploadedAt: '2026-03-31 14:22', status: 'Processed' },
  { id: 2, type: 'Twitter Billing', filename: '03-2026 IMS Billing File.xlsx', records: 298, uploadedAt: '2026-03-31 14:18', status: 'Processed' },
  { id: 3, type: 'Salesforce', filename: 'SF_Export_Feb26_final.xlsx', records: 287, uploadedAt: '2026-02-28 11:05', status: 'Processed' },
  { id: 4, type: 'Twitter Billing', filename: '02-2026 IMS Billing File.xlsx', records: 281, uploadedAt: '2026-02-28 10:58', status: 'Processed' },
  { id: 5, type: 'Salesforce', filename: 'SF_Export_Jan26.xlsx', records: 301, uploadedAt: '2026-01-31 16:30', status: 'Processed' },
  { id: 6, type: 'Twitter Billing', filename: '01-2026 IMS Billing File.xlsx', records: 292, uploadedAt: '2026-01-31 16:11', status: 'Processed' },
];

const PAGE_SIZE = 4;

function detectFileType(filename = '') {
  const lower = filename.toLowerCase();
  if (lower.includes('sf_') || lower.includes('salesforce') || lower.includes('export')) return 'Salesforce';
  if (lower.includes('ims') || lower.includes('billing') || lower.includes('twitter')) return 'Twitter Billing';
  return null;
}

export default function DataSourcesView() {
  const [sfFile, setSfFile] = useState(null);
  const [twFile, setTwFile] = useState(null);
  const [unknownFile, setUnknownFile] = useState(null);
  const [detectedType, setDetectedType] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef();

  // Table state
  const [historySearch, setHistorySearch] = useState('');
  const [historyPage, setHistoryPage] = useState(1);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const processFiles = (files) => {
    files.forEach(file => {
      const type = detectFileType(file.name);
      if (type === 'Salesforce') setSfFile(file);
      else if (type === 'Twitter Billing') setTwFile(file);
      else {
        setUnknownFile(file);
        setDetectedType(null);
      }
    });
  };

  const handleClassify = (type) => {
    if (type === 'Salesforce') setSfFile(unknownFile);
    else setSfFile(null), setTwFile(unknownFile);
    setUnknownFile(null);
    setDetectedType(null);
  };

  const handleProcess = () => {
    if (!sfFile || !twFile) return;
    setProcessing(true);
    setTimeout(() => { setProcessing(false); setProcessed(true); }, 1800);
  };

  const filteredHistory = UPLOAD_HISTORY.filter(h =>
    h.filename.toLowerCase().includes(historySearch.toLowerCase()) ||
    h.type.toLowerCase().includes(historySearch.toLowerCase())
  );
  const totalPages = Math.ceil(filteredHistory.length / PAGE_SIZE);
  const pagedHistory = filteredHistory.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

      {/* ── Upload Zone ── */}
      <div className="bento-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '0.25rem' }}>Upload Files</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Drop any file — we'll auto-detect whether it's a Salesforce export or a Twitter billing file based on the filename and headers.
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
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" multiple style={{ display: 'none' }} onChange={handleFileInput} />
          <Upload size={28} style={{ color: dragging ? 'var(--primary)' : 'var(--text-muted)', marginBottom: '8px' }} />
          <div style={{ fontWeight: '600', fontSize: '14px', color: dragging ? 'var(--primary)' : 'var(--text-primary)' }}>
            Drop Salesforce and/or Twitter files here
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>or click to browse — .xlsx, .xls, .csv · both files at once supported</div>
        </div>

        {/* Unknown file — ask user to classify */}
        <AnimatePresence>
          {unknownFile && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ fontWeight: '700', fontSize: '13px', color: '#92400E', marginBottom: '8px' }}>
                ⚠ Can't auto-detect: <em>{unknownFile.name}</em>
              </div>
              <div style={{ fontSize: '12px', color: '#78350F', marginBottom: '10px' }}>What type of file is this?</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-premium btn-ghost" style={{ fontSize: '12px' }} onClick={() => handleClassify('Salesforce')}>📊 Salesforce Export</button>
                <button className="btn-premium btn-ghost" style={{ fontSize: '12px' }} onClick={() => handleClassify('Twitter')}>🐦 Twitter Billing</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detected files */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          {[
            { label: 'Salesforce Export', file: sfFile, color: '#1D4ED8', bg: '#EFF6FF' },
            { label: 'Twitter (X) Billing', file: twFile, color: '#7C3AED', bg: '#F5F3FF' },
          ].map(({ label, file, color, bg }) => (
            <div key={label} style={{ padding: '1rem', borderRadius: '10px', background: file ? bg : '#F8F9FF', border: `1px solid ${file ? color + '33' : 'var(--border-subtle)'}` }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{label}</div>
              {file ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={15} style={{ color: '#10B981', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Waiting for file...</div>
              )}
            </div>
          ))}
        </div>

        {/* Process button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="btn-premium btn-solid"
            disabled={!sfFile || !twFile || processing}
            onClick={handleProcess}
            style={{ opacity: sfFile && twFile ? 1 : 0.4, cursor: sfFile && twFile ? 'pointer' : 'not-allowed' }}>
            {processing ? '⏳ Processing...' : '⚡ Run Reconciliation'}
          </button>
          {processed && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#10B981', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={15} /> Reconciliation complete — check the Dashboard
            </motion.span>
          )}
          {!sfFile && !twFile && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Upload both files to run</span>
          )}
        </div>
      </div>

      {/* ── Upload History (paginated + searchable) ── */}
      <div className="data-table-wrapper">
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: '700', fontSize: '14px' }}>Upload History</div>
          <div className="search-container" style={{ width: '280px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text" placeholder="Search by filename or type..."
              className="search-input-bespoke"
              value={historySearch}
              onChange={e => { setHistorySearch(e.target.value); setHistoryPage(1); }}
            />
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th><th>Filename</th><th>Records</th><th>Uploaded</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {pagedHistory.map(h => (
              <tr key={h.id}>
                <td>
                  <span style={{ padding: '3px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: '700', background: h.type === 'Salesforce' ? '#EFF6FF' : '#F5F3FF', color: h.type === 'Salesforce' ? '#1D4ED8' : '#7C3AED' }}>
                    {h.type}
                  </span>
                </td>
                <td style={{ fontWeight: '500', fontSize: '13px' }}>{h.filename}</td>
                <td>{h.records.toLocaleString()}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{h.uploadedAt}</td>
                <td><span className="status-pill status-matched"><CheckCircle2 size={11} /> {h.status}</span></td>
              </tr>
            ))}
            {pagedHistory.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No results for "{historySearch}"</td></tr>
            )}
          </tbody>
        </table>
        {/* Pagination */}
        <div style={{ padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-muted)' }}>
          <span>Showing {Math.min((historyPage - 1) * PAGE_SIZE + 1, filteredHistory.length)}–{Math.min(historyPage * PAGE_SIZE, filteredHistory.length)} of {filteredHistory.length} files</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="btn-premium btn-ghost" style={{ padding: '4px 10px', fontSize: '12px' }} disabled={historyPage === 1} onClick={() => setHistoryPage(p => p - 1)}>
              <ChevronLeft size={13} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} className="btn-premium" style={{ padding: '4px 10px', fontSize: '12px', background: historyPage === i + 1 ? 'var(--primary)' : 'transparent', color: historyPage === i + 1 ? 'white' : 'inherit', border: '1px solid var(--border-strong)' }}
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
