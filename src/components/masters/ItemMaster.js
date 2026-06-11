import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import FormField, { ErrorSummary } from '../common/FormField';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { validators, validateForm, isItemReferenced } from '../../utils/validation';

const emptyItem = { name: '', category: '', unit: 'pcs', hsnCode: '', purchaseRate: 0, saleRate: 0, openingStock: 0, taxPercent: 18, reorderLevel: 10 };

export default function ItemMaster() {
  const { state, dispatch } = useApp();
  const { addToast } = useToast();
  const confirm = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyItem);
  const [editing, setEditing] = useState(null);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const existingNames = useMemo(() =>
    state.items.map(i => ({ id: i.id, value: i.name })),
    [state.items]
  );

  const errors = useMemo(() => {
    const { errors } = validateForm({
      name: [
        validators.required(form.name, 'Item name'),
        validators.minLength(form.name, 2, 'Item name'),
        validators.maxLength(form.name, 150, 'Item name'),
        validators.unique(form.name, existingNames, 'Item name', editing),
      ],
      category: [validators.required(form.category, 'Category')],
      hsnCode: [validators.hsnCode(form.hsnCode)],
      purchaseRate: [
        validators.positiveNumber(form.purchaseRate, 'Purchase rate'),
      ],
      saleRate: [
        validators.positiveNumber(form.saleRate, 'Sale rate'),
        form.saleRate > 0 && form.purchaseRate > 0 && form.saleRate < form.purchaseRate
          ? 'Sale rate is lower than purchase rate (margin will be negative)'
          : '',
      ],
      openingStock: [
        validators.positiveNumber(form.openingStock, 'Opening stock'),
        validators.maxValue(form.openingStock, 999999, 'Opening stock'),
      ],
      reorderLevel: [
        validators.positiveNumber(form.reorderLevel, 'Reorder level'),
      ],
    });
    return errors;
  }, [form, existingNames, editing]);

  // sale rate warning is not blocking — only actual errors prevent save
  const hasBlockingErrors = Object.entries(errors).some(([key, e]) => e && !(key === 'saleRate' && e.includes('margin')));

  const touch = (field) => setTouched(prev => ({ ...prev, [field]: true }));
  const touchAll = () => {
    const all = {};
    Object.keys(errors).forEach(k => { all[k] = true; });
    setTouched(all);
  };

  const handleSave = () => {
    setSubmitted(true);
    touchAll();
    if (hasBlockingErrors) return;
    if (editing) {
      dispatch({ type: 'UPDATE_ITEM', payload: { ...form, id: editing } });
      addToast('Item updated successfully', 'success');
    } else {
      dispatch({ type: 'ADD_ITEM', payload: form });
      addToast('Item created successfully', 'success');
    }
    closeForm();
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyItem);
    setEditing(null);
    setTouched({});
    setSubmitted(false);
  };

  const handleEdit = (item) => {
    setForm(item);
    setEditing(item.id);
    setTouched({});
    setSubmitted(false);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const refs = isItemReferenced(id, state);
    if (refs.length > 0) {
      alert(`Cannot delete: this item is referenced in ${refs.join(', ')}`);
      return;
    }
    const ok = await confirm('Delete this item? This action cannot be undone.', { title: 'Delete Item', variant: 'danger', confirmLabel: 'Delete' });
    if (ok) {
      dispatch({ type: 'DELETE_ITEM', payload: id });
      addToast('Item deleted', 'success');
    }
  };

  const columns = [
    { key: 'name', label: 'Item Name', sortable: true },
    { key: 'category', label: 'Category', sortable: true, render: (v) => <span className="badge badge-gray">{v}</span> },
    { key: 'unit', label: 'Unit' },
    { key: 'hsnCode', label: 'HSN' },
    { key: 'purchaseRate', label: 'Pur. Rate', align: 'right', render: (v) => formatCurrency(v) },
    { key: 'saleRate', label: 'Sale Rate', align: 'right', render: (v) => formatCurrency(v) },
    { key: 'currentStock', label: 'Stock', align: 'right', sortable: true, render: (v, row) => (
      <span className={v <= (row.reorderLevel || 0) ? 'text-red-600 font-semibold' : ''}>{v} {row.unit}</span>
    )},
    { key: 'taxPercent', label: 'GST%', render: (v) => `${v}%` },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Item / Product Master</h1>
        <button onClick={() => { setForm(emptyItem); setEditing(null); setTouched({}); setSubmitted(false); setShowForm(true); }} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Item
        </button>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={state.items}
          searchFields={['name', 'category', 'hsnCode']}
          emptyState={{ title: 'No items yet', description: 'Add your first item or product.', actionLabel: 'Add Item', onAction: () => { setForm(emptyItem); setEditing(null); setTouched({}); setSubmitted(false); setShowForm(true); } }}
          actions={(row) => (
            <>
              <button onClick={() => handleEdit(row)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Edit"><Edit2 size={15} /></button>
              <button onClick={() => handleDelete(row.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Delete"><Trash2 size={15} /></button>
            </>
          )}
        />
      </div>

      <Modal isOpen={showForm} onClose={closeForm} title={editing ? 'Edit Item' : 'Add Item'} size="lg">
        <ErrorSummary errors={errors} show={submitted && hasBlockingErrors} />

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Item Name" required error={errors.name} touched={touched.name || submitted} className="col-span-2">
            <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} onBlur={() => touch('name')} autoFocus maxLength={150} placeholder="Enter item name" />
          </FormField>

          <FormField label="Category" required error={errors.category} touched={touched.category || submitted}>
            <input className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})} onBlur={() => touch('category')} list="categories" placeholder="e.g. Electronics, FMCG" />
            <datalist id="categories">
              {[...new Set(state.items.map(i => i.category).filter(Boolean))].map(c => <option key={c} value={c} />)}
            </datalist>
          </FormField>

          <FormField label="Unit" required>
            <select className="input" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
              <option value="pcs">Pcs</option>
              <option value="kg">Kg</option>
              <option value="ltr">Ltr</option>
              <option value="mtr">Mtr</option>
              <option value="box">Box</option>
              <option value="nos">Nos</option>
            </select>
          </FormField>

          <FormField label="HSN Code" error={errors.hsnCode} touched={touched.hsnCode || submitted} hint="4-8 digit code">
            <input className="input" value={form.hsnCode} onChange={e => setForm({...form, hsnCode: e.target.value.replace(/\D/g, '')})} onBlur={() => touch('hsnCode')} maxLength={8} placeholder="e.g. 8517" />
          </FormField>

          <FormField label="Tax %" required>
            <select className="input" value={form.taxPercent} onChange={e => setForm({...form, taxPercent: Number(e.target.value)})}>
              {state.taxes.map(t => <option key={t.id} value={t.rate}>{t.name}</option>)}
            </select>
          </FormField>

          <FormField label="Purchase Rate" error={errors.purchaseRate} touched={touched.purchaseRate || submitted}>
            <input className="input" type="number" min="0" step="0.01" value={form.purchaseRate} onChange={e => setForm({...form, purchaseRate: Number(e.target.value)})} onBlur={() => touch('purchaseRate')} />
          </FormField>

          <FormField label="Sale Rate" error={errors.saleRate} touched={touched.saleRate || submitted}>
            <input className="input" type="number" min="0" step="0.01" value={form.saleRate} onChange={e => setForm({...form, saleRate: Number(e.target.value)})} onBlur={() => touch('saleRate')} />
            {(touched.saleRate || submitted) && errors.saleRate && errors.saleRate.includes('margin') && (
              <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                {errors.saleRate}
              </p>
            )}
          </FormField>

          <FormField label="Opening Stock" error={errors.openingStock} touched={touched.openingStock || submitted}>
            <input className="input" type="number" min="0" max="999999" value={form.openingStock} onChange={e => setForm({...form, openingStock: Number(e.target.value)})} onBlur={() => touch('openingStock')} />
          </FormField>

          <FormField label="Reorder Level" error={errors.reorderLevel} touched={touched.reorderLevel || submitted} hint="Alert when stock falls below">
            <input className="input" type="number" min="0" value={form.reorderLevel} onChange={e => setForm({...form, reorderLevel: Number(e.target.value)})} onBlur={() => touch('reorderLevel')} />
          </FormField>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={closeForm} className="btn btn-secondary">Cancel</button>
          <button data-keyboard-save onClick={handleSave} className="btn btn-primary" disabled={submitted && hasBlockingErrors}>
            {editing ? 'Update' : 'Save'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
