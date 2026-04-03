import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, CheckCircle2, FileSpreadsheet, Clock, Trash2, RefreshCw } from 'lucide-react';

const UPLOAD_HISTORY = [
  { id: 1, type: 'Salesforce', filename: 'SF_Export_Mar26_v3.xlsx', records: 312, uploadedAt: '2026-03-31 14:22', status: 'Processed' },
  { id: 2, type: 'Twitter Billing', filename: '03-2026 IMS Billing File.xlsx', records: 298, uploadedAt: '2026-03-31 14:18', status: 'Processed' },
  { id: 3, type: 'Salesforce', filename: 'SF_Export_Feb26_final.xlsx', records: 287, uploadedAt: '2026-02-28 11:05', status: 'Processed' },
  { id: 4, type: 'Twitter Billing', filename: '02-2026 IMS Billing File.xlsx', records: 281, uploadedAt: '2026-02-28 10:58', status: 'Processed' },
  { id: 5, type: 'Salesforce', filename: 'SF_Export_Jan26_v1.xlsx', records: 301, uploadedAt: '2026-01-31 16:45', status: 'Processed' },
];

const DropZone = ({ label, color, icon: Icon, onFile }) => {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);

  const handleFile = (f) => { setFile(f); if (onFile) onFile(f); };

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      style={{
        display: 'block', border: `2px dashed ${dragging ? color : '#E2E4EB'}`, borderRadius: '12px',
        padding: '2rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
        background: dragging ? `${color}08` : '#FAFAFC'
      }}>
      <input type="file" hidden accept=".xlsx,.csv" onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
      {file ? (
        <div>
          <CheckCircle2 size={24} style={{ color: '#10B981', marginBottom: '8px' }} />
          <div style={{ fontWeight: '700', fontSize: '14px', color: '#10B981' }}>{file.name}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{(file.size / 1024).toFixed(1)} KB</div>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '12px', color }}>
            <Icon size={28} />
          </div>
          <div style={{ fontWeight: '700', fontSize: '14px', color }}>{label}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Drag & drop or click to upload .xlsx / .csv</div>
        </div>
      )}
    </label>
  );
};

export default function DataSourcesView() {
  const [history, setHistory] = useState(UPLOAD_HISTORY);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Upload Zones */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="bento-card">
          <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '1rem', color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileSpreadsheet size={15} /> Salesforce Export
          </div>
          <DropZone label="Upload Salesforce Export" color="#1D4ED8" icon={Upload} />
        </div>
        <div className="bento-card">
          <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '1rem', color: '#6D28D9', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileSpreadsheet size={15} /> Twitter (X) Billing File
          </div>
          <DropZone label="Upload Twitter Billing File" color="#6D28D9" icon={Upload} />
        </div>
      </div>

      {/* Column Mapping Config */}
      <div className="bento-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '1.25rem' }}>Column Mapping Configuration</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {[
            { label: 'IO Number field (SF)', value: 'Publisher POID' },
            { label: 'IO Number field (Twitter)', value: 'IO number' },
            { label: 'Net Budget field (SF)', value: 'Bill Net Budget' },
            { label: 'Spend field (Twitter)', value: 'Spend' },
            { label: 'Account Name field', value: 'Account Name' },
            { label: 'Manager field', value: 'Commercial Owner' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</div>
              <input
                defaultValue={value}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: '13px', fontFamily: 'var(--font-brand)', outline: 'none', color: 'var(--text-primary)' }}
              />
            </div>
          ))}
        </div>
        <button className="btn-premium btn-solid" style={{ marginTop: '1rem', fontSize: '12px', padding: '8px 16px' }}>Save Mapping</button>
      </div>

      {/* Upload History */}
      <div className="data-table-wrapper">
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} style={{ color: 'var(--primary)' }} /> Upload History
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Filename</th>
              <th>Records</th>
              <th>Uploaded</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {history.map(h => (
              <tr key={h.id}>
                <td>
                  <span style={{ padding: '3px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: '700', background: h.type === 'Salesforce' ? '#EFF6FF' : '#F5F3FF', color: h.type === 'Salesforce' ? '#1D4ED8' : '#6D28D9' }}>
                    {h.type}
                  </span>
                </td>
                <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{h.filename}</td>
                <td>{h.records.toLocaleString()}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{h.uploadedAt}</td>
                <td>
                  <span className="status-pill status-matched">
                    <CheckCircle2 size={11} /> {h.status}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    <button className="btn-premium btn-ghost" style={{ padding: '5px 10px', fontSize: '11px' }}>
                      <RefreshCw size={11} /> Re-run
                    </button>
                    <button onClick={() => setHistory(p => p.filter(x => x.id !== h.id))} className="btn-premium" style={{ padding: '5px', fontSize: '11px', background: '#FFF5F5', color: '#EF4444', border: '1px solid #FED7D7' }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
