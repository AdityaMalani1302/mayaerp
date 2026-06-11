import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import InvoiceForm from '../common/InvoiceForm';
import PrintPreview from '../common/PrintPreview';
import { Plus, Eye, Printer } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';

export default function SalesInvoice() {
  const { state, dispatch } = useApp();
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [viewData, setViewData] = useState(null);

  const handleSave = (data) => {
    dispatch({ type: 'ADD_SALES_INVOICE', payload: data });
    addToast('Sales invoice created successfully', 'success');
    setShowForm(false);
  };

  const columns = [
    { key: 'invoiceNo', label: 'Invoice No', sortable: true },
    { key: 'date', label: 'Date', sortable: true, render: (v) => formatDate(v) },
    { key: 'partyId', label: 'Customer', render: (v) => state.parties.find(p => p.id === v)?.name || '-' },
    { key: 'grandTotal', label: 'Amount', align: 'right', sortable: true, render: (v) => formatCurrency(v) },
    { key: 'paymentMode', label: 'Payment', render: (v) => <span className="badge badge-gray">{v}</span> },
    { key: 'status', label: 'Status', render: (v) => (
      <span className={`badge ${v === 'Paid' ? 'badge-success' : v === 'Partial' ? 'badge-warning' : 'badge-danger'}`}>{v}</span>
    )},
  ];

  if (printData) {
    return <PrintPreview type="invoice" data={printData} onClose={() => setPrintData(null)} />;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Sales Invoices</h1>
        <button onClick={() => setShowForm(true)} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} /> New Invoice
        </button>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={[...state.salesInvoices].reverse()}
          searchFields={['invoiceNo', (r) => state.parties.find(p => p.id === r.partyId)?.name]}
          emptyState={{ title: 'No invoices yet', description: 'Create your first sales invoice to get started.', actionLabel: 'New Invoice', onAction: () => setShowForm(true) }}
          actions={(row) => (
            <>
              <button onClick={() => setViewData(row)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Eye size={15} /></button>
              <button onClick={() => setPrintData(row)} className="p-1.5 rounded hover:bg-green-50 text-green-600"><Printer size={15} /></button>
            </>
          )}
        />
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Sales Invoice" size="xl">
        <InvoiceForm type="sales" onSave={handleSave} onCancel={() => setShowForm(false)} />
      </Modal>

      <Modal isOpen={!!viewData} onClose={() => setViewData(null)} title={`Invoice ${viewData?.invoiceNo}`} size="lg">
        {viewData && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-3 gap-4">
              <div><span className="text-gray-500">Date:</span> {formatDate(viewData.date)}</div>
              <div><span className="text-gray-500">Customer:</span> {state.parties.find(p => p.id === viewData.partyId)?.name}</div>
              <div><span className="text-gray-500">Payment:</span> {viewData.paymentMode}</div>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr><th>Item</th><th>Qty</th><th>Rate</th><th>Tax</th><th className="text-right">Net</th></tr>
                </thead>
                <tbody>
                  {viewData.items?.map((li, i) => (
                    <tr key={i}>
                      <td>{state.items.find(it => it.id === li.itemId)?.name}</td>
                      <td>{li.qty}</td>
                      <td>{formatCurrency(li.rate)}</td>
                      <td>{formatCurrency(li.taxAmount)}</td>
                      <td className="text-right">{formatCurrency(li.netAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-right text-lg font-bold">Grand Total: {formatCurrency(viewData.grandTotal)}</div>
            <div className="flex justify-end">
              <button onClick={() => { setViewData(null); setPrintData(viewData); }} className="btn btn-primary flex items-center gap-2">
                <Printer size={16} /> Print
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
