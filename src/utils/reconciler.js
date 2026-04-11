/**
 * aleph-recon/src/utils/reconciler.js
 *
 * Multi-platform: Twitter/X, Meta/Facebook, and Criteo Billing Files.
 *
 * Key insight from Aleph's process (meeting transcript 2026-03-31):
 * - Twitter: unifying ID is "IO Header" (T2694837) = "PPO ID" in Salesforce
 * - Criteo:  unifying ID is "Advertiser ID" (numeric, e.g. 31764)
 *            SF uses "Publisher PO ID" format: "31764-February" → strip suffix
 * - Both Billing Files should be aggregated by key (multi-row per advertiser)
 */
import * as XLSX from 'xlsx';

export const ERROR_TYPES = {
  BUDGET:     'recon.category.budget',
  TAX:        'recon.category.taxes',
  COMMISSION: 'recon.category.commission',
  DELIVERY:   'recon.category.delivery',
  UNKNOWN:    'Unknown'
};

// ─── Platform Detection ───────────────────────────────────────────────────────

const META_SIGNALS    = ['Campaign ID', 'Advertiser', 'Amount Spent', 'Reach', 'Ad Account ID'];
const TW_SIGNALS_COLS = ['IO Header', 'Invoice #', 'Billing Party', 'Total Charges (in USD)'];
const CRITEO_SIGNALS  = ['Off.Doc.Number', 'Advertiser ID', 'Criteo company', 'BP Name', 'Net amount'];

/**
 * Detect the billing platform from filename + column signals.
 * Returns 'twitter' | 'meta' | 'criteo' | 'unknown'
 */
export function detectPlatform(filename = '', records = []) {
  const lower  = filename.toLowerCase();
  const sample = records.slice(0, 3);

  // Filename heuristics
  if (lower.includes('ims') || lower.includes('x billing') || lower.includes('twitter')) return 'twitter';
  if (lower.includes('meta') || lower.includes('facebook') || lower.includes('fb_ads')) return 'meta';
  if (lower.includes('criteo') || lower.includes('billingreport_aleph')) return 'criteo';

  // Column heuristics
  if (sample.length > 0) {
    const keys = Object.keys(sample[0]);
    const metaHits   = META_SIGNALS.filter(s => keys.some(k => k.includes(s))).length;
    const twHits     = TW_SIGNALS_COLS.filter(s => keys.some(k => k.includes(s))).length;
    const criteoHits = CRITEO_SIGNALS.filter(s => keys.some(k => k.includes(s))).length;
    if (criteoHits >= 2) return 'criteo';
    if (metaHits >= 2)   return 'meta';
    if (twHits >= 2)     return 'twitter';
  }

  return 'unknown';
}

/**
 * Normalize a Meta Billing File row to the same shape used by the Twitter reconciler.
 */
function normalizeMeta(records) {
  return records.map(r => ({
    'IO Header':                       String(r['Campaign ID'] ?? r['Ad Account ID'] ?? '').trim(),
    'Invoice #':                       String(r['Invoice Number'] ?? r['Reference'] ?? '').trim(),
    'Salesforce IO ID':                String(r['Campaign ID'] ?? '').trim(),
    'Billing Party':                   String(r['Advertiser'] ?? r['Ad Account Name'] ?? '').trim(),
    'Sold To Advertiser':              String(r['Advertiser'] ?? r['Ad Account Name'] ?? '').trim(),
    'Entered Currency':                String(r['Currency'] ?? 'USD').trim(),
    'Total Charges (in Entered Curr)': parseFloat(r['Amount Spent'] ?? r['Spend'] ?? 0),
    'Total Charges (in USD)':          parseFloat(r['Amount Spent (USD)'] ?? r['Amount Spent'] ?? 0),
    _platform: 'meta',
    _raw: r,
  }));
}

/**
 * Normalize a Criteo Billing File row.
 * Criteo BillingReport columns: Off.Doc.Number, Advertiser ID, Advertiser name,
 *   Currency, Gross amount, Net amount, Tax amount, BP, BP Name, Advertiser Country
 *
 * Key: Advertiser ID (numeric, e.g. 31764)
 * In Salesforce (Criteo), Publisher PO ID format is "31764-February" → strip the month suffix.
 */
function normalizeCriteo(records) {
  return records.map(r => ({
    'IO Header':                       String(r['Advertiser ID'] ?? '').trim(),   // "31764"
    'Invoice #':                       String(r['Off.Doc.Number'] ?? '').trim(),  // "B13ZZ12602005743"
    'Salesforce IO ID':                String(r['Advertiser ID'] ?? '').trim(),
    'Billing Party':                   String(r['BP Name'] ?? r['Criteo company'] ?? '').trim(),
    'Sold To Advertiser':              String(r['Advertiser name'] ?? '').trim(),
    'Entered Currency':                String(r['Currency'] ?? 'USD').trim(),
    'Total Charges (in Entered Curr)': parseFloat(r['Net amount'] ?? r['Gross amount'] ?? 0),
    'Total Charges (in USD)':          parseFloat(r['Net amount (USD)'] ?? r['Net amount'] ?? r['Gross amount'] ?? 0),
    _country:  String(r['Advertiser Country'] ?? '').trim(),
    _platform: 'criteo',
    _raw: r,
  }));
}

// ─── Sheet Detection ──────────────────────────────────────────────────────────

/**
 * Find the best sheet in the workbook for the given file type.
 * IMS Billing File: "Billing Report" is sheet[2], NOT sheet[0] "Invoice Template"
 */
function findBestSheet(workbook, fileType) {
  const names = workbook.SheetNames;

  if (fileType === 'twitter') {
    const preferred = names.find(n =>
      n === 'Billing Report' ||
      n.toLowerCase() === 'billing report' ||
      n.toLowerCase().includes('billing report') ||
      n.toLowerCase() === 'bil'
    );
    return preferred || names[0];
  }

  if (fileType === 'criteo') {
    // Criteo BillingReport has sheet 'Data' (main) and 'Direct'
    return names.find(n => n === 'Data' || n.toLowerCase() === 'data') || names[0];
  }

  if (fileType === 'sf') {
    const preferred = names.find(n =>
      n.toLowerCase() === 'sf' ||
      n.toLowerCase() === 'salesforce' ||
      n.toLowerCase().includes('salesforce')
    );
    return preferred || names[0];
  }

  // Auto-detect
  const billing = names.find(n =>
    n === 'Billing Report' || n.toLowerCase().includes('billing report')
  );
  const data = names.find(n => n === 'Data');
  return billing || data || names[0];
}

// ─── Header Row Detection ─────────────────────────────────────────────────────

const SF_SIGNALS = ['PPO ID', 'Division', 'Billing Country', 'Reporting Country', 'Company To Invoice Legal Name'];
const TW_SIGNALS = ['IO Header', 'Invoice #', 'Billing Party', 'Entered Currency', 'Total Charges (in USD)'];
const CRITEO_HDR_SIG = ['Off.Doc.Number', 'Advertiser ID', 'Net amount', 'Criteo company'];
const ALL_SIGNALS    = [...SF_SIGNALS, ...TW_SIGNALS, ...CRITEO_HDR_SIG, 'Publisher POID', 'IO number', 'Account Name'];

/**
 * Scan the first 12 rows to find which one is the real header row.
 * - Twitter IMS: metadata in Row 1, headers in Row 2
 * - Criteo:      headers in Row 1 (Off.Doc.Number)
 * - SF exports:  ≥4 metadata rows before the real header
 */
function findHeaderRowIndex(rows, fileType) {
  const signals = fileType === 'sf'      ? SF_SIGNALS
                : fileType === 'twitter' ? TW_SIGNALS
                : fileType === 'criteo'  ? CRITEO_HDR_SIG
                : ALL_SIGNALS;

  for (let i = 0; i < Math.min(12, rows.length); i++) {
    const row = rows[i] || [];
    const hits = signals.filter(sig =>
      row.some(cell => String(cell).trim() === sig)
    );
    if (hits.length >= 2) return i;
  }
  return 0;
}

// ─── Array-of-arrays → Array-of-objects ──────────────────────────────────────

function rowsToObjects(rows, headerIndex) {
  const headers = (rows[headerIndex] || []).map(h => String(h ?? '').trim());
  const result = [];

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every(v => v === '' || v == null)) continue;
    const obj = {};
    headers.forEach((h, idx) => { if (h) obj[h] = row[idx] ?? ''; });
    result.push(obj);
  }

  return result;
}

// ─── Public: readExcelFile ────────────────────────────────────────────────────

/**
 * Read an Excel file with smart sheet + header-row detection.
 * Returns { records, sheetName, headerIndex, fileType, platform }
 *
 * Backwards-compatible: reconcileData() accepts both the old plain array
 * and this new object format.
 * Sprint 3: auto-detects Meta billing files and normalizes columns.
 */
export const readExcelFile = (file, fileType = 'auto') => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data     = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName   = findBestSheet(workbook, fileType);
        const sheet       = workbook.Sheets[sheetName];
        const rawRows     = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        const headerIndex = findHeaderRowIndex(rawRows, fileType);
        let   records     = rowsToObjects(rawRows, headerIndex);

        // Sprint 3: detect platform and normalize Meta records
        const platform = detectPlatform(file.name, records);
        if (platform === 'meta')   records = normalizeMeta(records);
        if (platform === 'criteo') records = normalizeCriteo(records);

        resolve({ records, sheetName, headerIndex, fileType, platform });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

// ─── Public: reconcileData ────────────────────────────────────────────────────

/**
 * Cross-reference Salesforce data against a Billing File (Twitter/X or Meta).
 *
 * Primary key:   IO Header in IMS  (e.g. "T2694837")  =  PPO ID in SF
 * Secondary key: Invoice # in IMS  (e.g. "10573677")  =  Aleph internal #
 * Tertiary key:  Salesforce IO ID  (e.g. "320381104") =  Twitter's numeric ID
 *
 * Error categories use real Argentine rates:
 *   Commission 15% | Direct Tax 4.9% | With Tax 15.75%
 *
 * Sprint 3: twData can come from any platform (Twitter or Meta).
 * Meta rows are pre-normalized by readExcelFile → normalizeMeta().
 */
export const reconcileData = (sfData, twData) => {
  const sfRecords = Array.isArray(sfData) ? sfData : (sfData?.records ?? []);
  const twRecords = Array.isArray(twData) ? twData : (twData?.records ?? []);
  const platform  = twData?.platform || 'twitter';
  const result    = [];

  // Index TW records by all available keys.
  // IMPORTANT: the same IO Header can appear in MULTIPLE rows of the Billing Report
  // (e.g. Promoted Ads + Takeover for the same IO). We must SUM the charges, not overwrite.
  const twMap = new Map();

  const addToMap = (key, record, chargesLocal, chargesUSD) => {
    if (!key) return;
    if (twMap.has(key)) {
      // Accumulate charges for this key
      const existing = twMap.get(key);
      existing._totalLocal += chargesLocal;
      existing._totalUSD   += chargesUSD;
    } else {
      // First time seeing this IO — clone the record and add sentinel totals
      twMap.set(key, { ...record, _totalLocal: chargesLocal, _totalUSD: chargesUSD });
    }
  };

  twRecords.forEach(r => {
    const ioHeader   = String(r['IO Header']         ?? r['IO number']      ?? '').trim();
    const invoiceNum = String(r['Invoice #']          ?? r['Invoice Number'] ?? '').trim();
    const sfIOId     = String(r['Salesforce IO ID']   ?? '').trim();

    const chargesLocal = parseFloat(r['Total Charges (in Entered Curr)'] ?? r['Amount In Entered Currency'] ?? 0);
    const chargesUSD   = parseFloat(r['Total Charges (in USD)']          ?? r['Amount in Usd']              ?? 0);

    addToMap(ioHeader,   r, chargesLocal, chargesUSD);
    addToMap(invoiceNum, r, chargesLocal, chargesUSD);
    addToMap(sfIOId,     r, chargesLocal, chargesUSD);
  });

  sfRecords.forEach(sf => {
    // SF key extraction.
    // Twitter: PPO ID = "T2694837"
    // Criteo:  Publisher PO ID = "31764-February" → we strip the month suffix to get "31764"
    const rawPpoId = String(
      sf['PPO ID'] ?? sf['Publisher PO ID'] ?? sf['Publisher POID'] ?? sf['IO Number'] ?? ''
    ).trim();
    // Strip trailing "-Month" suffix for Criteo ("31764-February" → "31764")
    const ppoId = rawPpoId.replace(/-[A-Za-z]+$/, '');
    if (!ppoId) return;

    const tw = twMap.get(ppoId);

    // ── Amounts ─────────────────────────────────────────────────────────────
    const sfRevenue = parseFloat(
      sf['Qualified Sales Quantity'] ?? sf['Revenue'] ?? sf['Bill Net Budget'] ?? 0
    );

    // Use the aggregated totals — the map sums across all rows for this IO
    // (a single IO can appear as multiple lines: Promoted Ads, Takeover, Value Add, etc.)
    const twChargesLocal = tw ? tw._totalLocal : 0;
    const twChargesUSD   = tw ? tw._totalUSD   : 0;

    const twCurrency = String(tw?.['Entered Currency'] ?? tw?.['Account Curr'] ?? 'ARS').trim();
    const sfCurrency = String(sf['Bill Curr'] ?? sf['Billing Currency'] ?? sf['Account Curr'] ?? '').trim();

    const sfBudget  = sfRevenue;
    const twBilling = twChargesLocal;
    const diff      = sfBudget - twBilling;

    // ── Status & Classification ──────────────────────────────────────────────
    let status   = 'Matched';
    let comment  = '';
    let category = '';

    // Tolerance: ignore differences ≤ 1 unit of currency (floating-point rounding noise).
    // ARS 0.10 on a 4M IO → Matched. ARS 21.909 → Error. Simple and correct.
    const tolerance = 1.0;
    const absDiff   = Math.abs(diff);

    if (!tw) {
      status   = 'Error';
      category = ERROR_TYPES.DELIVERY;
      comment  = 'recon.ioNotFound';

    } else if (absDiff > tolerance) {
      status = 'Error';
      const ratio = sfBudget > 0 ? absDiff / sfBudget : 1;
      const near  = (val, target) => Math.abs(val - target) < 0.015;

      if      (near(ratio, 0.15))   category = ERROR_TYPES.COMMISSION; // 15% commission
      else if (near(ratio, 0.049))  category = ERROR_TYPES.TAX;        // 4.9% direct tax
      else if (near(ratio, 0.1575)) category = ERROR_TYPES.TAX;        // 15.75% with tax
      else if (ratio <= 0.06)       category = ERROR_TYPES.TAX;        // small diff = rounding
      else                          category = ERROR_TYPES.BUDGET;     // large diff = budget

      comment = 'recon.discrepancyMsg';
    }

    result.push({
      id:            Math.random().toString(36).substr(2, 9),
      io:            ppoId,
      invoiceNumber: tw ? String(tw['Invoice #'] ?? '').trim() : '',
      account:       sf['Company To Invoice Legal Name']
                     ?? sf['Account Name']
                     ?? tw?.['Sold To Advertiser']
                     ?? 'Unknown',
      manager:       sf['Project Owner'] ?? sf['Commercial Owner'] ?? sf['Responsible'] ?? 'Admin',
      billingEntity: sf['Billing Entity'] ?? '',
      country:       sf['Reporting Country'] ?? sf['Sold-To Country'] ?? '',
      region:        sf['Division'] ?? sf['Region'] ?? sf['Reporting Country'] ?? '',
      platform,
      currency:      sfCurrency || twCurrency,
      sfBudget,
      twBilling,
      twBillingUSD:  twChargesUSD,
      diff,
      status,
      category,
      comment,
      lastFollowUp:  null,
      commentParams: {
        diff: `${sfCurrency || twCurrency} ${Math.abs(diff).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      }
    });
  });

  return result;
};
