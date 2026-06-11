import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import InvoiceForm from '../common/InvoiceForm';
import { Plus } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';

export default function SalesOrder() {
  const { state, dispatch } = useApp();
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);

  const handleSave = (data) => {
    dispatch({ type: 'ADD_SALES_ORDER', payload: data });
    addToast('Sales order created successfully', 'success');
    setShowForm(false);
  };

  const columns = [
    { key: 'orderNo', label: 'Order No', sortable: true },
    { key: 'date', label: 'Date', render: (v) => formatDate(v) },
    { key: 'partyId', label: 'Customer', render: (v) => state.parties.find(p => p.id === v)?.name || '-' },
    { key: 'grandTotal', label: 'Amount', align: 'right', render: (v) => formatCurrency(v) },
    { key: 'status', label: 'Status', render: (v) => (
      <span className={`badge ${v === 'Completed' ? 'badge-success' : v === 'Cancelled' ? 'badge-danger' : 'badge-warning'}`}>{v}</span>
    )},
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Sales Orders</h1>
        <button onClick={() => setShowForm(true)} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} /> New Order
        </button>
      </div>
      <div className="card">
        <DataTable columns={columns} data={[...state.salesOrders].reverse()} searchFields={['orderNo']} emptyState={{ title: 'No sales orders yet', description: 'Create your first sales order.', actionLabel: 'New Order', onAction: () => setShowForm(true) }} />
      </div>
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Sales Order" size="xl">
        <InvoiceForm type="salesOrder" onSave={handleSave} onCancel={() => setShowForm(false)} />
      </Modal>
    </div>
  );
}
