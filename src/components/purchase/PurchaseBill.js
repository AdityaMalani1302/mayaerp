import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import InvoiceForm from '../common/InvoiceForm';
import PrintPreview from '../common/PrintPreview';
import { Plus, Printer } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';

export default function PurchaseBill() {
  const { state, dispatch } = useApp();
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [printData, setPrintData] = useState(null);

  const handleSave = (data) => {
    dispatch({ type: 'ADD_PURCHASE_BILL', payload: data });
    addToast('Purchase bill created successfully', 'success');
    setShowForm(false);
  };

  const columns = [
    { key: 'entryNo', label: 'Entry No', sortable: true },
    { key: 'billNo', label: 'Bill No' },
    { key: 'date', label: 'Date', sortable: true, render: (v) => formatDate(v) },
    { key: 'partyId', label: 'Supplier', render: (v) => state.parties.find(p => p.id === v)?.name || '-' },
    { key: 'grandTotal', label: 'Amount', align: 'right', sortable: true, render: (v) => formatCurrency(v) },
    { key: 'paymentMode', label: 'Payment', render: (v) => <span className="badge badge-gray">{v}</span> },
    { key: 'status', label: 'Status', render: (v) => (
      <span className={`badge ${v === 'Paid' ? 'badge-success' : v === 'Partial' ? 'badge-warning' : 'badge-danger'}`}>{v}</span>
    )},
  ];

  if (printData) {
    return <PrintPreview type="purchaseBill" data={printData} onClose={() => setPrintData(null)} />;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Purchase Bills</h1>
        <button onClick={() => setShowForm(true)} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} /> New Bill
        </button>
      </div>
      <div className="card">
        <DataTable
          columns={columns}
          data={[...state.purchaseBills].reverse()}
          searchFields={['entryNo', 'billNo', (r) => state.parties.find(p => p.id === r.partyId)?.name]}
          emptyState={{ title: 'No purchase bills yet', description: 'Create your first purchase bill.', actionLabel: 'New Bill', onAction: () => setShowForm(true) }}
          actions={(row) => (
            <>
              <button onClick={() => setPrintData(row)} className="p-1.5 rounded hover:bg-green-50 text-green-600"><Printer size={15} /></button>
            </>
          )}
        />
      </div>
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Purchase Bill" size="xl">
        <InvoiceForm type="purchase" onSave={handleSave} onCancel={() => setShowForm(false)} />
      </Modal>
    </div>
  );
}
