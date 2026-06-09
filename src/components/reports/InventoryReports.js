import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import DataTable from '../common/DataTable';
import { formatCurrency, formatDate } from '../../utils/helpers';

const reportTypes = [
  { key: 'summary', label: 'Stock Summary' },
  { key: 'ledger', label: 'Stock Ledger' },
  { key: 'movement', label: 'Fast / Slow Moving Items' },
  { key: 'challans', label: 'Delivery Challan Register' },
];

export default function InventoryReports() {
  const { state } = useApp();
  const [report, setReport] = useState('summary');

  const movementData = useMemo(() => {
    const map = {};
    state.salesInvoices.forEach(inv => {
      inv.items?.forEach(li => {
        if (!map[li.itemId]) map[li.itemId] = { qty: 0 };
        map[li.itemId].qty += Number(li.qty) || 0;
      });
    });
    return state.items.map(item => ({
      name: item.name,
      category: item.category,
      totalSold: map[item.id]?.qty || 0,
      currentStock: item.currentStock,
      speed: (map[item.id]?.qty || 0) > 20 ? 'Fast' : (map[item.id]?.qty || 0) > 5 ? 'Medium' : 'Slow',
    })).sort((a, b) => b.totalSold - a.totalSold);
  }, [state.items, state.salesInvoices]);

  const renderReport = () => {
    switch (report) {
      case 'summary':
        return <DataTable columns={[
          { key: 'name', label: 'Item', sortable: true },
          { key: 'category', label: 'Category' },
          { key: 'currentStock', label: 'Stock', align: 'right', sortable: true, render: (v, r) => `${v} ${r.unit}` },
          { key: 'purchaseRate', label: 'Rate', align: 'right', render: (v) => formatCurrency(v) },
          { key: 'value', label: 'Value', align: 'right', sortable: true, render: (_, r) => formatCurrency(r.currentStock * r.purchaseRate) },
        ]} data={state.items} searchFields={['name', 'category']} />;

      case 'movement':
        return <DataTable columns={[
          { key: 'name', label: 'Item', sortable: true },
          { key: 'category', label: 'Category' },
          { key: 'totalSold', label: 'Total Sold', align: 'right', sortable: true },
          { key: 'currentStock', label: 'Stock', align: 'right' },
          { key: 'speed', label: 'Movement', render: (v) => (
            <span className={`badge ${v === 'Fast' ? 'badge-success' : v === 'Medium' ? 'badge-warning' : 'badge-danger'}`}>{v}</span>
          )},
        ]} data={movementData} searchFields={['name']} />;

      case 'challans':
        return <DataTable columns={[
          { key: 'challanNo', label: 'Challan No' },
          { key: 'date', label: 'Date', render: (v) => formatDate(v) },
          { key: 'partyId', label: 'Customer', render: (v) => state.parties.find(p => p.id === v)?.name },
          { key: 'vehicleNo', label: 'Vehicle' },
          { key: 'status', label: 'Status', render: (v) => <span className={`badge ${v === 'Converted' ? 'badge-success' : 'badge-warning'}`}>{v}</span> },
        ]} data={state.deliveryChallans} searchFields={['challanNo']} />;

      default: return null;
    }
  };

  return (
    <div>
      <h1 className="page-title mb-6">Inventory Reports</h1>
      <div className="card mb-6">
        <div>
          <label className="label">Report Type</label>
          <select className="input max-w-xs" value={report} onChange={e => setReport(e.target.value)}>
            {reportTypes.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </div>
      </div>
      <div className="card">{renderReport()}</div>
    </div>
  );
}
