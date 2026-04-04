import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, ChevronRight, Mail, FileText, BookOpen, MessageSquare } from 'lucide-react';
import { useT } from '../i18n/index.jsx';

const FAQ_EN = [
  {
    q: 'What does "Discrepancy" mean in this dashboard?',
    a: 'A discrepancy is the difference between the Net Budget registered in Salesforce (the billing source of truth) and the actual spend/cost reported by Twitter in the monthly Billing File. This difference must be reconciled before close.'
  },
  {
    q: 'When should I click "Follow-up" on an error row?',
    a: 'Click Follow-up as soon as you identify the root cause or when you need the commercial manager to update Salesforce. The system will open a pre-filled email with all IO details and transition the row to "Fixing" status automatically.'
  },
  {
    q: 'What is the difference between "Error" and "Fixing"?',
    a: '"Error" means a discrepancy was detected but no action has been taken yet. "Fixing" means a follow-up has been sent and we are waiting for Salesforce to be updated. Once confirmed, click "Mark Resolved" to transition to "Matched".'
  },
  {
    q: 'How often should I run a reconciliation?',
    a: 'Typically once per month at month-end close. Upload the latest Salesforce export and the Twitter monthly billing file (from IMS) to generate the reconciliation. Both files must correspond to the same billing period.'
  },
  {
    q: 'What Twitter file format is expected?',
    a: 'The IMS monthly Billing File in .xlsx format. The key columns needed are "IO number" and "Spend" (or "Delivery"). If your file uses different column names, update them in Settings > Column Mapping.'
  },
  {
    q: 'Which Salesforce fields are used for matching?',
    a: 'The reconciliation engine uses "Publisher POID" (or "IO Number") as the primary key to match records, and "Bill Net Budget" as the budget reference to compare against Twitter spend.'
  },
];

const FAQ_ES = [
  {
    q: '¿Qué significa "Discrepancia" en este dashboard?',
    a: 'Una discrepancia es la diferencia entre el Presupuesto Neto registrado en Salesforce (la fuente de verdad de facturación) y el gasto/costo real reportado por Twitter en el archivo de facturación mensual. Esta diferencia debe reconciliarse antes del cierre.'
  },
  {
    q: '¿Cuándo debo hacer clic en "Seguimiento" en una fila de error?',
    a: 'Hacé clic en Seguimiento en cuanto identifiques la causa raíz o cuando necesites que el manager comercial actualice Salesforce. El sistema abrirá un email pre-completado con todos los detalles del IO y transitará la fila al estado "En revisión" automáticamente.'
  },
  {
    q: '¿Cuál es la diferencia entre "Error" y "En revisión"?',
    a: '"Error" significa que se detectó una discrepancia pero todavía no se tomó ninguna acción. "En revisión" significa que se envió un seguimiento y estamos esperando que Salesforce sea actualizado. Una vez confirmado, hacé clic en "Marcar Resuelto" para pasar a "Coincidente".'
  },
  {
    q: '¿Con qué frecuencia debo ejecutar una reconciliación?',
    a: 'Típicamente una vez por mes al cierre de mes. Subí el último export de Salesforce y el archivo de facturación mensual de Twitter (de IMS) para generar la reconciliación. Ambos archivos deben correspondientes al mismo período de facturación.'
  },
  {
    q: '¿Qué formato de archivo de Twitter se espera?',
    a: 'El archivo de facturación mensual de IMS en formato .xlsx. Las columnas clave necesarias son "IO number" y "Spend" (o "Delivery"). Si tu archivo usa nombres de columna diferentes, actualizalos en Configuración > Mapeo de Columnas.'
  },
  {
    q: '¿Qué campos de Salesforce se usan para el matching?',
    a: 'El motor de reconciliación usa "Publisher POID" (o "IO Number") como clave primaria para hacer match de registros, y "Bill Net Budget" como referencia de presupuesto para comprar contra el gasto de Twitter.'
  },
];

const getDocLinks = (t) => [
  { icon: FileText, label: t('help.doc.sop.label'), desc: t('help.doc.sop.desc'), href: '#' },
  { icon: BookOpen, label: t('help.doc.billing.label'), desc: t('help.doc.billing.desc'), href: '#' },
  { icon: FileText, label: t('help.doc.sf.label'), desc: t('help.doc.sf.desc'), href: '#' },
  { icon: MessageSquare, label: t('help.doc.taxonomy.label'), desc: t('help.doc.taxonomy.desc'), href: '#' },
];

export default function HelpView() {
  const { t, lang } = useT();
  const [openFaq, setOpenFaq] = useState(null);

  const FAQ = lang === 'es' ? FAQ_ES : FAQ_EN;
  const DOC_LINKS = getDocLinks(t);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* FAQ */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
            {t('help.faqTitle')}
          </div>
          {FAQ.map((item, i) => (
            <div key={i} className="bento-card" style={{ marginBottom: '8px', padding: '0', overflow: 'hidden' }}>
              <div
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: '12px' }}>
                <div style={{ fontWeight: '600', fontSize: '13px', lineHeight: '1.4' }}>{item.q}</div>
                {openFaq === i ? <ChevronDown size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} /> : <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
              </div>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    <div style={{ padding: '0 1.25rem 1rem', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div>
          {/* Documentation */}
          <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
            {t('help.docsTitle')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
            {DOC_LINKS.map(({ icon: Icon, label, desc, href }) => (
              <a key={label} href={href} style={{ textDecoration: 'none' }}>
                <div className="bento-card" style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '1rem 1.25rem', transition: 'all 0.2s' }}>
                  <div style={{ padding: '8px', borderRadius: '8px', background: '#F0F3FF', color: 'var(--primary)', flexShrink: 0 }}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)' }}>{label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{desc}</div>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Support Contact */}
          <div className="bento-card" style={{ background: '#F8F9FF', border: '1px solid #E0E7FF' }}>
            <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '6px' }}>{t('help.needHelp')}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.5' }}>
              {t('help.supportDesc')}
            </div>
            <a
              href="mailto:finance-ops@alephholding.com?subject=[Recon Studio] Support Request"
              className="btn-premium btn-solid"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '10px 18px' }}>
              <Mail size={14} /> {t('help.contactTitle')}
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
