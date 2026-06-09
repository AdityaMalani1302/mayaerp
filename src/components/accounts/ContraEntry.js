import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import FormField, { ErrorSummary } from '../common/FormField';
import { Plus, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate, today } from '../../utils/helpers';
import { validators, validateForm } from '../../utils/validation';

const emptyForm = { date: today(), fromAccount: 'Cash', toAccount: 'HDFC Bank - Current', amount: 0, narration: '' };

export default function ContraEntry() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const cashBankAccounts = state.accounts.filter(a => a.type === 'Cash' || a.type === 'Bank');
  const fromAcc = state.accounts.find(a => a.name === form.fromAccount);
  const insufficientFunds = fromAcc && Number(form.amount) > fromAcc.balance;

  const errors = useMemo(() => {
    const rules = {
      date: [validators.required(form.date, 'Date')],
      amount: [
        validators.required(form.amount, 'Amount'),
        validators.positiveNonZero(form.amount, 'Amount'),
        validators.maxValue(form.amount, 99999999, 'Amount'),
      ],
      fromAccount: [validators.required(form.fromAccount, 'From account')],
      toAccount: [validators.required(form.toAccount, 'To account')],
      narration: [validators.maxLength(form.narration, 500, 'Narration')],
    };
    if (form.fromAccount && form.toAccount && form.fromAccount === form.toAccount) {
      rules.toAccount = ['From and To accounts must be different'];
    }
    const { errors } = validateForm(rules);
    return errors;
  }, [form]);

  const hasErrors = Object.values(errors).some(e => e);
  const touch = (field) => setTouched(prev => ({ ...prev, [field]: true }));

  const handleSave = () => {
    setSubmitted(true);
    setTouched({ date: true, amount: true, fromAccount: true, toAccount: true });
    if (hasErrors) return;
    if (insufficientFunds) {
      if (!window.confirm(`${form.fromAccount} balance (${formatCurrency(fromAcc.balance)}) is less than transfer amount. The balance will go negative. Continue?`)) return;
    }
    dispatch({ type: 'ADD_CONTRA_ENTRY', payload: form });
    closeForm();
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyForm);
    setTouched({});
    setSubmitted(false);
  };

  const columns = [
    { key: 'contraNo', label: 'Contra No', sortable: true },
    { key: 'date', label: 'Date', render: (v) => formatDate(v) },
    { key: 'fromAccount', label: 'From' },
    { key: 'toAccount', label: 'To' },
    { key: 'amount', label: 'Amount', align: 'right', render: (v) => formatCurrency(v) },
    { key: 'narration', label: 'Narration' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Contra Entries</h1>
        <button onClick={() => { setForm(emptyForm); setTouched({}); setSubmitted(false); setShowForm(true); }} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} /> New Contra
        </button>
      </div>
      <div className="card">
        <DataTable columns={columns} data={[...state.contraEntries].reverse()} searchFields={['contraNo']} />
      </div>

      <Modal isOpen={showForm} onClose={closeForm} title="New Contra Entry (Cash/Bank Transfer)">
        <ErrorSummary errors={errors} show={submitted && hasErrors} />

        {insufficientFunds && form.amount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800 flex items-center gap-2 mb-4">
            <AlertTriangle size={16} />
            {form.fromAccount} balance ({formatCurrency(fromAcc?.balance || 0)}) is less than transfer amount
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date" required error={errors.date} touched={touched.date || submitted}>
              <input className="input" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} onBlur={() => touch('date')} max={today()} />
            </FormField>

            <FormField label="Amount" required error={errors.amount} touched={touched.amount || submitted}>
              <input className="input" type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: Number(e.target.value)})} onBlur={() => touch('amount')} />
            </FormField>

            <FormField label="From Account" required error={errors.fromAccount} touched={touched.fromAccount || submitted}>
              <select className="input" value={form.fromAccount} onChange={e => setForm({...form, fromAccount: e.target.value})} onBlur={() => touch('fromAccount')}>
                <option value="">-- Select --</option>
                {cashBankAccounts.map(a => (
                  <option key={a.id} value={a.name}>{a.name} (Balance: {formatCurrency(a.balance)})</option>
                ))}
              </select>
            </FormField>

            <FormField label="To Account" required error={errors.toAccount} touched={touched.toAccount || submitted}>
              <select className="input" value={form.toAccount} onChange={e => setForm({...form, toAccount: e.target.value})} onBlur={() => touch('toAccount')}>
                <option value="">-- Select --</option>
                {cashBankAccounts.filter(a => a.name !== form.fromAccount).map(a => (
                  <option key={a.id} value={a.name}>{a.name} (Balance: {formatCurrency(a.balance)})</option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Narration" error={errors.narration} touched={touched.narration || submitted}>
            <textarea className="input" rows={2} value={form.narration} onChange={e => setForm({...form, narration: e.target.value})} onBlur={() => touch('narration')} maxLength={500} placeholder="e.g. Cash deposited to bank" />
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
