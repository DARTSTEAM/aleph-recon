import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDocs,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase";

const RECON_COLLECTION = "reconciliation_items";

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
 */
export const saveReconciliationRun = async (items, runLabel = "Q1-2026") => {
  const batch = writeBatch(db);
  items.forEach((item) => {
    const ref = doc(collection(db, RECON_COLLECTION), item.io);
    batch.set(ref, {
      ...item,
      runLabel,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });
  await batch.commit();
};

/**
 * Update the status of a single item and log the follow-up.
 */
export const updateItemStatus = async (io, status, manager, userEmail) => {
  const ref = doc(db, RECON_COLLECTION, io);
  await updateDoc(ref, {
    status,
    comment: `Follow-up sent to ${manager} by ${userEmail}`,
    followUpDate: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

/**
 * Mark an item as resolved once SF has been corrected.
 */
export const resolveItem = async (io) => {
  const ref = doc(db, RECON_COLLECTION, io);
  await updateDoc(ref, {
    status: "Matched",
    resolvedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};
