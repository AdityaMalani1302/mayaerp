import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import InvoiceForm from '../common/InvoiceForm';
import PrintPreview from '../common/PrintPreview';
import { Plus, Printer, ArrowRight } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

export default function DeliveryChallan() {
  const { state, dispatch } = useApp();
  const { addToast } = useToast();
  const confirm = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [printData, setPrintData] = useState(null);

  const handleSave = (data) => {
    dispatch({ type: 'ADD_DELIVERY_CHALLAN', payload: { ...data, summary: { subtotal: data.subtotal, taxable: data.taxable, cgst: data.cgst, sgst: data.sgst, igst: data.igst, grandTotal: data.grandTotal, totalDiscount: data.totalDiscount, roundOff: data.roundOff } } });
    addToast('Delivery challan created successfully', 'success');
    setShowForm(false);
  };

  const handleConvert = async (id) => {
    const ok = await confirm('Convert this challan to a Sales Invoice?', { title: 'Convert Challan', confirmLabel: 'Convert' });
    if (ok) {
      dispatch({ type: 'CONVERT_CHALLAN_TO_INVOICE', payload: id });
      addToast('Challan converted to invoice successfully', 'success');
    }
  };

  const columns = [
    { key: 'challanNo', label: 'Challan No', sortable: true },
    { key: 'date', label: 'Date', render: (v) => formatDate(v) },
    { key: 'partyId', label: 'Customer', render: (v) => state.parties.find(p => p.id === v)?.name || '-' },
    { key: 'vehicleNo', label: 'Vehicle' },
    { key: 'status', label: 'Status', render: (v) => (
      <span className={`badge ${v === 'Converted' ? 'badge-success' : 'badge-warning'}`}>{v}</span>
    )},
    { key: 'convertedTo', label: 'Invoice No' },
  ];

  if (printData) {
    return <PrintPreview type="challan" data={printData} onClose={() => setPrintData(null)} />;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Delivery Challans</h1>
        <button onClick={() => setShowForm(true)} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} /> New Challan
        </button>
      </div>
      <div className="card">
        <DataTable
          columns={columns}
          data={[...state.deliveryChallans].reverse()}
          searchFields={['challanNo', 'vehicleNo']}
          emptyState={{ title: 'No delivery challans yet', description: 'Create your first delivery challan.', actionLabel: 'New Challan', onAction: () => setShowForm(true) }}
          actions={(row) => (
            <>
              <button onClick={() => setPrintData(row)} className="p-1.5 rounded hover:bg-green-50 text-green-600" title="Print"><Printer size={15} /></button>
              {row.status === 'Pending' && (
                <button onClick={() => handleConvert(row.id)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Convert to Invoice"><ArrowRight size={15} /></button>
              )}
            </>
          )}
        />
      </div>
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Delivery Challan" size="xl">
        <InvoiceForm type="challan" onSave={handleSave} onCancel={() => setShowForm(false)} />
      </Modal>
    </div>
  );
}
