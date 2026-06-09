import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import DataTable from '../common/DataTable';
import { formatCurrency, formatDate, getAgeing } from '../../utils/helpers';

const reportTypes = [
  { key: 'register', label: 'Purchase Register' },
  { key: 'partywise', label: 'Party-wise Purchase' },
  { key: 'itemwise', label: 'Item-wise Purchase' },
  { key: 'gst', label: 'GST Purchase Register' },
  { key: 'payables', label: 'Outstanding Payables' },
  { key: 'returns', label: 'Purchase Return Register' },
];

export default function PurchaseReports() {
  const { state } = useApp();
  const [report, setReport] = useState('register');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filtered = useMemo(() => {
    let bills = state.purchaseBills;
    if (startDate) bills = bills.filter(b => b.date >= startDate);
    if (endDate) bills = bills.filter(b => b.date <= endDate);
    return bills;
  }, [state.purchaseBills, startDate, endDate]);

  const renderReport = () => {
    switch (report) {
      case 'register':
        return <DataTable columns={[
          { key: 'entryNo', label: 'Entry No', sortable: true },
          { key: 'billNo', label: 'Bill No' },
          { key: 'date', label: 'Date', render: (v) => formatDate(v) },
          { key: 'partyId', label: 'Supplier', render: (v) => state.parties.find(p => p.id === v)?.name },
          { key: 'taxable', label: 'Taxable', align: 'right', render: (v) => formatCurrency(v) },
          { key: 'totalTax', label: 'Tax', align: 'right', render: (v) => formatCurrency(v) },
          { key: 'grandTotal', label: 'Total', align: 'right', sortable: true, render: (v) => formatCurrency(v) },
          { key: 'status', label: 'Status', render: (v) => <span className={`badge ${v === 'Paid' ? 'badge-success' : 'badge-danger'}`}>{v}</span> },
        ]} data={filtered} searchFields={['entryNo', 'billNo']} />;

      case 'partywise': {
        const map = {};
        filtered.forEach(bill => {
          const name = state.parties.find(p => p.id === bill.partyId)?.name || 'Unknown';
          if (!map[name]) map[name] = { party: name, count: 0, total: 0 };
          map[name].count++;
          map[name].total += bill.grandTotal || 0;
        });
        return <DataTable columns={[
          { key: 'party', label: 'Supplier', sortable: true },
          { key: 'count', label: 'Bills', align: 'right' },
          { key: 'total', label: 'Total', align: 'right', sortable: true, render: (v) => formatCurrency(v) },
        ]} data={Object.values(map).sort((a, b) => b.total - a.total)} searchFields={['party']} />;
      }

      case 'itemwise': {
        const map = {};
        filtered.forEach(bill => {
          bill.items?.forEach(li => {
            const name = state.items.find(i => i.id === li.itemId)?.name || 'Unknown';
            if (!map[name]) map[name] = { item: name, qty: 0, total: 0 };
            map[name].qty += Number(li.qty) || 0;
            map[name].total += li.netAmount || 0;
          });
        });
        return <DataTable columns={[
          { key: 'item', label: 'Item', sortable: true },
          { key: 'qty', label: 'Qty', align: 'right' },
          { key: 'total', label: 'Total', align: 'right', sortable: true, render: (v) => formatCurrency(v) },
        ]} data={Object.values(map).sort((a, b) => b.total - a.total)} searchFields={['item']} />;
      }

      case 'gst':
        return <DataTable columns={[
          { key: 'entryNo', label: 'Entry No' },
          { key: 'date', label: 'Date', render: (v) => formatDate(v) },
          { key: 'partyId', label: 'Supplier', render: (v) => state.parties.find(p => p.id === v)?.name },
          { key: 'taxable', label: 'Taxable', align: 'right', render: (v) => formatCurrency(v) },
          { key: 'cgst', label: 'CGST', align: 'right', render: (v) => formatCurrency(v) },
          { key: 'sgst', label: 'SGST', align: 'right', render: (v) => formatCurrency(v) },
          { key: 'igst', label: 'IGST', align: 'right', render: (v) => formatCurrency(v) },
          { key: 'grandTotal', label: 'Total', align: 'right', render: (v) => formatCurrency(v) },
        ]} data={filtered} searchFields={['entryNo']} />;

      case 'payables': {
        const data = state.purchaseBills
          .filter(b => b.status !== 'Paid')
          .map(b => ({
            ...b,
            supplierName: state.parties.find(p => p.id === b.partyId)?.name,
            outstanding: (b.grandTotal || 0) - (b.paidAmount || 0),
            ageing: getAgeing(b.date),
          }));
        return <DataTable columns={[
          { key: 'entryNo', label: 'Bill No' },
          { key: 'date', label: 'Date', render: (v) => formatDate(v) },
          { key: 'supplierName', label: 'Supplier' },
          { key: 'grandTotal', label: 'Bill Amt', align: 'right', render: (v) => formatCurrency(v) },
          { key: 'paidAmount', label: 'Paid', align: 'right', render: (v) => formatCurrency(v || 0) },
          { key: 'outstanding', label: 'Outstanding', align: 'right', render: (v) => <span className="text-red-600 font-semibold">{formatCurrency(v)}</span> },
          { key: 'ageing', label: 'Ageing', render: (v) => <span className={`badge ${v === '0-30' ? 'badge-success' : v === '31-60' ? 'badge-warning' : 'badge-danger'}`}>{v} days</span> },
        ]} data={data} searchFields={['entryNo', 'supplierName']} />;
      }

      case 'returns':
        return <DataTable columns={[
          { key: 'returnNo', label: 'Return No' },
          { key: 'date', label: 'Date', render: (v) => formatDate(v) },
          { key: 'partyId', label: 'Supplier', render: (v) => state.parties.find(p => p.id === v)?.name },
          { key: 'grandTotal', label: 'Amount', align: 'right', render: (v) => formatCurrency(v) },
        ]} data={state.purchaseReturns} searchFields={['returnNo']} />;

      default: return null;
    }
  };

  return (
    <div>
      <h1 className="page-title mb-6">Purchase Reports</h1>
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
