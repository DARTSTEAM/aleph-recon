import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDocs,
  writeBatch,
  addDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../firebase";

const RECON_COLLECTION   = "reconciliation_items";
const MANAGERS_COLLECTION = "managers";

// ─── Reconciliation Items ──────────────────────────────────────────────────────

/**
 * Subscribe to reconciliation items in real-time.
 * Returns an unsubscribe function.
 */
export const subscribeToItems = (callback) => {
  const q = query(
    collection(db, RECON_COLLECTION),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(items);
  });
};

/**
 * Batch-write a full reconciliation dataset to Firestore.
 * Called after file upload + reconciliation run.
 *
 * Uses MERGE semantics: existing comments, auditLog, and manual status
 * overrides are preserved. Financial fields (sfBudget, twBilling, diff,
 * category) are always overwritten with the latest run's values.
 */
export const saveReconciliationRun = async (items, runLabel = "Q1-2026") => {
  // Get all existing docs first so we can preserve human-annotated fields
  const existingSnap = await getDocs(collection(db, RECON_COLLECTION));
  const existing = {};
  existingSnap.forEach(d => { existing[d.id] = d.data(); });

  const batch = writeBatch(db);
  items.forEach((item) => {
    const ref  = doc(collection(db, RECON_COLLECTION), item.io);
    const prev = existing[item.io] || {};

    batch.set(ref, {
      // Always update financial / reconciliation data
      ...item,
      runLabel,
      updatedAt:  serverTimestamp(),
      // Preserve human-annotated fields from previous runs
      comments:   prev.comments  ?? [],
      auditLog:   prev.auditLog  ?? [],
      // Only keep a manual status override if it was set to 'Fixing' or 'Matched'
      // and the new run still sees a discrepancy (don't override Error→Matched)
      status:     (prev.status === 'Fixing' && item.status !== 'Matched') ? 'Fixing'
                : item.status,
      createdAt:  prev.createdAt ?? serverTimestamp(),
    });
  });
  await batch.commit();
};

/**
 * Update the status of a single item and log the follow-up in the audit log.
 */
export const updateItemStatus = async (io, status, manager, userEmail) => {
  const ref = doc(db, RECON_COLLECTION, io);
  const logEntry = {
    action: "follow_up_sent",
    actor: userEmail,
    manager,
    timestamp: new Date().toISOString(),
    note: `Follow-up sent to ${manager} by ${userEmail}`
  };
  await updateDoc(ref, {
    status,
    comment: `Follow-up sent to ${manager} by ${userEmail}`,
    followUpDate: serverTimestamp(),
    updatedAt: serverTimestamp(),
    auditLog: arrayUnion(logEntry)
  });
};

/**
 * Mark an item as resolved once SF has been corrected.
 */
export const resolveItem = async (io, userEmail = "system") => {
  const ref = doc(db, RECON_COLLECTION, io);
  const logEntry = {
    action: "resolved",
    actor: userEmail,
    timestamp: new Date().toISOString(),
    note: "Marked as Matched — discrepancy corrected in Salesforce"
  };
  await updateDoc(ref, {
    status: "Matched",
    resolvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    auditLog: arrayUnion(logEntry)
  });
};

// ─── IO Comments ──────────────────────────────────────────────────────────────

/**
 * Add a comment to an IO's comment thread.
 * comment: { text: string, author: string (email) }
 */
export const addComment = async (io, comment) => {
  const ref = doc(db, RECON_COLLECTION, io);
  const entry = {
    text: comment.text,
    author: comment.author,
    timestamp: new Date().toISOString()
  };
  const logEntry = {
    action: "comment_added",
    actor: comment.author,
    timestamp: new Date().toISOString(),
    note: comment.text.length > 60 ? comment.text.slice(0, 60) + "…" : comment.text
  };
  await updateDoc(ref, {
    comments: arrayUnion(entry),
    auditLog: arrayUnion(logEntry),
    updatedAt: serverTimestamp()
  });
};

// ─── Audit Log ────────────────────────────────────────────────────────────────

/**
 * Append an arbitrary entry to an IO's audit log.
 * entry: { action, actor, note }
 */
export const appendAuditEntry = async (io, entry) => {
  const ref = doc(db, RECON_COLLECTION, io);
  const logEntry = {
    ...entry,
    timestamp: new Date().toISOString()
  };
  await updateDoc(ref, {
    auditLog: arrayUnion(logEntry),
    updatedAt: serverTimestamp()
  });
};

// ─── Managers Directory ───────────────────────────────────────────────────────

/**
 * Subscribe to the managers directory in real-time.
 * Returns an unsubscribe function.
 */
export const subscribeToManagers = (callback) => {
  const q = query(
    collection(db, MANAGERS_COLLECTION),
    orderBy("name", "asc")
  );
  return onSnapshot(q, (snapshot) => {
    const managers = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    }));
    callback(managers);
  });
};

/**
 * Create or update a manager record.
 * manager: { id?, name, email, region }
 */
export const saveManager = async (manager) => {
  if (manager.id) {
    const ref = doc(db, MANAGERS_COLLECTION, manager.id);
    await updateDoc(ref, {
      name:      manager.name,
      email:     manager.email,
      region:    manager.region,
      updatedAt: serverTimestamp()
    });
    return manager.id;
  } else {
    const ref = doc(collection(db, MANAGERS_COLLECTION));
    await setDoc(ref, {
      name:      manager.name,
      email:     manager.email,
      region:    manager.region,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return ref.id;
  }
};

/**
 * Delete a manager from the directory.
 */
export const deleteManager = async (managerId) => {
  await deleteDoc(doc(db, MANAGERS_COLLECTION, managerId));
};
