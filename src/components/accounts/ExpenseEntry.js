import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import FormField, { ErrorSummary } from '../common/FormField';
import { Plus, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate, today } from '../../utils/helpers';
import { validators, validateForm } from '../../utils/validation';

const emptyForm = { date: today(), expenseHead: 'Rent', amount: 0, paidFrom: 'Cash', billRef: '', narration: '' };

export default function ExpenseEntry() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const payAccountName = form.paidFrom === 'Cash' ? 'Cash' : 'HDFC Bank - Current';
  const payAccount = state.accounts.find(a => a.name === payAccountName);
  const insufficientFunds = payAccount && Number(form.amount) > payAccount.balance;

  const errors = useMemo(() => {
    const { errors } = validateForm({
      date: [validators.required(form.date, 'Date')],
      expenseHead: [validators.required(form.expenseHead, 'Expense head')],
      amount: [
        validators.required(form.amount, 'Amount'),
        validators.positiveNonZero(form.amount, 'Amount'),
        validators.maxValue(form.amount, 99999999, 'Amount'),
      ],
      billRef: [validators.maxLength(form.billRef, 100, 'Bill reference')],
      narration: [validators.maxLength(form.narration, 500, 'Narration')],
    });
    return errors;
  }, [form]);

  const hasErrors = Object.values(errors).some(e => e);
  const touch = (field) => setTouched(prev => ({ ...prev, [field]: true }));

  const handleSave = () => {
    setSubmitted(true);
    setTouched({ date: true, amount: true, expenseHead: true });
    if (hasErrors) return;
    if (insufficientFunds) {
      if (!window.confirm(`${payAccountName} balance (${formatCurrency(payAccount.balance)}) is less than expense amount. The balance will go negative. Continue?`)) return;
    }
    dispatch({ type: 'ADD_EXPENSE', payload: form });
    closeForm();
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyForm);
    setTouched({});
    setSubmitted(false);
  };

  const columns = [
    { key: 'expenseNo', label: 'Expense No', sortable: true },
    { key: 'date', label: 'Date', render: (v) => formatDate(v) },
    { key: 'expenseHead', label: 'Head', render: (v) => <span className="badge badge-gray">{v}</span> },
    { key: 'amount', label: 'Amount', align: 'right', render: (v) => formatCurrency(v) },
    { key: 'paidFrom', label: 'Paid From' },
    { key: 'narration', label: 'Narration' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Expense Entries</h1>
        <button onClick={() => { setForm(emptyForm); setTouched({}); setSubmitted(false); setShowForm(true); }} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} /> New Expense
        </button>
      </div>
      <div className="card">
        <DataTable columns={columns} data={[...state.expenses].reverse()} searchFields={['expenseNo', 'expenseHead', 'narration']} />
      </div>

      <Modal isOpen={showForm} onClose={closeForm} title="New Expense Entry">
        <ErrorSummary errors={errors} show={submitted && hasErrors} />

        {insufficientFunds && form.amount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800 flex items-center gap-2 mb-4">
            <AlertTriangle size={16} />
            {payAccountName} balance ({formatCurrency(payAccount?.balance || 0)}) is less than expense amount
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date" required error={errors.date} touched={touched.date || submitted}>
              <input className="input" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} onBlur={() => touch('date')} max={today()} />
            </FormField>

            <FormField label="Expense Head" required error={errors.expenseHead} touched={touched.expenseHead || submitted}>
              <select className="input" value={form.expenseHead} onChange={e => setForm({...form, expenseHead: e.target.value})}>
                <option>Rent</option>
                <option>Salary</option>
                <option>Transport</option>
                <option>Office Expenses</option>
                <option>Miscellaneous</option>
              </select>
            </FormField>

            <FormField label="Amount" required error={errors.amount} touched={touched.amount || submitted}>
              <input className="input" type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: Number(e.target.value)})} onBlur={() => touch('amount')} />
            </FormField>

            <FormField label="Paid From" required hint={payAccount ? `Balance: ${formatCurrency(payAccount.balance)}` : ''}>
              <select className="input" value={form.paidFrom} onChange={e => setForm({...form, paidFrom: e.target.value})}>
                <option>Cash</option>
                <option>Bank</option>
              </select>
            </FormField>

            <FormField label="Bill Reference" error={errors.billRef} touched={touched.billRef || submitted}>
              <input className="input" value={form.billRef} onChange={e => setForm({...form, billRef: e.target.value})} onBlur={() => touch('billRef')} maxLength={100} placeholder="Optional bill/receipt number" />
            </FormField>
          </div>

          <FormField label="Narration" error={errors.narration} touched={touched.narration || submitted}>
            <textarea className="input" rows={2} value={form.narration} onChange={e => setForm({...form, narration: e.target.value})} onBlur={() => touch('narration')} maxLength={500} placeholder="Description of expense" />
          </FormField>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={closeForm} className="btn btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn btn-primary" disabled={submitted && hasErrors}>Save</button>
        </div>
      </Modal>
    </div>
  );
}
