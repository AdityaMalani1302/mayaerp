import { supabase } from './config';

const ARRAY_KEYS = [
  'parties', 'items', 'accounts', 'taxes',
  'salesInvoices', 'salesReturns', 'deliveryChallans', 'salesOrders',
  'purchaseBills', 'purchaseReturns', 'purchaseOrders',
  'receipts', 'payments', 'journalEntries', 'expenses',
  'contraEntries', 'stockJournals', 'ledgerEntries',
];

async function upsertRow(key, value) {
  const { error } = await supabase
    .from('erp_data')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) throw error;
}

async function getRow(key) {
  const { data, error } = await supabase
    .from('erp_data')
    .select('value')
    .eq('key', key)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data?.value ?? null;
}

export function isSupabaseConfigured() {
  return true;
}

export async function loadAppData(defaults) {
  try {
    const { data: rows, error } = await supabase
      .from('erp_data')
      .select('key, value')
      .like('key', 'app_%');

    if (error) throw error;
    if (!rows || rows.length === 0) return null;

    const map = {};
    rows.forEach(r => { map[r.key] = r.value; });

    if (!map['app_company']) return null;

    const state = {
      company: { ...(defaults?.company || {}), ...map['app_company'] },
      counters: map['app_counters']
        ? { ...(defaults?.counters || {}), ...map['app_counters'] }
        : defaults?.counters || {},
    };

    ARRAY_KEYS.forEach(key => {
      state[key] = map[`app_${key}`] || defaults?.[key] || [];
    });

    return state;
  } catch (e) {
    console.error('Supabase load failed:', e);
    return null;
  }
}

export async function saveAppData(state, prevState) {
  try {
    const rows = [];

    if (!prevState || prevState.company !== state.company) {
      rows.push({ key: 'app_company', value: state.company, updated_at: new Date().toISOString() });
    }
    if (!prevState || prevState.counters !== state.counters) {
      rows.push({ key: 'app_counters', value: state.counters, updated_at: new Date().toISOString() });
    }

    ARRAY_KEYS.forEach(key => {
      if (!prevState || prevState[key] !== state[key]) {
        rows.push({ key: `app_${key}`, value: state[key], updated_at: new Date().toISOString() });
      }
    });

    if (rows.length > 0) {
      const { error } = await supabase
        .from('erp_data')
        .upsert(rows, { onConflict: 'key' });
      if (error) throw error;
    }
  } catch (e) {
    console.error('Supabase save failed:', e);
  }
}

export async function clearAppData(defaultState) {
  try {
    await saveAppData(defaultState, null);
  } catch (e) {
    console.error('Supabase clear failed:', e);
  }
}

export async function loadAuthData() {
  try {
    const value = await getRow('auth_users');
    return value ? { users: value } : null;
  } catch (e) {
    console.error('Supabase auth load failed:', e);
    return null;
  }
}

export async function saveAuthData(users) {
  try {
    await upsertRow('auth_users', users);
  } catch (e) {
    console.error('Supabase auth save failed:', e);
  }
}
