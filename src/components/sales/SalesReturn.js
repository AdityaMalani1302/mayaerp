import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import InvoiceForm from '../common/InvoiceForm';
import { Plus } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';

export default function SalesReturn() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);

  const handleSave = (data) => {
    dispatch({ type: 'ADD_SALES_RETURN', payload: data });
    setShowForm(false);
  };

  const columns = [
    { key: 'returnNo', label: 'Return No', sortable: true },
    { key: 'date', label: 'Date', render: (v) => formatDate(v) },
    { key: 'partyId', label: 'Customer', render: (v) => state.parties.find(p => p.id === v)?.name || '-' },
    { key: 'againstInvoice', label: 'Against Invoice' },
    { key: 'grandTotal', label: 'Amount', align: 'right', render: (v) => formatCurrency(v) },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Sales Returns</h1>
        <button onClick={() => setShowForm(true)} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} /> New Return
        </button>
      </div>
      <div className="card">
        <DataTable columns={columns} data={[...state.salesReturns].reverse()} searchFields={['returnNo', 'againstInvoice']} />
      </div>
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Sales Return (Credit Note)" size="xl">
        <InvoiceForm type="salesReturn" onSave={handleSave} onCancel={() => setShowForm(false)} />
      </Modal>
    </div>
  );
}
