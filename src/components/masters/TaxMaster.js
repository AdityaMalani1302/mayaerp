import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import FormField, { ErrorSummary } from '../common/FormField';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { validators, validateForm, isTaxReferenced } from '../../utils/validation';

const emptyTax = { name: '', rate: 0 };

export default function TaxMaster() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyTax);
  const [editing, setEditing] = useState(null);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const existingNames = useMemo(() =>
    state.taxes.map(t => ({ id: t.id, value: t.name })),
    [state.taxes]
  );

  const errors = useMemo(() => {
    const { errors } = validateForm({
      name: [
        validators.required(form.name, 'Tax name'),
        validators.minLength(form.name, 2, 'Tax name'),
        validators.unique(form.name, existingNames, 'Tax name', editing),
      ],
      rate: [
        validators.positiveNumber(form.rate, 'Tax rate'),
        validators.maxValue(form.rate, 100, 'Tax rate'),
      ],
    });
    return errors;
  }, [form, existingNames, editing]);

  const hasErrors = Object.values(errors).some(e => e);
  const touch = (field) => setTouched(prev => ({ ...prev, [field]: true }));

  const handleSave = () => {
    setSubmitted(true);
    setTouched({ name: true, rate: true });
    if (hasErrors) return;
    if (editing) {
      dispatch({ type: 'UPDATE_TAX', payload: { ...form, id: editing } });
    } else {
      dispatch({ type: 'ADD_TAX', payload: form });
    }
    closeForm();
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyTax);
    setEditing(null);
    setTouched({});
    setSubmitted(false);
  };

  const handleDelete = (row) => {
    const refs = isTaxReferenced(row.rate, state);
    if (refs.length > 0) {
      alert(`Cannot delete: tax rate ${row.rate}% is assigned to items in ${refs.join(', ')}`);
      return;
    }
    if (window.confirm('Are you sure you want to delete this tax slab?')) {
      dispatch({ type: 'DELETE_TAX', payload: row.id });
    }
  };

  const columns = [
    { key: 'name', label: 'Tax Name', sortable: true },
    { key: 'rate', label: 'Rate %', render: (v) => `${v}%` },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Tax Master</h1>
        <button onClick={() => { setForm(emptyTax); setEditing(null); setTouched({}); setSubmitted(false); setShowForm(true); }} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Tax
        </button>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={state.taxes}
          searchFields={['name']}
          actions={(row) => (
            <>
              <button onClick={() => { setForm(row); setEditing(row.id); setTouched({}); setSubmitted(false); setShowForm(true); }} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Edit"><Edit2 size={15} /></button>
              <button onClick={() => handleDelete(row)} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Delete"><Trash2 size={15} /></button>
            </>
          )}
        />
      </div>

      <Modal isOpen={showForm} onClose={closeForm} title={editing ? 'Edit Tax' : 'Add Tax'}>
        <ErrorSummary errors={errors} show={submitted && hasErrors} />
        <div className="space-y-4">
          <FormField label="Tax Name" required error={errors.name} touched={touched.name || submitted}>
            <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} onBlur={() => touch('name')} autoFocus placeholder="e.g. GST 18%" />
          </FormField>
          <FormField label="Rate %" required error={errors.rate} touched={touched.rate || submitted} hint="0 for Exempt, max 100%">
            <input className="input" type="number" min="0" max="100" step="0.01" value={form.rate} onChange={e => setForm({...form, rate: Number(e.target.value)})} onBlur={() => touch('rate')} />
          </FormField>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={closeForm} className="btn btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn btn-primary" disabled={submitted && hasErrors}>
            {editing ? 'Update' : 'Save'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
