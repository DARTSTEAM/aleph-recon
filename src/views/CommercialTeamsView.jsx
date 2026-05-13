import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, ChevronDown, ChevronRight, AlertCircle, Clock, CheckCircle2,
  X, ArrowRight, Eye, Plus, Pencil, Trash2, Save, UserPlus, Users
} from 'lucide-react';
import { useT } from '../i18n/index.jsx';
import {
  subscribeToManagers,
  saveManager,
  deleteManager
} from '../utils/firestoreService';

// ─── Fallback data if Firestore is empty ──────────────────────────────────────
const SEED_MANAGERS = [
  { name: 'Mariana Tunno',   email: 'mariana.tunno@alephholding.com',   region: 'LATAM South' },
  { name: 'Silvia Rodriguez', email: 'silvia.rodriguez@alephholding.com', region: 'LATAM North' },
  { name: 'Bautista B.',      email: 'bautista.b@alephholding.com',       region: 'Andean'      },
  { name: 'Martin ABN',       email: 'martin.abn@abndigital.com.ar',      region: 'Argentina'   },
];

const REGIONS = ['LATAM South', 'LATAM North', 'Brazil', 'Andean', 'Mexico', 'APAC', 'EMEA', 'Africa'];

// ─── Manager Form Modal ───────────────────────────────────────────────────────
const ManagerFormModal = ({ manager, onClose, onSave }) => {
  const [form, setForm] = useState(
    manager
      ? { name: manager.name, email: manager.email, region: manager.region }
      : { name: '', email: '', region: REGIONS[0] }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!manager?.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required');
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...(isEdit ? { id: manager.id } : {}), ...form });
      onClose();
    } catch (err) {
      setError('Failed to save. Try again.');
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ background: 'white', borderRadius: '16px', width: '480px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', overflow: 'hidden' }}
      >
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '800', fontSize: '15px' }}>{isEdit ? 'Edit Manager' : 'Add Manager'}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {isEdit ? 'Update contact in the directory' : 'Add to the managers directory'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {[
            { label: 'Full Name', key: 'name', type: 'text', placeholder: 'e.g. Mariana Tunno' },
            { label: 'Email', key: 'email', type: 'email', placeholder: 'e.g. mariana.tunno@alephholding.com' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key} style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                {label}
              </label>
              <input
                type={type}
                value={form[key]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: 'var(--font-brand)', boxSizing: 'border-box' }}
              />
            </div>
          ))}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Region
            </label>
            <select
              value={form.region}
              onChange={e => setForm(p => ({ ...p, region: e.target.value }))}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: 'var(--font-brand)', background: 'white', cursor: 'pointer', boxSizing: 'border-box' }}
            >
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {error && <p style={{ color: '#EF4444', fontSize: '12px', marginBottom: '12px' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn-premium btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-premium btn-solid" style={{ flex: 2, justifyContent: 'center' }}>
              <Save size={14} /> {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Manager'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// ─── IO Preview Modal (read-only) ─────────────────────────────────────────────
const IOPreview = ({ item, onClose }) => {
  const { t } = useT();
  if (!item) return null;
  const hasDiff = item.diff !== 0;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ background: 'white', borderRadius: '16px', width: '640px', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: '800', fontSize: '16px', color: 'var(--primary)', marginBottom: '4px' }}>{item.io}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{item.account}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><X size={20} /></button>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>{t('preview.comparison')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'start' }}>
            <div style={{ background: '#EFF6FF', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>{t('preview.salesforce')}</div>
              {[[t('preview.ioNumber'), item.io], [t('preview.account'), item.account], [t('preview.netBudget'), `$${item.sfBudget?.toLocaleString()}`], [t('preview.category'), item.category]].map(([label, value]) => (
                <div key={label} style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10px', color: '#60A5FA', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', paddingTop: '3rem' }}><ArrowRight size={18} style={{ color: 'var(--text-muted)' }} /></div>
            <div style={{ background: hasDiff ? '#FEF2F2' : '#F0FDF4', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: hasDiff ? '#DC2626' : '#16A34A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>{t('preview.twitter')}</div>
              {[[t('preview.ioNumber'), item.io], [t('preview.account'), item.account], [t('preview.billedAmount'), `$${item.twBilling?.toLocaleString()}`], [t('preview.category'), item.category]].map(([label, value]) => (
                <div key={label} style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10px', color: hasDiff ? '#FCA5A5' : '#86EFAC', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
          {hasDiff ? (
            <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#FEF2F2', borderRadius: '10px', border: '1px solid #FECACA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '700', color: '#991B1B', fontSize: '13px' }}>{t('preview.discrepancyDetected')}</div>
                {item.comment && <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px' }}>{item.comment}</div>}
              </div>
              <div style={{ fontWeight: '800', fontSize: '20px', color: '#DC2626' }}>-${Math.abs(item.diff).toLocaleString()}</div>
            </div>
          ) : (
            <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#F0FDF4', borderRadius: '10px', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={18} style={{ color: '#16A34A' }} />
              <span style={{ fontWeight: '700', color: '#15803D' }}>{t('preview.fullyMatched')}</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main View ────────────────────────────────────────────────────────────────
export default function CommercialTeamsView() {
  const { t } = useT();
  const [managers, setManagers]         = useState([]);
  const [loadingManagers, setLoading]   = useState(true);
  const [expanded, setExpanded]         = useState(null);
  const [showClean, setShowClean]       = useState(false);
  const [previewIO, setPreviewIO]       = useState(null);
  const [formModal, setFormModal]       = useState(null); // null | 'new' | manager object
  const [confirmDelete, setConfirmDelete] = useState(null); // manager to delete

  // Subscribe to Firestore managers
  useEffect(() => {
    let unsub = () => {};
    try {
      unsub = subscribeToManagers((firestoreManagers) => {
        if (firestoreManagers.length > 0) {
          setManagers(firestoreManagers);
        } else {
          // Seed with mock data if directory is empty
          setManagers(SEED_MANAGERS.map((m, i) => ({ ...m, id: `seed-${i}`, totalIOs: 0, okCount: 0, errors: 0, fixing: 0, portfolio: [] })));
        }
        setLoading(false);
      });
    } catch (err) {
      console.warn('Firestore managers unavailable, using fallback:', err);
      setManagers(SEED_MANAGERS.map((m, i) => ({ ...m, id: `seed-${i}`, totalIOs: 0, okCount: 0, errors: 0, fixing: 0, portfolio: [] })));
      setLoading(false);
    }
    return unsub;
  }, []);

  const handleSave = async (managerData) => {
    await saveManager(managerData);
  };

  const handleDelete = async (manager) => {
    await deleteManager(manager.id);
    setConfirmDelete(null);
    setExpanded(null);
  };

  const withErrors = managers.filter(m => m.errors > 0 || m.fixing > 0);
  const clean      = managers.filter(m => m.errors === 0 && m.fixing === 0);
  const visible    = showClean ? managers : (withErrors.length > 0 ? withErrors : managers);

  if (loadingManagers) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)', fontSize: '13px', gap: '10px' }}>
      <div style={{ width: '16px', height: '16px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      Loading managers directory…
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

      <AnimatePresence>
        {previewIO && <IOPreview item={previewIO} onClose={() => setPreviewIO(null)} />}
        {(formModal !== null) && (
          <ManagerFormModal
            manager={formModal === 'new' ? null : formModal}
            onClose={() => setFormModal(null)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setConfirmDelete(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'white', borderRadius: '14px', padding: '2rem', width: '420px', boxShadow: '0 24px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Trash2 size={20} style={{ color: '#EF4444' }} />
              </div>
              <div style={{ fontWeight: '800', fontSize: '16px', marginBottom: '8px' }}>Remove Manager?</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                <strong>{confirmDelete.name}</strong> will be removed from the directory. This cannot be undone.
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setConfirmDelete(null)} className="btn-premium btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button onClick={() => handleDelete(confirmDelete)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#EF4444', color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: 'var(--font-brand)' }}>
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="data-table-wrapper">
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={16} style={{ color: 'var(--primary)' }} />
            <div style={{ fontWeight: '700', fontSize: '14px' }}>Managers Directory</div>
            <span style={{ fontSize: '11px', background: '#F0F3FF', color: 'var(--primary)', padding: '2px 8px', borderRadius: '20px', fontWeight: '700' }}>
              {managers.length} contacts
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {clean.length > 0 && (
              <>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{clean.length} clean hidden</span>
                <button className="btn-premium btn-ghost" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => setShowClean(s => !s)}>
                  {showClean ? 'Hide clean' : 'Show all'}
                </button>
              </>
            )}
            <button className="btn-premium btn-solid" style={{ fontSize: '12px', padding: '7px 14px' }} onClick={() => setFormModal('new')}>
              <UserPlus size={13} /> Add Manager
            </button>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th></th>
              <th>{t('table.manager')}</th>
              <th>{t('table.region')}</th>
              <th>Email</th>
              <th>{t('table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(m => (
              <React.Fragment key={m.id}>
                <motion.tr
                  onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                  style={{ cursor: 'pointer' }}
                  whileHover={{ backgroundColor: '#F8F9FF' }}
                >
                  <td style={{ width: '32px' }}>
                    {expanded === m.id
                      ? <ChevronDown size={16} style={{ color: 'var(--primary)' }} />
                      : <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '11px', flexShrink: 0 }}>
                        {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '13px' }}>{m.name}</div>
                        {(m.errors > 0 || m.fixing > 0) ? (
                          <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: '600' }}>
                            <AlertCircle size={10} style={{ display: 'inline', marginRight: '3px' }} />
                            {m.errors} error{m.errors !== 1 ? 's' : ''}{m.fixing > 0 ? `, ${m.fixing} fixing` : ''}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#10B981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle2 size={10} /> Clean
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{m.region}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{m.email}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                      <a href={`mailto:${m.email}`} className="btn-premium btn-ghost" style={{ fontSize: '11px', padding: '5px 10px' }}>
                        <Mail size={12} /> Contact
                      </a>
                      <button onClick={() => setFormModal(m)} className="btn-premium btn-ghost" style={{ fontSize: '11px', padding: '5px 10px' }}>
                        <Pencil size={12} /> Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete(m)}
                        style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </motion.tr>

                <AnimatePresence>
                  {expanded === m.id && (
                    <tr>
                      <td colSpan={5} style={{ padding: 0, backgroundColor: '#FAFAFD' }}>
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ padding: '1.25rem 2.5rem', borderTop: '1px solid var(--border-subtle)' }}
                        >
                          {m.portfolio && m.portfolio.filter(io => io.status !== 'Matched').length > 0 ? (
                            <>
                              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                                Open IOs
                              </div>
                              {m.portfolio.filter(io => io.status !== 'Matched').map(io => (
                                <div key={io.io}
                                  onClick={() => setPreviewIO(io)}
                                  style={{ display: 'flex', gap: '1.5rem', padding: '10px 12px', borderRadius: '8px', marginBottom: '4px', fontSize: '13px', alignItems: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#F0F3FF'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                  <span style={{ fontWeight: '700', color: 'var(--primary)', width: '120px' }}>{io.io}</span>
                                  <span style={{ flex: 1 }}>{io.account}</span>
                                  <span className={`status-pill status-${io.status.toLowerCase()}`}>
                                    {io.status === 'Matched' ? <CheckCircle2 size={10} /> : io.status === 'Fixing' ? <Clock size={10} /> : <AlertCircle size={10} />}
                                    {io.status}
                                  </span>
                                  {io.diff !== 0 && <span style={{ color: '#EF4444', fontWeight: '700', width: '80px', textAlign: 'right' }}>-${Math.abs(io.diff).toLocaleString()}</span>}
                                  <span style={{ color: 'var(--primary)', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={12} /> View</span>
                                </div>
                              ))}
                            </>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '13px', gap: '8px' }}>
                              <CheckCircle2 size={28} style={{ color: '#10B981' }} />
                              <span>No open discrepancies for {m.name}</span>
                            </div>
                          )}
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </React.Fragment>
            ))}

            {visible.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No managers found. Add one using the button above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
