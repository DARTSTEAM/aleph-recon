/**
 * Aleph Recon Studio — API Service
 * Calls the backend Cloud Run API for email sending and other operations.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'https://aleph-recon-api-4772ziyq2a-uc.a.run.app';
const API_KEY = import.meta.env.VITE_API_KEY || '';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(API_KEY ? { 'Authorization': `Bearer ${API_KEY}` } : {}),
});

/**
 * Send a follow-up email to a manager for a specific IO discrepancy.
 * Falls back gracefully if the API is unavailable.
 */
export async function sendFollowUpEmail(item, sentByEmail = 'admin@aleph.test') {
  const payload = {
    io: item.io,
    account: item.account,
    manager: item.manager,
    managerEmail: item.managerEmail || guessEmail(item.manager),
    sfBudget: item.sfBudget,
    twBilling: item.twBilling,
    diff: item.diff,
    category: item.category || 'Unknown',
    sentBy: sentByEmail,
  };

  try {
    const res = await fetch(`${API_BASE}/api/followup`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    return await res.json(); // { success: true, messageId, to }
  } catch (err) {
    console.warn('[api] sendFollowUpEmail failed, falling back to mailto:', err.message);
    // Graceful fallback — open mailto
    const subject = encodeURIComponent(`[Aleph Finance] Reconciliation Discrepancy - IO ${item.io}`);
    const body = encodeURIComponent(
      `Hi ${item.manager},\n\nWe identified a reconciliation discrepancy for IO ${item.io} (${item.account}).\n\nSF Net Budget: $${item.sfBudget?.toLocaleString()}\nTwitter Billing: $${item.twBilling?.toLocaleString()}\nDiscrepancy: -$${Math.abs(item.diff)?.toLocaleString()}\nCategory: ${item.category || 'Unknown'}\n\nPlease review and update Salesforce.\n\nRegards,\nAleph Finance Ops`
    );
    const to = item.managerEmail || guessEmail(item.manager);
    window.open(`mailto:${to}?subject=${subject}&body=${body}`);
    return { success: false, fallback: true };
  }
}

/**
 * Send bulk follow-up emails for all error items.
 */
export async function sendBulkFollowUpEmails(items, sentByEmail = 'admin@aleph.test') {
  const errorItems = items
    .filter(i => i.status === 'Error')
    .map(i => ({
      io: i.io,
      account: i.account,
      manager: i.manager,
      managerEmail: i.managerEmail || guessEmail(i.manager),
      sfBudget: i.sfBudget,
      twBilling: i.twBilling,
      diff: i.diff,
      category: i.category || 'Unknown',
    }));

  if (!errorItems.length) return { success: true, sent: 0, total: 0 };

  try {
    const res = await fetch(`${API_BASE}/api/bulk-notify`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ items: errorItems, sentBy: sentByEmail }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    return await res.json(); // { success, sent, failed, total }
  } catch (err) {
    console.warn('[api] sendBulkFollowUpEmails failed:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Check if the API is healthy and email is configured.
 */
export async function checkApiHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(5000) });
    return await res.json();
  } catch {
    return { status: 'unreachable', emailConfigured: false };
  }
}

/**
 * Heuristic: convert "Firstname Lastname" → firstname.lastname@alephholding.com
 */
function guessEmail(name = '') {
  const normalized = name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // remove accents
    .replace(/[^a-z\s.]/g, '')
    .trim()
    .replace(/\s+/g, '.');
  return `${normalized}@alephholding.com`;
}
