import { db } from './config';
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';

const APP_COLLECTION = 'appData';
const AUTH_COLLECTION = 'authData';

const ARRAY_KEYS = [
  'parties', 'items', 'accounts', 'taxes',
  'salesInvoices', 'salesReturns', 'deliveryChallans', 'salesOrders',
  'purchaseBills', 'purchaseReturns', 'purchaseOrders',
  'receipts', 'payments', 'journalEntries', 'expenses',
  'contraEntries', 'stockJournals', 'ledgerEntries',
];

export function isFirebaseConfigured() {
  return db !== null;
}

export async function loadAppData(defaults) {
  if (!db) return null;
  try {
    const companySnap = await getDoc(doc(db, APP_COLLECTION, 'company'));
    if (!companySnap.exists()) return null;

    const [countersSnap, ...arraySnaps] = await Promise.all([
      getDoc(doc(db, APP_COLLECTION, 'counters')),
      ...ARRAY_KEYS.map(key => getDoc(doc(db, APP_COLLECTION, key))),
    ]);

    const state = {
      company: { ...(defaults?.company || {}), ...companySnap.data() },
      counters: countersSnap.exists()
        ? { ...(defaults?.counters || {}), ...countersSnap.data() }
        : defaults?.counters || {},
    };

    ARRAY_KEYS.forEach((key, i) => {
      const snap = arraySnaps[i];
      state[key] = snap.exists() ? snap.data().data : (defaults?.[key] || []);
    });

    return state;
  } catch (e) {
    console.error('Firestore load failed:', e);
    return null;
  }
}

export async function saveAppData(state, prevState) {
  if (!db) return;
  try {
    const batch = writeBatch(db);
    let hasChanges = false;

    if (!prevState || prevState.company !== state.company) {
      batch.set(doc(db, APP_COLLECTION, 'company'), { ...state.company });
      hasChanges = true;
    }
    if (!prevState || prevState.counters !== state.counters) {
      batch.set(doc(db, APP_COLLECTION, 'counters'), { ...state.counters });
      hasChanges = true;
    }

    ARRAY_KEYS.forEach(key => {
      if (!prevState || prevState[key] !== state[key]) {
        batch.set(doc(db, APP_COLLECTION, key), { data: state[key] });
        hasChanges = true;
      }
    });

    if (hasChanges) await batch.commit();
  } catch (e) {
    console.error('Firestore save failed:', e);
  }
}

export async function clearAppData(defaultState) {
  if (!db) return;
  try {
    await saveAppData(defaultState, null);
  } catch (e) {
    console.error('Firestore clear failed:', e);
  }
}

export async function loadAuthData() {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, AUTH_COLLECTION, 'users'));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.error('Firestore auth load failed:', e);
    return null;
  }
}

export async function saveAuthData(users) {
  if (!db) return;
  try {
    await setDoc(doc(db, AUTH_COLLECTION, 'users'), { users });
  } catch (e) {
    console.error('Firestore auth save failed:', e);
  }
}
