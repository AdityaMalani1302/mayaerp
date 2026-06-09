import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDate, today } from '../../utils/helpers';

export default function StockLedger() {
  const { state } = useApp();
  const [selectedItem, setSelectedItem] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(today());

  const movements = useMemo(() => {
    if (!selectedItem) return [];
    const entries = [];

    state.salesInvoices.forEach(inv => {
      inv.items?.forEach(li => {
        if (li.itemId === selectedItem) {
          entries.push({ date: inv.date, type: 'Sale', ref: inv.invoiceNo, out: li.qty, in: 0, party: state.parties.find(p => p.id === inv.partyId)?.name });
        }
      });
    });

    state.purchaseBills.forEach(bill => {
      bill.items?.forEach(li => {
        if (li.itemId === selectedItem) {
          entries.push({ date: bill.date, type: 'Purchase', ref: bill.entryNo, in: li.qty, out: 0, party: state.parties.find(p => p.id === bill.partyId)?.name });
        }
      });
    });

    state.salesReturns.forEach(ret => {
      ret.items?.forEach(li => {
        if (li.itemId === selectedItem) {
          entries.push({ date: ret.date, type: 'Sales Return', ref: ret.returnNo, in: li.qty, out: 0, party: state.parties.find(p => p.id === ret.partyId)?.name });
        }
      });
    });

    state.purchaseReturns.forEach(ret => {
      ret.items?.forEach(li => {
        if (li.itemId === selectedItem) {
          entries.push({ date: ret.date, type: 'Purchase Return', ref: ret.returnNo, out: li.qty, in: 0, party: state.parties.find(p => p.id === ret.partyId)?.name });
        }
      });
    });

    state.deliveryChallans.forEach(ch => {
      ch.items?.forEach(li => {
        if (li.itemId === selectedItem) {
          entries.push({ date: ch.date, type: 'Challan', ref: ch.challanNo, out: li.qty, in: 0, party: state.parties.find(p => p.id === ch.partyId)?.name });
        }
      });
    });

    let filtered = entries.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    if (startDate) filtered = filtered.filter(e => e.date >= startDate);
    if (endDate) filtered = filtered.filter(e => e.date <= endDate);

    const item = state.items.find(i => i.id === selectedItem);
    let balance = item?.openingStock || 0;
    return filtered.map(e => {
      balance = balance + (e.in || 0) - (e.out || 0);
      return { ...e, balance };
    });
  }, [selectedItem, startDate, endDate, state]);

  const item = state.items.find(i => i.id === selectedItem);

  return (
    <div>
      <h1 className="page-title mb-6">Stock Ledger</h1>
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="min-w-[250px]">
            <label className="label">Select Item</label>
            <select className="input" value={selectedItem} onChange={e => setSelectedItem(e.target.value)}>
              <option value="">-- Select Item --</option>
              {state.items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">From Date</label>
            <input className="input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="label">To Date</label>
            <input className="input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>

      {selectedItem && (
        <div className="card">
          <div className="mb-4 text-sm">
            <span className="font-semibold">{item?.name}</span>
            <span className="text-gray-500 ml-3">Opening Stock: {item?.openingStock} {item?.unit}</span>
            <span className="text-gray-500 ml-3">Current Stock: {item?.currentStock} {item?.unit}</span>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Ref No</th>
                  <th>Party</th>
                  <th className="text-right">In</th>
                  <th className="text-right">Out</th>
                  <th className="text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-6 text-gray-400">No movements found</td></tr>
                ) : movements.map((m, i) => (
                  <tr key={i}>
                    <td>{formatDate(m.date)}</td>
                    <td><span className={`badge ${m.type.includes('Purchase') ? 'badge-info' : m.type.includes('Sale') ? 'badge-success' : 'badge-gray'}`}>{m.type}</span></td>
                    <td className="font-medium">{m.ref}</td>
                    <td>{m.party}</td>
                    <td className="text-right text-green-600">{m.in || '-'}</td>
                    <td className="text-right text-red-600">{m.out || '-'}</td>
                    <td className="text-right font-medium">{m.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
