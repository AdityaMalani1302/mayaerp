import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import DataTable from '../common/DataTable';
import { formatCurrency, formatDate, getAgeing } from '../../utils/helpers';

const reportTypes = [
  { key: 'register', label: 'Sales Register' },
  { key: 'partywise', label: 'Party-wise Sales' },
  { key: 'itemwise', label: 'Item-wise Sales' },
  { key: 'gst', label: 'GST Sales Register' },
  { key: 'receivables', label: 'Outstanding Receivables' },
  { key: 'returns', label: 'Sales Return Register' },
];

export default function SalesReports() {
  const { state } = useApp();
  const [report, setReport] = useState('register');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filtered = useMemo(() => {
    let inv = state.salesInvoices;
    if (startDate) inv = inv.filter(i => i.date >= startDate);
    if (endDate) inv = inv.filter(i => i.date <= endDate);
    return inv;
  }, [state.salesInvoices, startDate, endDate]);

  const registerCols = [
    { key: 'invoiceNo', label: 'Invoice No', sortable: true },
    { key: 'date', label: 'Date', render: (v) => formatDate(v) },
    { key: 'partyId', label: 'Customer', render: (v) => state.parties.find(p => p.id === v)?.name },
    { key: 'taxable', label: 'Taxable', align: 'right', render: (v) => formatCurrency(v) },
    { key: 'totalTax', label: 'Tax', align: 'right', render: (v) => formatCurrency(v) },
    { key: 'grandTotal', label: 'Total', align: 'right', sortable: true, render: (v) => formatCurrency(v) },
    { key: 'status', label: 'Status', render: (v) => <span className={`badge ${v === 'Paid' ? 'badge-success' : 'badge-danger'}`}>{v}</span> },
  ];

  const partywiseData = useMemo(() => {
    const map = {};
    filtered.forEach(inv => {
      const name = state.parties.find(p => p.id === inv.partyId)?.name || 'Unknown';
      if (!map[name]) map[name] = { party: name, count: 0, total: 0 };
      map[name].count++;
      map[name].total += inv.grandTotal || 0;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filtered, state.parties]);

  const itemwiseData = useMemo(() => {
    const map = {};
    filtered.forEach(inv => {
      inv.items?.forEach(li => {
        const name = state.items.find(i => i.id === li.itemId)?.name || 'Unknown';
        if (!map[name]) map[name] = { item: name, qty: 0, total: 0 };
        map[name].qty += Number(li.qty) || 0;
        map[name].total += li.netAmount || 0;
      });
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filtered, state.items]);

  const gstData = useMemo(() => filtered.map(inv => ({
    ...inv,
    customerName: state.parties.find(p => p.id === inv.partyId)?.name,
    customerGstin: state.parties.find(p => p.id === inv.partyId)?.gstin,
  })), [filtered, state.parties]);

  const receivablesData = useMemo(() => {
    return state.salesInvoices
      .filter(i => i.status !== 'Paid')
      .map(inv => ({
        ...inv,
        customerName: state.parties.find(p => p.id === inv.partyId)?.name,
        outstanding: (inv.grandTotal || 0) - (inv.paidAmount || 0),
        ageing: getAgeing(inv.date),
      }));
  }, [state.salesInvoices, state.parties]);

  const returnsCols = [
    { key: 'returnNo', label: 'Return No' },
    { key: 'date', label: 'Date', render: (v) => formatDate(v) },
    { key: 'partyId', label: 'Customer', render: (v) => state.parties.find(p => p.id === v)?.name },
    { key: 'againstInvoice', label: 'Against Invoice' },
    { key: 'grandTotal', label: 'Amount', align: 'right', render: (v) => formatCurrency(v) },
  ];

  const renderReport = () => {
    switch (report) {
      case 'register':
        return <DataTable columns={registerCols} data={filtered} searchFields={['invoiceNo']} />;
      case 'partywise':
        return <DataTable columns={[
          { key: 'party', label: 'Party', sortable: true },
          { key: 'count', label: 'Invoices', align: 'right' },
          { key: 'total', label: 'Total', align: 'right', sortable: true, render: (v) => formatCurrency(v) },
        ]} data={partywiseData} searchFields={['party']} />;
      case 'itemwise':
        return <DataTable columns={[
          { key: 'item', label: 'Item', sortable: true },
          { key: 'qty', label: 'Qty Sold', align: 'right', sortable: true },
          { key: 'total', label: 'Total', align: 'right', sortable: true, render: (v) => formatCurrency(v) },
        ]} data={itemwiseData} searchFields={['item']} />;
      case 'gst':
        return <DataTable columns={[
          { key: 'invoiceNo', label: 'Invoice No' },
          { key: 'date', label: 'Date', render: (v) => formatDate(v) },
          { key: 'customerName', label: 'Customer' },
          { key: 'customerGstin', label: 'GSTIN' },
          { key: 'taxable', label: 'Taxable', align: 'right', render: (v) => formatCurrency(v) },
          { key: 'cgst', label: 'CGST', align: 'right', render: (v) => formatCurrency(v) },
          { key: 'sgst', label: 'SGST', align: 'right', render: (v) => formatCurrency(v) },
          { key: 'igst', label: 'IGST', align: 'right', render: (v) => formatCurrency(v) },
          { key: 'grandTotal', label: 'Total', align: 'right', render: (v) => formatCurrency(v) },
        ]} data={gstData} searchFields={['invoiceNo', 'customerName']} />;
      case 'receivables':
        return <DataTable columns={[
          { key: 'invoiceNo', label: 'Invoice No' },
          { key: 'date', label: 'Date', render: (v) => formatDate(v) },
          { key: 'customerName', label: 'Customer' },
          { key: 'grandTotal', label: 'Invoice Amt', align: 'right', render: (v) => formatCurrency(v) },
          { key: 'paidAmount', label: 'Paid', align: 'right', render: (v) => formatCurrency(v || 0) },
          { key: 'outstanding', label: 'Outstanding', align: 'right', render: (v) => <span className="text-red-600 font-semibold">{formatCurrency(v)}</span> },
          { key: 'ageing', label: 'Ageing', render: (v) => (
            <span className={`badge ${v === '0-30' ? 'badge-success' : v === '31-60' ? 'badge-warning' : 'badge-danger'}`}>{v} days</span>
          )},
        ]} data={receivablesData} searchFields={['invoiceNo', 'customerName']} />;
      case 'returns':
        return <DataTable columns={returnsCols} data={state.salesReturns} searchFields={['returnNo']} />;
      default:
        return null;
    }
  };

  return (
    <div>
      <h1 className="page-title mb-6">Sales Reports</h1>
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
