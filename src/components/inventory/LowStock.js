import React from 'react';
import { useApp } from '../../context/AppContext';
import DataTable from '../common/DataTable';
import { AlertTriangle } from 'lucide-react';

export default function LowStock() {
  const { state } = useApp();
  const lowStockItems = state.items.filter(i => i.currentStock <= (i.reorderLevel || 0));

  const columns = [
    { key: 'name', label: 'Item', sortable: true },
    { key: 'category', label: 'Category' },
    { key: 'currentStock', label: 'Current Stock', align: 'right', render: (v, row) => (
      <span className="text-red-600 font-semibold">{v} {row.unit}</span>
    )},
    { key: 'reorderLevel', label: 'Reorder Level', align: 'right' },
    { key: 'deficit', label: 'Deficit', align: 'right', render: (_, row) => (
      <span className="text-red-600">{row.reorderLevel - row.currentStock}</span>
    )},
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <AlertTriangle className="text-amber-500" size={24} />
          Low Stock Alerts
        </h1>
        <span className="badge badge-danger text-sm">{lowStockItems.length} items</span>
      </div>
      <div className="card">
        {lowStockItems.length === 0 ? (
          <div className="text-center py-12 text-gray-400">All items are above reorder level</div>
        ) : (
          <DataTable columns={columns} data={lowStockItems} searchFields={['name', 'category']} />
        )}
      </div>
    </div>
  );
}
