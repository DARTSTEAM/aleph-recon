/**
 * aleph-recon/src/utils/reconciler.js
 *
 * Updated to work with real IMS Billing Files and Salesforce exports.
 *
 * Key insight from Aleph's process (meeting transcript 2026-03-31):
 * - The unifying ID is "IO Header" in IMS (format T2694837) = "PPO ID" in Salesforce
 * - IMS Billing File has 5 sheets; data lives in "Billing Report" (NOT sheet[0])
 * - "Billing Report" has metadata in Row 1; real headers are in Row 2
 * - SF export has metadata in Rows 1-4; real headers are in Row 5
 * - Invoice # (e.g. 10573677) is Aleph's internal # and matches PDF filenames
 * - Taxes for Argentina: Direct Tax 4.9%, With Tax 15.75%, Commission 15%
 */
import * as XLSX from 'xlsx';

export const ERROR_TYPES = {
  BUDGET:     'recon.category.budget',
  TAX:        'recon.category.taxes',
  COMMISSION: 'recon.category.commission',
  DELIVERY:   'recon.category.delivery',
  UNKNOWN:    'Unknown'
};

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

  if (fileType === 'sf') {
    const preferred = names.find(n =>
      n.toLowerCase() === 'sf' ||
      n.toLowerCase() === 'salesforce' ||
      n.toLowerCase().includes('salesforce')
    );
    return preferred || names[0];
  }

  // Auto-detect: prioritise Billing Report if it exists
  const billing = names.find(n =>
    n === 'Billing Report' || n.toLowerCase().includes('billing report')
  );
  return billing || names[0];
}

// ─── Header Row Detection ─────────────────────────────────────────────────────

const SF_SIGNALS = ['PPO ID', 'Division', 'Billing Country', 'Reporting Country', 'Company To Invoice Legal Name'];
const TW_SIGNALS = ['IO Header', 'Invoice #', 'Billing Party', 'Entered Currency', 'Total Charges (in USD)'];
const ALL_SIGNALS = [...SF_SIGNALS, ...TW_SIGNALS, 'Publisher POID', 'IO number', 'Account Name'];

/**
 * Scan the first 12 rows to find which one is the real header row.
 * The IMS Billing Report has "Period :FEB-26" in Row 1 and real headers in Row 2.
 * SF exports from Salesforce have ≥4 metadata rows before the real header.
 */
function findHeaderRowIndex(rows, fileType) {
  const signals = fileType === 'sf'      ? SF_SIGNALS
                : fileType === 'twitter' ? TW_SIGNALS
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
 * Returns { records, sheetName, headerIndex, fileType }
 *
 * Backwards-compatible: reconcileData() accepts both the old plain array
 * and this new object format.
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
        const records     = rowsToObjects(rawRows, headerIndex);

        resolve({ records, sheetName, headerIndex, fileType });
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
 * Cross-reference Salesforce data against the IMS Twitter Billing File.
 *
 * Primary key:   IO Header in IMS  (e.g. "T2694837")  =  PPO ID in SF
 * Secondary key: Invoice # in IMS  (e.g. "10573677")  =  Aleph internal #
 * Tertiary key:  Salesforce IO ID  (e.g. "320381104") =  Twitter's numeric ID
 *
 * Error categories use real Argentine rates:
 *   Commission 15% | Direct Tax 4.9% | With Tax 15.75%
 */
export const reconcileData = (sfData, twData) => {
  const sfRecords = Array.isArray(sfData) ? sfData : (sfData?.records ?? []);
  const twRecords = Array.isArray(twData) ? twData : (twData?.records ?? []);
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
    const ppoId = String(
      sf['PPO ID'] ?? sf['Publisher POID'] ?? sf['IO Number'] ?? ''
    ).trim();
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
