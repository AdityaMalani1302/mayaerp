import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import FormField, { ErrorSummary } from '../common/FormField';
import { Plus } from 'lucide-react';
import { formatDate, today } from '../../utils/helpers';
import { validators, validateForm } from '../../utils/validation';

export default function StockJournal() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: today(), itemId: '', qty: 0, type: 'Add', reason: '' });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const selectedItem = state.items.find(i => i.id === form.itemId);

  const errors = useMemo(() => {
    const rules = {
      date: [validators.required(form.date, 'Date')],
      itemId: [validators.required(form.itemId, 'Item')],
      qty: [
        validators.required(form.qty, 'Quantity'),
        validators.positiveNonZero(form.qty, 'Quantity'),
        validators.maxValue(form.qty, 999999, 'Quantity'),
      ],
      reason: [
        validators.required(form.reason, 'Reason'),
        validators.minLength(form.reason, 3, 'Reason'),
        validators.maxLength(form.reason, 200, 'Reason'),
      ],
    };
    // If removing, check stock sufficiency
    if (form.type === 'Remove' && selectedItem && Number(form.qty) > selectedItem.currentStock) {
      rules.qty.push(`Cannot remove more than available stock (${selectedItem.currentStock} ${selectedItem.unit})`);
    }
    const { errors } = validateForm(rules);
    return errors;
  }, [form, selectedItem]);

  const hasErrors = Object.values(errors).some(e => e);
  const touch = (field) => setTouched(prev => ({ ...prev, [field]: true }));

  const handleSave = () => {
    setSubmitted(true);
    setTouched({ date: true, itemId: true, qty: true, reason: true });
    if (hasErrors) return;

    dispatch({ type: 'ADD_STOCK_JOURNAL', payload: form });
    const qtyChange = form.type === 'Add' ? Number(form.qty) : -Number(form.qty);
    if (selectedItem) {
      dispatch({ type: 'UPDATE_ITEM', payload: { ...selectedItem, currentStock: selectedItem.currentStock + qtyChange } });
    }
    closeForm();
  };

  const closeForm = () => {
    setShowForm(false);
    setForm({ date: today(), itemId: '', qty: 0, type: 'Add', reason: '' });
    setTouched({});
    setSubmitted(false);
  };

  const columns = [
    { key: 'journalNo', label: 'Journal No', sortable: true },
    { key: 'date', label: 'Date', render: (v) => formatDate(v) },
    { key: 'itemId', label: 'Item', render: (v) => state.items.find(i => i.id === v)?.name || '-' },
    { key: 'type', label: 'Type', render: (v) => <span className={`badge ${v === 'Add' ? 'badge-success' : 'badge-danger'}`}>{v}</span> },
    { key: 'qty', label: 'Qty', align: 'right' },
    { key: 'reason', label: 'Reason' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Stock Journal / Adjustment</h1>
        <button onClick={() => { closeForm(); setShowForm(true); }} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} /> New Entry
        </button>
      </div>
      <div className="card">
        <DataTable columns={columns} data={[...state.stockJournals].reverse()} searchFields={['journalNo', 'reason']} />
      </div>

      <Modal isOpen={showForm} onClose={closeForm} title="Stock Adjustment">
        <ErrorSummary errors={errors} show={submitted && hasErrors} />

        <div className="space-y-4">
          <FormField label="Date" required error={errors.date} touched={touched.date || submitted}>
            <input className="input" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} onBlur={() => touch('date')} max={today()} />
          </FormField>

          <FormField label="Item" required error={errors.itemId} touched={touched.itemId || submitted}>
            <select className="input" value={form.itemId} onChange={e => setForm({...form, itemId: e.target.value})} onBlur={() => touch('itemId')}>
              <option value="">-- Select Item --</option>
              {state.items.map(i => <option key={i.id} value={i.id}>{i.name} (Current Stock: {i.currentStock} {i.unit})</option>)}
            </select>
          </FormField>

          <FormField label="Adjustment Type" required>
            <select className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              <option value="Add">Add (Increase Stock)</option>
              <option value="Remove">Remove (Decrease Stock)</option>
            </select>
          </FormField>

          <FormField label="Quantity" required error={errors.qty} touched={touched.qty || submitted}
            hint={selectedItem ? `Current stock: ${selectedItem.currentStock} ${selectedItem.unit}${form.type === 'Add' ? ` → New: ${selectedItem.currentStock + Number(form.qty || 0)}` : ` → New: ${selectedItem.currentStock - Number(form.qty || 0)}`}` : undefined}>
            <input className="input" type="number" min="1" max={form.type === 'Remove' && selectedItem ? selectedItem.currentStock : 999999} value={form.qty} onChange={e => setForm({...form, qty: Number(e.target.value)})} onBlur={() => touch('qty')} />
          </FormField>

          <FormField label="Reason" required error={errors.reason} touched={touched.reason || submitted} hint="Why is this adjustment needed?">
            <input className="input" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} onBlur={() => touch('reason')} maxLength={200} placeholder="e.g. Damaged goods, Physical count adjustment, Expired stock" />
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
