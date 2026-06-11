import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import FormField, { ErrorSummary } from '../common/FormField';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { validators, validateForm, isAccountReferenced } from '../../utils/validation';

const emptyAccount = { name: '', type: 'Cash' };

export default function AccountMaster() {
  const { state, dispatch } = useApp();
  const { addToast } = useToast();
  const confirm = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyAccount);
  const [editing, setEditing] = useState(null);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const existingNames = useMemo(() =>
    state.accounts.map(a => ({ id: a.id, value: a.name })),
    [state.accounts]
  );

  const errors = useMemo(() => {
    const { errors } = validateForm({
      name: [
        validators.required(form.name, 'Account name'),
        validators.minLength(form.name, 2, 'Account name'),
        validators.maxLength(form.name, 100, 'Account name'),
        validators.unique(form.name, existingNames, 'Account name', editing),
      ],
    });
    return errors;
  }, [form, existingNames, editing]);

  const hasErrors = Object.values(errors).some(e => e);
  const touch = (field) => setTouched(prev => ({ ...prev, [field]: true }));

  const handleSave = () => {
    setSubmitted(true);
    setTouched({ name: true });
    if (hasErrors) return;
    if (editing) {
      dispatch({ type: 'UPDATE_ACCOUNT', payload: { ...form, id: editing } });
      addToast('Account updated successfully', 'success');
    } else {
      dispatch({ type: 'ADD_ACCOUNT', payload: form });
      addToast('Account created successfully', 'success');
    }
    closeForm();
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyAccount);
    setEditing(null);
    setTouched({});
    setSubmitted(false);
  };

  const handleDelete = async (row) => {
    const refs = isAccountReferenced(row.name, state);
    if (refs.length > 0) {
      alert(`Cannot delete: this account is referenced in ${refs.join(', ')}`);
      return;
    }
    if (row.balance !== 0) {
      alert(`Cannot delete: account has a non-zero balance (${formatCurrency(row.balance)})`);
      return;
    }
    const ok = await confirm('Delete this account? This action cannot be undone.', { title: 'Delete Account', variant: 'danger', confirmLabel: 'Delete' });
    if (ok) {
      dispatch({ type: 'DELETE_ACCOUNT', payload: row.id });
      addToast('Account deleted', 'success');
    }
  };

  const columns = [
    { key: 'name', label: 'Account Name', sortable: true },
    { key: 'type', label: 'Type', sortable: true, render: (v) => {
      const colors = { Cash: 'badge-success', Bank: 'badge-info', Income: 'badge-warning', Expense: 'badge-danger', Receivable: 'badge-gray', Payable: 'badge-gray' };
      return <span className={`badge ${colors[v] || 'badge-gray'}`}>{v}</span>;
    }},
    { key: 'balance', label: 'Balance', align: 'right', render: (v) => formatCurrency(v) },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Account Master</h1>
        <button onClick={() => { setForm(emptyAccount); setEditing(null); setTouched({}); setSubmitted(false); setShowForm(true); }} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Account
        </button>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={state.accounts}
          searchFields={['name', 'type']}
          emptyState={{ title: 'No accounts yet', description: 'Add your first account (Cash, Bank, etc.).', actionLabel: 'Add Account', onAction: () => { setForm(emptyAccount); setEditing(null); setTouched({}); setSubmitted(false); setShowForm(true); } }}
          actions={(row) => (
            <>
              <button onClick={() => { setForm(row); setEditing(row.id); setTouched({}); setSubmitted(false); setShowForm(true); }} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Edit"><Edit2 size={15} /></button>
              <button onClick={() => handleDelete(row)} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Delete"><Trash2 size={15} /></button>
            </>
          )}
        />
      </div>

      <Modal isOpen={showForm} onClose={closeForm} title={editing ? 'Edit Account' : 'Add Account'}>
        <ErrorSummary errors={errors} show={submitted && hasErrors} />
        <div className="space-y-4">
          <FormField label="Account Name" required error={errors.name} touched={touched.name || submitted}>
            <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} onBlur={() => touch('name')} autoFocus maxLength={100} placeholder="Enter account name" />
          </FormField>

          <FormField label="Account Type" required>
            <select className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              <option>Cash</option>
              <option>Bank</option>
              <option>Receivable</option>
              <option>Payable</option>
              <option>Expense</option>
              <option>Income</option>
            </select>
          </FormField>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={closeForm} className="btn btn-secondary">Cancel</button>
          <button data-keyboard-save onClick={handleSave} className="btn btn-primary" disabled={submitted && hasErrors}>
            {editing ? 'Update' : 'Save'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
