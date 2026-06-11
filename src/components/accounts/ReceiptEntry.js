import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import FormField, { ErrorSummary } from '../common/FormField';
import { Plus } from 'lucide-react';
import { formatCurrency, formatDate, today } from '../../utils/helpers';
import { validators, validateForm } from '../../utils/validation';

const emptyForm = { date: today(), partyId: '', amount: 0, mode: 'Cash', bankDetails: '', chequeNo: '', againstInvoice: '', narration: '' };

export default function ReceiptEntry() {
  const { state, dispatch } = useApp();
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const unpaidInvoices = state.salesInvoices.filter(i => i.status !== 'Paid');

  // Against invoice outstanding check
  const selectedInvoice = form.againstInvoice
    ? state.salesInvoices.find(i => i.invoiceNo === form.againstInvoice)
    : null;
  const invoiceOutstanding = selectedInvoice
    ? (selectedInvoice.grandTotal || 0) - (selectedInvoice.paidAmount || 0)
    : null;

  const errors = useMemo(() => {
    const rules = {
      date: [validators.required(form.date, 'Date')],
      partyId: [validators.required(form.partyId, 'Party')],
      amount: [
        validators.required(form.amount, 'Amount'),
        validators.positiveNonZero(form.amount, 'Amount'),
        validators.maxValue(form.amount, 99999999, 'Amount'),
      ],
      narration: [validators.maxLength(form.narration, 500, 'Narration')],
    };
    // Check receipt doesn't exceed outstanding
    if (form.againstInvoice && invoiceOutstanding !== null && Number(form.amount) > invoiceOutstanding) {
      rules.amount.push(`Amount exceeds outstanding (${formatCurrency(invoiceOutstanding)})`);
    }
    // Cheque/NEFT require bank details
    if (form.mode === 'Cheque') {
      rules.chequeNo = [validators.required(form.chequeNo, 'Cheque number')];
      rules.bankDetails = [validators.required(form.bankDetails, 'Bank details')];
    }
    if (form.mode === 'NEFT') {
      rules.chequeNo = [validators.required(form.chequeNo, 'Reference number')];
    }

    const { errors } = validateForm(rules);
    return errors;
  }, [form, invoiceOutstanding]);

  const hasErrors = Object.values(errors).some(e => e);
  const touch = (field) => setTouched(prev => ({ ...prev, [field]: true }));

  const handleSave = () => {
    setSubmitted(true);
    const all = {};
    ['date', 'partyId', 'amount', 'chequeNo', 'bankDetails'].forEach(k => { all[k] = true; });
    setTouched(all);
    if (hasErrors) return;
    setSaving(true);
    try {
      dispatch({ type: 'ADD_RECEIPT', payload: form });
      addToast('Receipt saved successfully', 'success');
    } catch (e) {
      addToast('Failed to save receipt', 'error');
    }
    closeForm();
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyForm);
    setTouched({});
    setSubmitted(false);
  };

  const columns = [
    { key: 'receiptNo', label: 'Receipt No', sortable: true },
    { key: 'date', label: 'Date', render: (v) => formatDate(v) },
    { key: 'partyId', label: 'Received From', render: (v) => state.parties.find(p => p.id === v)?.name || '-' },
    { key: 'amount', label: 'Amount', align: 'right', render: (v) => formatCurrency(v) },
    { key: 'mode', label: 'Mode', render: (v) => <span className="badge badge-gray">{v}</span> },
    { key: 'againstInvoice', label: 'Against Invoice' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Receipt Entries</h1>
        <button onClick={() => { setForm(emptyForm); setTouched({}); setSubmitted(false); setShowForm(true); }} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} /> New Receipt
        </button>
      </div>
      <div className="card">
        <DataTable columns={columns} data={[...state.receipts].reverse()} searchFields={['receiptNo']} emptyState={{ title: 'No receipts yet', description: 'Record your first receipt entry.', actionLabel: 'New Receipt', onAction: () => { setForm(emptyForm); setTouched({}); setSubmitted(false); setShowForm(true); } }} />
      </div>

      <Modal isOpen={showForm} onClose={closeForm} title="New Receipt Entry">
        <ErrorSummary errors={errors} show={submitted && hasErrors} />
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date" required error={errors.date} touched={touched.date || submitted}>
              <input className="input" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} onBlur={() => touch('date')} max={today()} />
            </FormField>

            <FormField label="Received From" required error={errors.partyId} touched={touched.partyId || submitted}>
              <select className="input" value={form.partyId} onChange={e => setForm({...form, partyId: e.target.value})} onBlur={() => touch('partyId')}>
                <option value="">-- Select --</option>
                {state.parties.filter(p => p.type === 'Customer' || p.type === 'Both').map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Amount" required error={errors.amount} touched={touched.amount || submitted}>
              <input className="input" type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: Number(e.target.value)})} onBlur={() => touch('amount')} />
            </FormField>

            <FormField label="Mode" required>
              <select className="input" value={form.mode} onChange={e => setForm({...form, mode: e.target.value})}>
                <option>Cash</option>
                <option>Cheque</option>
                <option>NEFT</option>
                <option>UPI</option>
              </select>
            </FormField>

            {(form.mode === 'Cheque' || form.mode === 'NEFT') && (
              <>
                <FormField label="Bank Details" required={form.mode === 'Cheque'} error={errors.bankDetails} touched={touched.bankDetails || submitted}>
                  <input className="input" value={form.bankDetails} onChange={e => setForm({...form, bankDetails: e.target.value})} onBlur={() => touch('bankDetails')} placeholder="Bank name & branch" />
                </FormField>
                <FormField label={form.mode === 'Cheque' ? 'Cheque No' : 'Reference No'} required error={errors.chequeNo} touched={touched.chequeNo || submitted}>
                  <input className="input" value={form.chequeNo} onChange={e => setForm({...form, chequeNo: e.target.value})} onBlur={() => touch('chequeNo')} />
                </FormField>
              </>
            )}

            <FormField label="Against Invoice" hint={invoiceOutstanding !== null ? `Outstanding: ${formatCurrency(invoiceOutstanding)}` : undefined}>
              <select className="input" value={form.againstInvoice} onChange={e => setForm({...form, againstInvoice: e.target.value})}>
                <option value="">-- None --</option>
                {unpaidInvoices.map(i => (
                  <option key={i.id} value={i.invoiceNo}>
                    {i.invoiceNo} - Total: {formatCurrency(i.grandTotal)} | Due: {formatCurrency((i.grandTotal || 0) - (i.paidAmount || 0))}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Narration" error={errors.narration} touched={touched.narration || submitted}>
            <textarea className="input" rows={2} value={form.narration} onChange={e => setForm({...form, narration: e.target.value})} onBlur={() => touch('narration')} maxLength={500} />
          </FormField>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={closeForm} className="btn btn-secondary">Cancel</button>
          <button data-keyboard-save onClick={handleSave} className="btn btn-primary" disabled={(submitted && hasErrors) || saving}>Save</button>
        </div>
      </Modal>
    </div>
  );
}
