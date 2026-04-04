/**
 * aleph-recon/src/utils/reconciler.js
 */
import * as XLSX from 'xlsx';

export const ERROR_TYPES = {
  BUDGET: 'recon.category.budget',
  TAX: 'recon.category.taxes',
  COMMISSION: 'recon.category.commission',
  DELIVERY: 'recon.category.delivery',
  UNKNOWN: 'Unknown'
};

/**
 * Robust reconciliation of Salesforce and Twitter data
 */
export const reconcileData = (sfRecords, twRecords) => {
  const result = [];
  
  // Create a map for TW records indexed by IO
  const twMap = new Map();
  twRecords.forEach(r => {
    const io = r['IO number']?.toString().trim();
    if (io) twMap.set(io, r);
  });

  sfRecords.forEach(sf => {
    const io = sf['Publisher POID']?.toString().trim() || sf['IO Number']?.toString().trim();
    if (!io) return;

    const tw = twMap.get(io);
    const sfBudget = parseFloat(sf['Bill Net Budget'] || 0);
    const twSpend = tw ? parseFloat(tw['Spend'] || tw['Delivery'] || 0) : 0;
    const diff = sfBudget - twSpend;

    let status = 'Matched';
    let comment = '';
    let category = '';

    if (!tw) {
      status = 'Error';
      category = ERROR_TYPES.DELIVERY;
      comment = 'recon.ioNotFound';
    } else if (Math.abs(diff) > 0.05) {
      status = 'Error';
      // Basic heuristic to categorize error
      if (Math.abs(diff / sfBudget) > 0.1) {
        category = ERROR_TYPES.BUDGET;
      } else {
        category = ERROR_TYPES.TAX; // Small diffs often mean tax roundings
      }
      comment = 'recon.discrepancyMsg';
    }

    result.push({
      id: Math.random().toString(36).substr(2, 9),
      io,
      account: sf['Account Name'] || 'Not found',
      manager: sf['Commercial Owner'] || sf['Responsible'] || 'Admin',
      sfBudget,
      twBilling: twSpend,
      diff,
      status,
      category,
      comment,
      lastFollowUp: null,
      commentParams: { diff: `$${diff.toFixed(2)}` }
    });
  });

  return result;
};

export const readExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        resolve(XLSX.utils.sheet_to_json(sheet));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};
