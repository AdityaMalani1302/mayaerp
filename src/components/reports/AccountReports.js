import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import DataTable from '../common/DataTable';
import { formatCurrency, formatDate } from '../../utils/helpers';

const reportTypes = [
  { key: 'cashbook', label: 'Cash Book' },
  { key: 'bankbook', label: 'Bank Book' },
  { key: 'ledger', label: 'Ledger' },
  { key: 'trialbalance', label: 'Trial Balance' },
  { key: 'daybook', label: 'Day Book' },
  { key: 'expenseSummary', label: 'Expense Summary' },
];

export default function AccountReports() {
  const { state } = useApp();
  const [report, setReport] = useState('cashbook');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedParty, setSelectedParty] = useState('');

  const filteredLedger = useMemo(() => {
    let entries = state.ledgerEntries;
    if (startDate) entries = entries.filter(e => e.date >= startDate);
    if (endDate) entries = entries.filter(e => e.date <= endDate);
    return entries;
  }, [state.ledgerEntries, startDate, endDate]);

  const renderReport = () => {
    switch (report) {
      case 'cashbook': {
        const cashAccountName = state.accounts.find(a => a.type === 'Cash')?.name || 'Cash';
        const cashEntries = filteredLedger.filter(e =>
          e.account === cashAccountName || e.type === 'Receipt' || e.type === 'Payment' || e.type === 'Expense' || e.type === 'Contra'
        );
        const sorted = [...cashEntries].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        let runningBalance = state.accounts.find(a => a.type === 'Cash')?.balance || 0;
        const data = sorted.map(e => {
          const inAmt = (e.type === 'Receipt' || e.type === 'Sales') && e.debit > 0 ? e.amount : (e.type === 'Contra' && (e.narration?.includes('to ' + cashAccountName) || e.narration?.includes(cashAccountName + ' to')) ? (e.narration?.startsWith(cashAccountName) ? 0 : e.amount) : 0);
          const outAmt = (e.type === 'Payment' || e.type === 'Expense') && e.debit > 0 ? e.amount : 0;
          const inVal = Number(inAmt) || 0;
          const outVal = Number(outAmt) || 0;
          runningBalance = runningBalance + inVal - outVal;
          return { ...e, cashIn: inVal, cashOut: outVal, balance: runningBalance };
        });
        return <DataTable columns={[
          { key: 'date', label: 'Date', render: (v) => formatDate(v) },
          { key: 'type', label: 'Type', render: (v) => <span className="badge badge-gray">{v}</span> },
          { key: 'refNo', label: 'Ref No' },
          { key: 'narration', label: 'Narration' },
          { key: 'cashIn', label: 'Cash In', align: 'right', render: (v) => v > 0 ? <span className="text-green-600">{formatCurrency(v)}</span> : '-' },
          { key: 'cashOut', label: 'Cash Out', align: 'right', render: (v) => v > 0 ? <span className="text-red-600">{formatCurrency(v)}</span> : '-' },
          { key: 'balance', label: 'Balance', align: 'right', render: (v) => formatCurrency(v) },
        ]} data={data} searchFields={['refNo', 'narration']} />;
      }

      case 'bankbook': {
        const bankAccounts = state.accounts.filter(a => a.type === 'Bank');
        const bankNames = bankAccounts.map(a => a.name);
        const bankEntries = filteredLedger.filter(e =>
          bankNames.includes(e.account) || (e.type === 'Contra' && bankNames.some(n => e.narration?.includes(n)))
        );
        const sorted = [...bankEntries].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        let runningBalance = bankAccounts.reduce((s, a) => s + (a.balance || 0), 0);
        const data = sorted.map(e => {
          const dbVal = Number(e.debit) || 0;
          const crVal = Number(e.credit) || 0;
          runningBalance = runningBalance + dbVal - crVal;
          return { ...e, balance: runningBalance };
        });
        return <DataTable columns={[
          { key: 'date', label: 'Date', render: (v) => formatDate(v) },
          { key: 'type', label: 'Type', render: (v) => <span className="badge badge-gray">{v}</span> },
          { key: 'refNo', label: 'Ref No' },
          { key: 'narration', label: 'Narration' },
          { key: 'debit', label: 'Debit', align: 'right', render: (v) => v > 0 ? formatCurrency(v) : '-' },
          { key: 'credit', label: 'Credit', align: 'right', render: (v) => v > 0 ? formatCurrency(v) : '-' },
          { key: 'balance', label: 'Balance', align: 'right', render: (v) => formatCurrency(v) },
        ]} data={data} searchFields={['refNo', 'narration']} />;
      }

      case 'ledger': {
        let entries = filteredLedger;
        if (selectedParty) entries = entries.filter(e => e.partyId === selectedParty);
        if (selectedAccount) entries = entries.filter(e => e.account === selectedAccount);
        return (
          <div>
            <div className="flex gap-4 mb-4">
              <div>
                <label className="label">Party</label>
                <select className="input" value={selectedParty} onChange={e => setSelectedParty(e.target.value)}>
                  <option value="">All Parties</option>
                  {state.parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Account</label>
                <select className="input" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
                  <option value="">All Accounts</option>
                  {state.accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
              </div>
            </div>
            <DataTable columns={[
              { key: 'date', label: 'Date', render: (v) => formatDate(v) },
              { key: 'type', label: 'Type', render: (v) => <span className="badge badge-gray">{v}</span> },
              { key: 'refNo', label: 'Ref No' },
              { key: 'account', label: 'Account' },
              { key: 'narration', label: 'Narration' },
              { key: 'debit', label: 'Debit', align: 'right', render: (v) => v > 0 ? formatCurrency(v) : '-' },
              { key: 'credit', label: 'Credit', align: 'right', render: (v) => v > 0 ? formatCurrency(v) : '-' },
            ]} data={entries} searchFields={['refNo', 'narration', 'account']} />
          </div>
        );
      }

      case 'trialbalance': {
        const trialData = state.accounts.map(acc => {
          const entries = filteredLedger.filter(e => e.account === acc.name);
          const totalDebit = entries.reduce((s, e) => s + (e.debit || 0), 0);
          const totalCredit = entries.reduce((s, e) => s + (e.credit || 0), 0);
          return {
            account: acc.name,
            type: acc.type,
            debit: totalDebit + (acc.type === 'Cash' || acc.type === 'Bank' ? acc.balance : 0),
            credit: totalCredit,
          };
        }).filter(a => a.debit > 0 || a.credit > 0);
        const totDr = trialData.reduce((s, a) => s + a.debit, 0);
        const totCr = trialData.reduce((s, a) => s + a.credit, 0);
        return (
          <div>
            <DataTable columns={[
              { key: 'account', label: 'Account', sortable: true },
              { key: 'type', label: 'Type' },
              { key: 'debit', label: 'Debit', align: 'right', render: (v) => v > 0 ? formatCurrency(v) : '-' },
              { key: 'credit', label: 'Credit', align: 'right', render: (v) => v > 0 ? formatCurrency(v) : '-' },
            ]} data={trialData} searchFields={['account']} />
            <div className="flex justify-end gap-8 mt-4 font-bold text-sm">
              <span>Total Debit: {formatCurrency(totDr)}</span>
              <span>Total Credit: {formatCurrency(totCr)}</span>
            </div>
          </div>
        );
      }

      case 'daybook': {
        const allTxns = [
          ...state.salesInvoices.map(i => ({ date: i.date, type: 'Sales', ref: i.invoiceNo, party: state.parties.find(p => p.id === i.partyId)?.name, debit: i.grandTotal, credit: 0 })),
          ...state.purchaseBills.map(b => ({ date: b.date, type: 'Purchase', ref: b.entryNo, party: state.parties.find(p => p.id === b.partyId)?.name, debit: 0, credit: b.grandTotal })),
          ...state.receipts.map(r => ({ date: r.date, type: 'Receipt', ref: r.receiptNo, party: state.parties.find(p => p.id === r.partyId)?.name, debit: r.amount, credit: 0 })),
          ...state.payments.map(p => ({ date: p.date, type: 'Payment', ref: p.paymentNo, party: state.parties.find(pr => pr.id === p.partyId)?.name, debit: 0, credit: p.amount })),
          ...state.expenses.map(e => ({ date: e.date, type: 'Expense', ref: e.expenseNo, party: e.expenseHead, debit: 0, credit: e.amount })),
        ].filter(t => {
          if (startDate && t.date < startDate) return false;
          if (endDate && t.date > endDate) return false;
          return true;
        }).sort((a, b) => (a.date || '').localeCompare(b.date || ''));

        return <DataTable columns={[
          { key: 'date', label: 'Date', render: (v) => formatDate(v) },
          { key: 'type', label: 'Type', render: (v) => <span className="badge badge-gray">{v}</span> },
          { key: 'ref', label: 'Ref No' },
          { key: 'party', label: 'Party/Head' },
          { key: 'debit', label: 'Debit', align: 'right', render: (v) => v > 0 ? formatCurrency(v) : '-' },
          { key: 'credit', label: 'Credit', align: 'right', render: (v) => v > 0 ? formatCurrency(v) : '-' },
        ]} data={allTxns} searchFields={['ref', 'party']} />;
      }

      case 'expenseSummary': {
        const map = {};
        const filtered = state.expenses.filter(e => {
          if (startDate && e.date < startDate) return false;
          if (endDate && e.date > endDate) return false;
          return true;
        });
        filtered.forEach(e => {
          if (!map[e.expenseHead]) map[e.expenseHead] = { head: e.expenseHead, count: 0, total: 0 };
          map[e.expenseHead].count++;
          map[e.expenseHead].total += e.amount;
        });
        return <DataTable columns={[
          { key: 'head', label: 'Expense Head', sortable: true },
          { key: 'count', label: 'Entries', align: 'right' },
          { key: 'total', label: 'Total', align: 'right', sortable: true, render: (v) => formatCurrency(v) },
        ]} data={Object.values(map).sort((a, b) => b.total - a.total)} searchFields={['head']} />;
      }

      default: return null;
    }
  };

  return (
    <div>
      <h1 className="page-title mb-6">Account Reports</h1>
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">Report Type</label>
            <select className="input" value={report} onChange={e => setReport(e.target.value)}>
              {reportTypes.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">From</label>
            <input className="input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="label">To</label>
            <input className="input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="card">{renderReport()}</div>
    </div>
  );
}
