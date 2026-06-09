import React from 'react';
import { useApp } from '../../context/AppContext';
import DataTable from '../common/DataTable';
import { formatCurrency } from '../../utils/helpers';

export default function StockSummary() {
  const { state } = useApp();

  const stockData = state.items.map(item => ({
    ...item,
    stockValue: item.currentStock * item.purchaseRate,
  }));

  const totalValue = stockData.reduce((s, i) => s + i.stockValue, 0);

  const columns = [
    { key: 'name', label: 'Item', sortable: true },
    { key: 'category', label: 'Category', render: (v) => <span className="badge badge-gray">{v}</span> },
    { key: 'currentStock', label: 'Qty', align: 'right', sortable: true, render: (v, row) => (
      <span className={v <= (row.reorderLevel || 0) ? 'text-red-600 font-semibold' : ''}>{v} {row.unit}</span>
    )},
    { key: 'purchaseRate', label: 'Rate', align: 'right', render: (v) => formatCurrency(v) },
    { key: 'stockValue', label: 'Value', align: 'right', sortable: true, render: (v) => formatCurrency(v) },
    { key: 'reorderLevel', label: 'Reorder Lvl', align: 'right' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Stock Summary</h1>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Stock Value</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
        </div>
      </div>
      <div className="card">
        <DataTable columns={columns} data={stockData} searchFields={['name', 'category']} />
      </div>
    </div>
  );
}
