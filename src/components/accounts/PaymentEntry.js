import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import FormField, { ErrorSummary } from '../common/FormField';
import { Plus, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate, today } from '../../utils/helpers';
import { validators, validateForm } from '../../utils/validation';

const emptyForm = { date: today(), partyId: '', amount: 0, mode: 'Cash', bankDetails: '', chequeNo: '', againstBill: '', narration: '' };

export default function PaymentEntry() {
  const { state, dispatch } = useApp();
  const { addToast } = useToast();
  const confirm = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const unpaidBills = state.purchaseBills.filter(b => b.status !== 'Paid');

  const selectedBill = form.againstBill
    ? state.purchaseBills.find(b => b.entryNo === form.againstBill)
    : null;
  const billOutstanding = selectedBill
    ? (selectedBill.grandTotal || 0) - (selectedBill.paidAmount || 0)
    : null;

  // Balance check
  const payAccount = state.accounts.find(a => form.mode === 'Cash' ? a.name === 'Cash' : a.type === 'Bank');
  const payAccountName = payAccount?.name || (form.mode === 'Cash' ? 'Cash' : 'Bank');
  const insufficientFunds = payAccount && Number(form.amount) > payAccount.balance;

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
    if (form.againstBill && billOutstanding !== null && Number(form.amount) > billOutstanding) {
      rules.amount.push(`Amount exceeds outstanding (${formatCurrency(billOutstanding)})`);
    }
    if (form.mode === 'Cheque') {
      rules.chequeNo = [validators.required(form.chequeNo, 'Cheque number')];
      rules.bankDetails = [validators.required(form.bankDetails, 'Bank details')];
    }
    if (form.mode === 'NEFT') {
      rules.chequeNo = [validators.required(form.chequeNo, 'Reference number')];
    }
    const { errors } = validateForm(rules);
    return errors;
  }, [form, billOutstanding]);

  const hasErrors = Object.values(errors).some(e => e);
  const touch = (field) => setTouched(prev => ({ ...prev, [field]: true }));

  const handleSave = async () => {
    setSubmitted(true);
    const all = {};
    ['date', 'partyId', 'amount', 'chequeNo', 'bankDetails'].forEach(k => { all[k] = true; });
    setTouched(all);
    if (hasErrors) return;
    if (insufficientFunds) {
      const ok = await confirm(`${payAccountName} balance (${formatCurrency(payAccount?.balance || 0)}) is less than payment amount. The balance will go negative.`, { title: 'Low Balance', variant: 'warning', confirmLabel: 'Continue Anyway' });
      if (!ok) return;
    }
    setSaving(true);
    try {
      dispatch({ type: 'ADD_PAYMENT', payload: form });
      addToast('Payment saved successfully', 'success');
    } catch (e) {
      addToast('Failed to save payment', 'error');
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
    { key: 'paymentNo', label: 'Payment No', sortable: true },
    { key: 'date', label: 'Date', render: (v) => formatDate(v) },
    { key: 'partyId', label: 'Paid To', render: (v) => state.parties.find(p => p.id === v)?.name || '-' },
    { key: 'amount', label: 'Amount', align: 'right', render: (v) => formatCurrency(v) },
    { key: 'mode', label: 'Mode', render: (v) => <span className="badge badge-gray">{v}</span> },
    { key: 'againstBill', label: 'Against Bill' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Payment Entries</h1>
        <button onClick={() => { setForm(emptyForm); setTouched({}); setSubmitted(false); setShowForm(true); }} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} /> New Payment
        </button>
      </div>
      <div className="card">
        <DataTable columns={columns} data={[...state.payments].reverse()} searchFields={['paymentNo']} emptyState={{ title: 'No payments yet', description: 'Record your first payment entry.', actionLabel: 'New Payment', onAction: () => { setForm(emptyForm); setTouched({}); setSubmitted(false); setShowForm(true); } }} />
      </div>

      <Modal isOpen={showForm} onClose={closeForm} title="New Payment Entry">
        <ErrorSummary errors={errors} show={submitted && hasErrors} />

        {insufficientFunds && form.amount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800 flex items-center gap-2 mb-4">
            <AlertTriangle size={16} />
            {payAccountName} balance ({formatCurrency(payAccount?.balance || 0)}) is less than payment amount
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date" required error={errors.date} touched={touched.date || submitted}>
              <input className="input" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} onBlur={() => touch('date')} max={today()} />
            </FormField>

            <FormField label="Paid To" required error={errors.partyId} touched={touched.partyId || submitted}>
              <select className="input" value={form.partyId} onChange={e => setForm({...form, partyId: e.target.value})} onBlur={() => touch('partyId')}>
                <option value="">-- Select --</option>
                {state.parties.filter(p => p.type === 'Supplier' || p.type === 'Both').map(p => (
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
                  <input className="input" value={form.bankDetails} onChange={e => setForm({...form, bankDetails: e.target.value})} onBlur={() => touch('bankDetails')} />
                </FormField>
                <FormField label={form.mode === 'Cheque' ? 'Cheque No' : 'Reference No'} required error={errors.chequeNo} touched={touched.chequeNo || submitted}>
                  <input className="input" value={form.chequeNo} onChange={e => setForm({...form, chequeNo: e.target.value})} onBlur={() => touch('chequeNo')} />
                </FormField>
              </>
            )}

            <FormField label="Against Bill" hint={billOutstanding !== null ? `Outstanding: ${formatCurrency(billOutstanding)}` : undefined}>
              <select className="input" value={form.againstBill} onChange={e => setForm({...form, againstBill: e.target.value})}>
                <option value="">-- None --</option>
                {unpaidBills.map(b => (
                  <option key={b.id} value={b.entryNo}>
                    {b.entryNo} - Total: {formatCurrency(b.grandTotal)} | Due: {formatCurrency((b.grandTotal || 0) - (b.paidAmount || 0))}
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
