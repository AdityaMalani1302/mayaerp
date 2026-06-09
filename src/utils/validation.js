// ─── Regex patterns ───
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HSN_REGEX = /^[0-9]{4,8}$/;
const VEHICLE_REGEX = /^[A-Z]{2}\s?[0-9]{1,2}\s?[A-Z]{0,3}\s?[0-9]{4}$/i;

// ─── Field-level validators ───
export const validators = {
  required: (value, label = 'This field') => {
    if (value === null || value === undefined) return `${label} is required`;
    if (typeof value === 'string' && !value.trim()) return `${label} is required`;
    if (typeof value === 'number' && isNaN(value)) return `${label} is required`;
    return '';
  },

  minLength: (value, min, label = 'This field') => {
    if (!value) return '';
    if (String(value).trim().length < min) return `${label} must be at least ${min} characters`;
    return '';
  },

  maxLength: (value, max, label = 'This field') => {
    if (!value) return '';
    if (String(value).trim().length > max) return `${label} must be at most ${max} characters`;
    return '';
  },

  gstin: (value) => {
    if (!value) return ''; // optional
    const v = value.toUpperCase().trim();
    if (v.length !== 15) return 'GSTIN must be exactly 15 characters';
    if (!GSTIN_REGEX.test(v)) return 'Invalid GSTIN format (e.g. 27AADCA1234B1Z5)';
    return '';
  },

  phone: (value) => {
    if (!value) return '';
    const v = value.replace(/[\s\-+()]/g, '');
    if (v.length < 10) return 'Phone must be at least 10 digits';
    if (v.length === 10 && !PHONE_REGEX.test(v)) return 'Invalid phone number';
    if (v.length > 13) return 'Phone number too long';
    return '';
  },

  email: (value) => {
    if (!value) return '';
    if (!EMAIL_REGEX.test(value.trim())) return 'Invalid email format';
    return '';
  },

  hsnCode: (value) => {
    if (!value) return '';
    if (!HSN_REGEX.test(value.trim())) return 'HSN must be 4-8 digits';
    return '';
  },

  vehicleNo: (value) => {
    if (!value) return '';
    if (!VEHICLE_REGEX.test(value.trim())) return 'Invalid vehicle no (e.g. MH12AB1234)';
    return '';
  },

  positiveNumber: (value, label = 'Value') => {
    const n = Number(value);
    if (isNaN(n)) return `${label} must be a number`;
    if (n < 0) return `${label} cannot be negative`;
    return '';
  },

  positiveNonZero: (value, label = 'Value') => {
    const n = Number(value);
    if (isNaN(n)) return `${label} must be a number`;
    if (n <= 0) return `${label} must be greater than zero`;
    return '';
  },

  maxValue: (value, max, label = 'Value') => {
    const n = Number(value);
    if (n > max) return `${label} cannot exceed ${max}`;
    return '';
  },

  minValue: (value, min, label = 'Value') => {
    const n = Number(value);
    if (n < min) return `${label} must be at least ${min}`;
    return '';
  },

  dateNotFuture: (value, label = 'Date') => {
    if (!value) return '';
    const today = new Date().toISOString().split('T')[0];
    if (value > today) return `${label} cannot be in the future`;
    return '';
  },

  dateAfter: (value, afterDate, label = 'Date', afterLabel = 'start date') => {
    if (!value || !afterDate) return '';
    if (value < afterDate) return `${label} cannot be before ${afterLabel}`;
    return '';
  },

  unique: (value, existingValues, label = 'Value', editingId = null) => {
    if (!value) return '';
    const trimmed = value.trim().toLowerCase();
    const exists = existingValues.some(
      item => item.value.toLowerCase() === trimmed && item.id !== editingId
    );
    if (exists) return `${label} already exists`;
    return '';
  },

  percentage: (value, label = 'Percentage') => {
    const n = Number(value);
    if (isNaN(n)) return `${label} must be a number`;
    if (n < 0) return `${label} cannot be negative`;
    if (n > 100) return `${label} cannot exceed 100%`;
    return '';
  },

  stockSufficient: (available, requested, itemName = 'Item') => {
    if (Number(requested) > Number(available)) {
      return `Insufficient stock for ${itemName}. Available: ${available}`;
    }
    return '';
  },

  balanceSufficient: (balance, amount, accountName = 'Account') => {
    if (Number(amount) > Number(balance)) {
      return `Insufficient balance in ${accountName}. Available: ${balance}`;
    }
    return '';
  },
};

// ─── Form-level validate helper ───
// Takes a rules object { fieldName: [errorMsg1, errorMsg2, ...] }
// Returns { errors: { fieldName: firstError }, isValid: boolean }
export function validateForm(rules) {
  const errors = {};
  let isValid = true;

  Object.entries(rules).forEach(([field, messages]) => {
    // messages is an array of validation results; first non-empty wins
    const msgs = Array.isArray(messages) ? messages : [messages];
    const firstError = msgs.find(m => m && m.length > 0);
    if (firstError) {
      errors[field] = firstError;
      isValid = false;
    }
  });

  return { errors, isValid };
}

// ─── Check if entity is referenced in transactions ───
export function isPartyReferenced(partyId, state) {
  const refs = [];
  if (state.salesInvoices.some(i => i.partyId === partyId)) refs.push('Sales Invoices');
  if (state.purchaseBills.some(b => b.partyId === partyId)) refs.push('Purchase Bills');
  if (state.receipts.some(r => r.partyId === partyId)) refs.push('Receipts');
  if (state.payments.some(p => p.partyId === partyId)) refs.push('Payments');
  if (state.salesReturns.some(r => r.partyId === partyId)) refs.push('Sales Returns');
  if (state.purchaseReturns.some(r => r.partyId === partyId)) refs.push('Purchase Returns');
  if (state.deliveryChallans.some(c => c.partyId === partyId)) refs.push('Delivery Challans');
  if (state.salesOrders.some(o => o.partyId === partyId)) refs.push('Sales Orders');
  return refs;
}

export function isItemReferenced(itemId, state) {
  const refs = [];
  if (state.salesInvoices.some(i => i.items?.some(li => li.itemId === itemId))) refs.push('Sales Invoices');
  if (state.purchaseBills.some(b => b.items?.some(li => li.itemId === itemId))) refs.push('Purchase Bills');
  if (state.salesReturns.some(r => r.items?.some(li => li.itemId === itemId))) refs.push('Sales Returns');
  if (state.purchaseReturns.some(r => r.items?.some(li => li.itemId === itemId))) refs.push('Purchase Returns');
  if (state.deliveryChallans.some(c => c.items?.some(li => li.itemId === itemId))) refs.push('Delivery Challans');
  if (state.stockJournals.some(j => j.itemId === itemId)) refs.push('Stock Journals');
  return refs;
}

export function isAccountReferenced(accountName, state) {
  const refs = [];
  if (state.journalEntries.some(j => j.lines?.some(l => l.account === accountName))) refs.push('Journal Entries');
  if (state.contraEntries.some(c => c.fromAccount === accountName || c.toAccount === accountName)) refs.push('Contra Entries');
  if (state.ledgerEntries.some(e => e.account === accountName)) refs.push('Ledger Entries');
  return refs;
}

export function isTaxReferenced(taxRate, state) {
  if (state.items.some(i => i.taxPercent === taxRate)) return ['Item Master'];
  return [];
}
