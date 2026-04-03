import * as XLSX from 'xlsx';

/**
 * Normalizes input data from various sources into a unified structure
 */
export const processReconciliation = (sfData, twBilling, statement) => {
  const map = new Map();

  // 1. Load Salesforce as base
  sfData.forEach(row => {
    const id = row['Publisher POID'] || row['IO Number'];
    if (id) {
      map.set(id, {
        io: id,
        account: row['Account Name'] || 'Unknown Account',
        manager: row['Commercial Owner'] || 'Pending Assignment',
        sf_budget: parseFloat(row['Bill Net Budget'] || 0),
        tw_billing: 0,
        diff: 0,
        status: 'Pending',
        comment: ''
      });
    }
  });

  // 2. Cross-reference with Twitter Billing
  twBilling.forEach(row => {
    const id = row['IO number'] || row['Publisher POID'];
    if (id && map.has(id)) {
      const item = map.get(id);
      const spend = parseFloat(row['Spend'] || row['Delivery'] || 0);
      item.tw_billing = spend;
      item.diff = item.sf_budget - spend;
      
      if (Math.abs(item.diff) < 0.01) {
        item.status = 'Matched';
      } else {
        item.status = 'Error';
        item.comment = 'Discrepancy detected between SF and Twitter Billing';
      }
    }
  });

  return Array.from(map.values());
};

export const readExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      resolve(XLSX.utils.sheet_to_json(sheet));
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};
