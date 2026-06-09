import React, { createContext, useContext, useReducer, useEffect, useRef, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { initialParties, initialItems, initialAccounts, initialTaxes, companyInfo } from '../utils/initialData';
import { today } from '../utils/helpers';
import { isSupabaseConfigured, loadAppData, saveAppData, clearAppData } from '../supabase/dbService';

const AppContext = createContext();

const STORAGE_KEY = 'erp_app_data';

const defaultState = {
  company: companyInfo,
  parties: initialParties,
  items: initialItems,
  accounts: initialAccounts,
  taxes: initialTaxes,
  salesInvoices: [],
  salesReturns: [],
  deliveryChallans: [],
  salesOrders: [],
  purchaseBills: [],
  purchaseReturns: [],
  purchaseOrders: [],
  receipts: [],
  payments: [],
  journalEntries: [],
  expenses: [],
  contraEntries: [],
  stockJournals: [],
  ledgerEntries: [],
  counters: {
    salesInvoice: 0,
    salesReturn: 0,
    deliveryChallan: 0,
    salesOrder: 0,
    purchaseBill: 0,
    purchaseReturn: 0,
    purchaseOrder: 0,
    receipt: 0,
    payment: 0,
    journal: 0,
    expense: 0,
    contra: 0,
    stockJournal: 0,
  },
};

function addLedgerEntry(state, entry) {
  return [...state.ledgerEntries, { id: uuidv4(), date: today(), ...entry }];
}

function updateAccountBalance(accounts, accountName, amount) {
  return accounts.map(acc =>
    acc.name === accountName ? { ...acc, balance: acc.balance + amount } : acc
  );
}

function updateItemStock(items, itemId, qtyChange) {
  return items.map(item =>
    item.id === itemId ? { ...item, currentStock: item.currentStock + qtyChange } : item
  );
}

function reducer(state, action) {
  const { type, payload } = action;
  switch (type) {
    case 'LOAD_STATE':
      return {
        ...defaultState,
        ...payload,
        company: { ...companyInfo, ...(payload.company || {}) },
        counters: { ...defaultState.counters, ...(payload.counters || {}) },
      };

    case 'RESET_DATA':
      return defaultState;

    case 'UPDATE_COMPANY':
      return { ...state, company: { ...state.company, ...payload } };

    case 'ADD_PARTY':
      return { ...state, parties: [...state.parties, { id: uuidv4(), ...payload }] };
    case 'UPDATE_PARTY':
      return { ...state, parties: state.parties.map(p => p.id === payload.id ? payload : p) };
    case 'DELETE_PARTY':
      return { ...state, parties: state.parties.filter(p => p.id !== payload) };

    case 'ADD_ITEM':
      return { ...state, items: [...state.items, { id: uuidv4(), currentStock: payload.openingStock || 0, ...payload }] };
    case 'UPDATE_ITEM':
      return { ...state, items: state.items.map(i => i.id === payload.id ? payload : i) };
    case 'DELETE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== payload) };

    case 'ADD_ACCOUNT':
      return { ...state, accounts: [...state.accounts, { id: uuidv4(), balance: 0, ...payload }] };
    case 'UPDATE_ACCOUNT':
      return { ...state, accounts: state.accounts.map(a => a.id === payload.id ? payload : a) };
    case 'DELETE_ACCOUNT':
      return { ...state, accounts: state.accounts.filter(a => a.id !== payload) };

    case 'ADD_TAX':
      return { ...state, taxes: [...state.taxes, { id: uuidv4(), ...payload }] };
    case 'UPDATE_TAX':
      return { ...state, taxes: state.taxes.map(t => t.id === payload.id ? payload : t) };
    case 'DELETE_TAX':
      return { ...state, taxes: state.taxes.filter(t => t.id !== payload) };

    case 'ADD_SALES_INVOICE': {
      const counter = state.counters.salesInvoice + 1;
      const invoice = { id: uuidv4(), invoiceNo: `INV-${String(counter).padStart(4, '0')}`, status: 'Unpaid', ...payload };
      let items = [...state.items];
      invoice.items.forEach(li => {
        items = updateItemStock(items, li.itemId, -(Number(li.qty) || 0));
      });
      let accounts = [...state.accounts];
      const cashBank = payload.paymentMode === 'Cash' ? 'Cash' : payload.paymentMode === 'Bank' ? 'HDFC Bank - Current' : null;
      if (cashBank) {
        accounts = updateAccountBalance(accounts, cashBank, invoice.grandTotal);
        invoice.status = 'Paid';
      }
      let ledger = addLedgerEntry(state, {
        type: 'Sales',
        refNo: invoice.invoiceNo,
        partyId: invoice.partyId,
        debit: invoice.paymentMode === 'Credit' ? invoice.grandTotal : 0,
        credit: 0,
        account: 'Sales',
        amount: invoice.grandTotal,
        narration: `Sales Invoice ${invoice.invoiceNo}`,
      });
      return {
        ...state,
        items,
        accounts,
        salesInvoices: [...state.salesInvoices, invoice],
        ledgerEntries: ledger,
        counters: { ...state.counters, salesInvoice: counter },
      };
    }

    case 'UPDATE_SALES_INVOICE':
      return { ...state, salesInvoices: state.salesInvoices.map(i => i.id === payload.id ? { ...i, ...payload } : i) };

    case 'ADD_SALES_RETURN': {
      const counter = state.counters.salesReturn + 1;
      const ret = { id: uuidv4(), returnNo: `SR-${String(counter).padStart(4, '0')}`, ...payload };
      let items = [...state.items];
      ret.items.forEach(li => {
        items = updateItemStock(items, li.itemId, Number(li.qty) || 0);
      });
      let ledger = addLedgerEntry(state, {
        type: 'Sales Return',
        refNo: ret.returnNo,
        partyId: ret.partyId,
        debit: 0,
        credit: ret.grandTotal,
        account: 'Sales Return',
        amount: ret.grandTotal,
        narration: `Sales Return ${ret.returnNo} against ${ret.againstInvoice}`,
      });
      return {
        ...state,
        items,
        salesReturns: [...state.salesReturns, ret],
        ledgerEntries: ledger,
        counters: { ...state.counters, salesReturn: counter },
      };
    }

    case 'ADD_DELIVERY_CHALLAN': {
      const counter = state.counters.deliveryChallan + 1;
      const challan = { id: uuidv4(), challanNo: `DC-${String(counter).padStart(4, '0')}`, status: 'Pending', ...payload };
      let items = [...state.items];
      challan.items.forEach(li => {
        items = updateItemStock(items, li.itemId, -(Number(li.qty) || 0));
      });
      return {
        ...state,
        items,
        deliveryChallans: [...state.deliveryChallans, challan],
        counters: { ...state.counters, deliveryChallan: counter },
      };
    }

    case 'CONVERT_CHALLAN_TO_INVOICE': {
      const challan = state.deliveryChallans.find(c => c.id === payload);
      if (!challan) return state;
      const counter = state.counters.salesInvoice + 1;
      const invoice = {
        id: uuidv4(),
        invoiceNo: `INV-${String(counter).padStart(4, '0')}`,
        date: today(),
        partyId: challan.partyId,
        items: challan.items,
        paymentMode: 'Credit',
        status: 'Unpaid',
        narration: `Converted from ${challan.challanNo}`,
        ...challan.summary,
        fromChallan: challan.challanNo,
      };
      let ledger = addLedgerEntry(state, {
        type: 'Sales',
        refNo: invoice.invoiceNo,
        partyId: invoice.partyId,
        debit: invoice.grandTotal,
        credit: 0,
        account: 'Sales',
        amount: invoice.grandTotal,
        narration: `Sales Invoice ${invoice.invoiceNo} from ${challan.challanNo}`,
      });
      return {
        ...state,
        salesInvoices: [...state.salesInvoices, invoice],
        deliveryChallans: state.deliveryChallans.map(c => c.id === payload ? { ...c, status: 'Converted', convertedTo: invoice.invoiceNo } : c),
        ledgerEntries: ledger,
        counters: { ...state.counters, salesInvoice: counter },
      };
    }

    case 'ADD_SALES_ORDER': {
      const counter = state.counters.salesOrder + 1;
      return {
        ...state,
        salesOrders: [...state.salesOrders, { id: uuidv4(), orderNo: `SO-${String(counter).padStart(4, '0')}`, status: 'Pending', ...payload }],
        counters: { ...state.counters, salesOrder: counter },
      };
    }
    case 'UPDATE_SALES_ORDER':
      return { ...state, salesOrders: state.salesOrders.map(o => o.id === payload.id ? { ...o, ...payload } : o) };

    case 'ADD_PURCHASE_BILL': {
      const counter = state.counters.purchaseBill + 1;
      const bill = { id: uuidv4(), entryNo: `PB-${String(counter).padStart(4, '0')}`, status: 'Unpaid', ...payload };
      let items = [...state.items];
      bill.items.forEach(li => {
        items = updateItemStock(items, li.itemId, Number(li.qty) || 0);
      });
      let accounts = [...state.accounts];
      const cashBank = payload.paymentMode === 'Cash' ? 'Cash' : payload.paymentMode === 'Bank' ? 'HDFC Bank - Current' : null;
      if (cashBank) {
        accounts = updateAccountBalance(accounts, cashBank, -bill.grandTotal);
        bill.status = 'Paid';
      }
      let ledger = addLedgerEntry(state, {
        type: 'Purchase',
        refNo: bill.entryNo,
        partyId: bill.partyId,
        debit: 0,
        credit: bill.paymentMode === 'Credit' ? bill.grandTotal : 0,
        account: 'Purchase',
        amount: bill.grandTotal,
        narration: `Purchase Bill ${bill.entryNo}`,
      });
      return {
        ...state,
        items,
        accounts,
        purchaseBills: [...state.purchaseBills, bill],
        ledgerEntries: ledger,
        counters: { ...state.counters, purchaseBill: counter },
      };
    }

    case 'ADD_PURCHASE_RETURN': {
      const counter = state.counters.purchaseReturn + 1;
      const ret = { id: uuidv4(), returnNo: `PR-${String(counter).padStart(4, '0')}`, ...payload };
      let items = [...state.items];
      ret.items.forEach(li => {
        items = updateItemStock(items, li.itemId, -(Number(li.qty) || 0));
      });
      let ledger = addLedgerEntry(state, {
        type: 'Purchase Return',
        refNo: ret.returnNo,
        partyId: ret.partyId,
        debit: ret.grandTotal,
        credit: 0,
        account: 'Purchase Return',
        amount: ret.grandTotal,
        narration: `Purchase Return ${ret.returnNo}`,
      });
      return {
        ...state,
        items,
        purchaseReturns: [...state.purchaseReturns, ret],
        ledgerEntries: ledger,
        counters: { ...state.counters, purchaseReturn: counter },
      };
    }

    case 'ADD_PURCHASE_ORDER': {
      const counter = state.counters.purchaseOrder + 1;
      return {
        ...state,
        purchaseOrders: [...state.purchaseOrders, { id: uuidv4(), orderNo: `PO-${String(counter).padStart(4, '0')}`, status: 'Pending', ...payload }],
        counters: { ...state.counters, purchaseOrder: counter },
      };
    }

    case 'ADD_RECEIPT': {
      const counter = state.counters.receipt + 1;
      const receipt = { id: uuidv4(), receiptNo: `RCT-${String(counter).padStart(4, '0')}`, ...payload };
      let accounts = updateAccountBalance(state.accounts, payload.mode === 'Cash' ? 'Cash' : 'HDFC Bank - Current', receipt.amount);
      let invoices = state.salesInvoices;
      if (receipt.againstInvoice) {
        invoices = invoices.map(inv => {
          if (inv.invoiceNo === receipt.againstInvoice) {
            const paid = (inv.paidAmount || 0) + receipt.amount;
            const status = paid >= inv.grandTotal ? 'Paid' : 'Partial';
            return { ...inv, paidAmount: paid, status };
          }
          return inv;
        });
      }
      let ledger = addLedgerEntry(state, {
        type: 'Receipt',
        refNo: receipt.receiptNo,
        partyId: receipt.partyId,
        debit: 0,
        credit: receipt.amount,
        account: payload.mode === 'Cash' ? 'Cash' : 'HDFC Bank - Current',
        amount: receipt.amount,
        narration: receipt.narration || `Receipt ${receipt.receiptNo}`,
      });
      return {
        ...state,
        accounts,
        salesInvoices: invoices,
        receipts: [...state.receipts, receipt],
        ledgerEntries: ledger,
        counters: { ...state.counters, receipt: counter },
      };
    }

    case 'ADD_PAYMENT': {
      const counter = state.counters.payment + 1;
      const payment = { id: uuidv4(), paymentNo: `PAY-${String(counter).padStart(4, '0')}`, ...payload };
      let accounts = updateAccountBalance(state.accounts, payload.mode === 'Cash' ? 'Cash' : 'HDFC Bank - Current', -payment.amount);
      let bills = state.purchaseBills;
      if (payment.againstBill) {
        bills = bills.map(bill => {
          if (bill.entryNo === payment.againstBill) {
            const paid = (bill.paidAmount || 0) + payment.amount;
            const status = paid >= bill.grandTotal ? 'Paid' : 'Partial';
            return { ...bill, paidAmount: paid, status };
          }
          return bill;
        });
      }
      let ledger = addLedgerEntry(state, {
        type: 'Payment',
        refNo: payment.paymentNo,
        partyId: payment.partyId,
        debit: payment.amount,
        credit: 0,
        account: payload.mode === 'Cash' ? 'Cash' : 'HDFC Bank - Current',
        amount: payment.amount,
        narration: payment.narration || `Payment ${payment.paymentNo}`,
      });
      return {
        ...state,
        accounts,
        purchaseBills: bills,
        payments: [...state.payments, payment],
        ledgerEntries: ledger,
        counters: { ...state.counters, payment: counter },
      };
    }

    case 'ADD_JOURNAL_ENTRY': {
      const counter = state.counters.journal + 1;
      const entry = { id: uuidv4(), entryNo: `JV-${String(counter).padStart(4, '0')}`, ...payload };
      return {
        ...state,
        journalEntries: [...state.journalEntries, entry],
        ledgerEntries: [...state.ledgerEntries, ...entry.lines.map(line => ({
          id: uuidv4(),
          date: entry.date,
          type: 'Journal',
          refNo: entry.entryNo,
          account: line.account,
          debit: line.debit || 0,
          credit: line.credit || 0,
          amount: line.debit || line.credit || 0,
          narration: entry.narration,
        }))],
        counters: { ...state.counters, journal: counter },
      };
    }

    case 'ADD_EXPENSE': {
      const counter = state.counters.expense + 1;
      const expense = { id: uuidv4(), expenseNo: `EXP-${String(counter).padStart(4, '0')}`, ...payload };
      let accounts = updateAccountBalance(state.accounts, expense.paidFrom === 'Cash' ? 'Cash' : 'HDFC Bank - Current', -expense.amount);
      let ledger = addLedgerEntry(state, {
        type: 'Expense',
        refNo: expense.expenseNo,
        account: expense.expenseHead,
        debit: expense.amount,
        credit: 0,
        amount: expense.amount,
        narration: expense.narration || `${expense.expenseHead} expense`,
      });
      return {
        ...state,
        accounts,
        expenses: [...state.expenses, expense],
        ledgerEntries: ledger,
        counters: { ...state.counters, expense: counter },
      };
    }

    case 'ADD_CONTRA_ENTRY': {
      const counter = state.counters.contra + 1;
      const entry = { id: uuidv4(), contraNo: `CTR-${String(counter).padStart(4, '0')}`, ...payload };
      let accounts = [...state.accounts];
      accounts = updateAccountBalance(accounts, entry.fromAccount, -entry.amount);
      accounts = updateAccountBalance(accounts, entry.toAccount, entry.amount);
      let ledger = addLedgerEntry(state, {
        type: 'Contra',
        refNo: entry.contraNo,
        account: `${entry.fromAccount} -> ${entry.toAccount}`,
        debit: entry.amount,
        credit: entry.amount,
        amount: entry.amount,
        narration: entry.narration || `Transfer ${entry.fromAccount} to ${entry.toAccount}`,
      });
      return {
        ...state,
        accounts,
        contraEntries: [...state.contraEntries, entry],
        ledgerEntries: ledger,
        counters: { ...state.counters, contra: counter },
      };
    }

    case 'ADD_STOCK_JOURNAL': {
      const counter = state.counters.stockJournal + 1;
      const entry = { id: uuidv4(), journalNo: `SJ-${String(counter).padStart(4, '0')}`, ...payload };
      return {
        ...state,
        stockJournals: [...state.stockJournals, entry],
        counters: { ...state.counters, stockJournal: counter },
      };
    }

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, defaultState);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const prevStateRef = useRef(null);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    async function init() {
      let loadedState = null;

      if (isSupabaseConfigured()) {
        loadedState = await loadAppData(defaultState);
        if (!loadedState) {
          await saveAppData(defaultState, null);
        }
      } else {
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) loadedState = JSON.parse(saved);
        } catch (e) {
          console.error('Failed to load from localStorage:', e);
        }
      }

      if (loadedState) {
        dispatch({ type: 'LOAD_STATE', payload: loadedState });
      }

      setLoading(false);
      setInitialized(true);
    }
    init();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      if (isSupabaseConfigured()) {
        saveAppData(state, prevStateRef.current);
      } else {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
          console.error('Failed to save to localStorage:', e);
        }
      }
      prevStateRef.current = state;
    }, isSupabaseConfigured() ? 500 : 0);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state, initialized]);

  const resetData = useCallback(async () => {
    dispatch({ type: 'RESET_DATA' });
    if (isSupabaseConfigured()) {
      await clearAppData(defaultState);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, loading, resetData }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
