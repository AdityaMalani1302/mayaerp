import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import InvoiceForm from '../common/InvoiceForm';
import { Plus } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';

export default function PurchaseOrder() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);

  const handleSave = (data) => {
    dispatch({ type: 'ADD_PURCHASE_ORDER', payload: data });
    setShowForm(false);
  };

  const columns = [
    { key: 'orderNo', label: 'PO No', sortable: true },
    { key: 'date', label: 'Date', render: (v) => formatDate(v) },
    { key: 'partyId', label: 'Supplier', render: (v) => state.parties.find(p => p.id === v)?.name || '-' },
    { key: 'grandTotal', label: 'Amount', align: 'right', render: (v) => formatCurrency(v) },
    { key: 'status', label: 'Status', render: (v) => (
      <span className={`badge ${v === 'Completed' ? 'badge-success' : 'badge-warning'}`}>{v}</span>
    )},
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Purchase Orders</h1>
        <button onClick={() => setShowForm(true)} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} /> New PO
        </button>
      </div>
      <div className="card">
        <DataTable columns={columns} data={[...state.purchaseOrders].reverse()} searchFields={['orderNo']} />
      </div>
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Purchase Order" size="xl">
        <InvoiceForm type="purchase" onSave={handleSave} onCancel={() => setShowForm(false)} />
      </Modal>
    </div>
  );
}
