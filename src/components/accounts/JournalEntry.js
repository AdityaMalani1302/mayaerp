import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import FormField, { ErrorSummary } from '../common/FormField';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate, today } from '../../utils/helpers';
import { validators, validateForm } from '../../utils/validation';

export default function JournalEntry() {
  const { state, dispatch } = useApp();
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: today(), narration: '' });
  const [lines, setLines] = useState([
    { account: '', debit: 0, credit: 0 },
    { account: '', debit: 0, credit: 0 },
  ]);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) <= 0.01;

  const errors = useMemo(() => {
    const rules = {
      date: [validators.required(form.date, 'Date')],
      narration: [
        validators.required(form.narration, 'Narration'),
        validators.maxLength(form.narration, 500, 'Narration'),
      ],
    };

    // Line-level checks
    const emptyAccounts = lines.some(l => !l.account);
    const zeroLines = lines.some(l => (Number(l.debit) || 0) === 0 && (Number(l.credit) || 0) === 0);
    const duplicateAccounts = lines.filter(l => l.account).length !== new Set(lines.filter(l => l.account).map(l => l.account)).size;
    const negativeAmounts = lines.some(l => Number(l.debit) < 0 || Number(l.credit) < 0);

    if (emptyAccounts) rules.lines_account = ['All lines must have an account selected'];
    if (zeroLines) rules.lines_amount = ['Each line must have either a debit or credit amount'];
    if (!isBalanced) rules.balance = [`Debit (${formatCurrency(totalDebit)}) and Credit (${formatCurrency(totalCredit)}) must be equal. Difference: ${formatCurrency(Math.abs(totalDebit - totalCredit))}`];
    if (duplicateAccounts) rules.lines_duplicate = ['Same account appears in multiple lines'];
    if (negativeAmounts) rules.lines_negative = ['Amounts cannot be negative'];
    if (totalDebit === 0 && totalCredit === 0) rules.lines_zero = ['Total amount cannot be zero'];

    const { errors } = validateForm(rules);
    return errors;
  }, [form, lines, isBalanced, totalDebit, totalCredit]);

  const hasErrors = Object.values(errors).some(e => e);
  const touch = (field) => setTouched(prev => ({ ...prev, [field]: true }));

  const handleSave = () => {
    setSubmitted(true);
    setTouched({ date: true, narration: true });
    if (hasErrors) return;
    setSaving(true);
    try {
      dispatch({ type: 'ADD_JOURNAL_ENTRY', payload: { ...form, lines } });
      addToast('Journal entry saved successfully', 'success');
    } catch (e) {
      addToast('Failed to save journal entry', 'error');
    }
    closeForm();
  };

  const closeForm = () => {
    setShowForm(false);
    setForm({ date: today(), narration: '' });
    setLines([{ account: '', debit: 0, credit: 0 }, { account: '', debit: 0, credit: 0 }]);
    setTouched({});
    setSubmitted(false);
  };

  const columns = [
    { key: 'entryNo', label: 'Entry No', sortable: true },
    { key: 'date', label: 'Date', render: (v) => formatDate(v) },
    { key: 'lines', label: 'Accounts', render: (v) => v?.map(l => l.account).join(', ') },
    { key: 'narration', label: 'Narration' },
    { key: 'lines', label: 'Amount', align: 'right', render: (v) => formatCurrency(v?.reduce((s, l) => s + (l.debit || 0), 0)) },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Journal Entries</h1>
        <button onClick={() => { closeForm(); setShowForm(true); }} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} /> New Journal
        </button>
      </div>
      <div className="card">
        <DataTable columns={columns} data={[...state.journalEntries].reverse()} searchFields={['entryNo', 'narration']} emptyState={{ title: 'No journal entries yet', description: 'Create your first journal entry.', actionLabel: 'New Journal', onAction: () => { closeForm(); setShowForm(true); } }} />
      </div>

      <Modal isOpen={showForm} onClose={closeForm} title="New Journal Entry" size="lg">
        <ErrorSummary errors={errors} show={submitted && hasErrors} />

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date" required error={errors.date} touched={touched.date || submitted}>
              <input className="input" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} onBlur={() => touch('date')} max={today()} />
            </FormField>
            <FormField label="Narration" required error={errors.narration} touched={touched.narration || submitted}>
              <input className="input" value={form.narration} onChange={e => setForm({...form, narration: e.target.value})} onBlur={() => touch('narration')} maxLength={500} placeholder="Description of this journal entry" />
            </FormField>
          </div>

          <div className="table-container">
            <table className="table text-sm">
              <thead>
                <tr>
                  <th>Account *</th>
                  <th className="text-right">Debit (Dr)</th>
                  <th className="text-right">Credit (Cr)</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => {
                  const isEmptyAccount = submitted && !line.account;
                  const isZeroAmount = submitted && (Number(line.debit) || 0) === 0 && (Number(line.credit) || 0) === 0;
                  return (
                    <tr key={idx} className={isEmptyAccount || isZeroAmount ? '!bg-red-50' : ''}>
                      <td>
                        <select
                          className={`input !py-1 ${isEmptyAccount ? '!border-red-400' : ''}`}
                          value={line.account}
                          onChange={e => {
                            const updated = [...lines];
                            updated[idx] = { ...updated[idx], account: e.target.value };
                            setLines(updated);
                          }}
                        >
                          <option value="">-- Select Account --</option>
                          {state.accounts.map(a => <option key={a.id} value={a.name}>{a.name} ({a.type})</option>)}
                        </select>
                        {isEmptyAccount && <p className="text-red-500 text-[10px] mt-0.5">Account required</p>}
                      </td>
                      <td>
                        <input
                          className={`input !py-1 text-right ${isZeroAmount ? '!border-red-400' : ''}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.debit}
                          onChange={e => {
                            const updated = [...lines];
                            updated[idx] = { ...updated[idx], debit: Number(e.target.value), credit: Number(e.target.value) > 0 ? 0 : line.credit };
                            setLines(updated);
                          }}
                        />
                      </td>
                      <td>
                        <input
                          className="input !py-1 text-right"
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.credit}
                          onChange={e => {
                            const updated = [...lines];
                            updated[idx] = { ...updated[idx], credit: Number(e.target.value), debit: Number(e.target.value) > 0 ? 0 : line.debit };
                            setLines(updated);
                          }}
                        />
                      </td>
                      <td>
                        {lines.length > 2 && (
                          <button onClick={() => setLines(lines.filter((_, i) => i !== idx))} className="p-1 text-red-400 hover:text-red-600">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                <tr className={`font-semibold ${!isBalanced && submitted ? 'bg-red-100' : 'bg-gray-50'}`}>
                  <td>Total</td>
                  <td className="text-right">{formatCurrency(totalDebit)}</td>
                  <td className="text-right">{formatCurrency(totalCredit)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={() => setLines([...lines, { account: '', debit: 0, credit: 0 }])} className="btn btn-sm btn-secondary">+ Add Row</button>
            {!isBalanced && (
              <p className="text-red-600 text-sm font-medium">
                Difference: {formatCurrency(Math.abs(totalDebit - totalCredit))} ({totalDebit > totalCredit ? 'Debit excess' : 'Credit excess'})
              </p>
            )}
            {isBalanced && totalDebit > 0 && (
              <p className="text-emerald-600 text-sm font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                Balanced
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={closeForm} className="btn btn-secondary">Cancel</button>
          <button data-keyboard-save onClick={handleSave} className="btn btn-primary" disabled={(submitted && hasErrors) || saving}>Save</button>
        </div>
      </Modal>
    </div>
  );
}
