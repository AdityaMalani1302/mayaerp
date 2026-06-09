import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import FormField, { ErrorSummary } from '../common/FormField';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { validators, validateForm, isPartyReferenced } from '../../utils/validation';

const emptyParty = { name: '', type: 'Customer', gstin: '', phone: '', email: '', address: '', state: 'Maharashtra', openingBalance: 0, balanceType: 'Dr' };

export default function PartyMaster() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyParty);
  const [editing, setEditing] = useState(null);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const existingNames = useMemo(() =>
    state.parties.map(p => ({ id: p.id, value: p.name })),
    [state.parties]
  );

  const existingGstins = useMemo(() =>
    state.parties.filter(p => p.gstin).map(p => ({ id: p.id, value: p.gstin })),
    [state.parties]
  );

  const errors = useMemo(() => {
    const { errors } = validateForm({
      name: [
        validators.required(form.name, 'Party name'),
        validators.minLength(form.name, 2, 'Party name'),
        validators.maxLength(form.name, 100, 'Party name'),
        validators.unique(form.name, existingNames, 'Party name', editing),
      ],
      gstin: [
        validators.gstin(form.gstin),
        form.gstin ? validators.unique(form.gstin.toUpperCase(), existingGstins, 'GSTIN', editing) : '',
      ],
      phone: [validators.phone(form.phone)],
      email: [validators.email(form.email)],
      state: [validators.required(form.state, 'State')],
      address: [validators.maxLength(form.address, 500, 'Address')],
      openingBalance: [validators.positiveNumber(form.openingBalance, 'Opening balance')],
    });
    return errors;
  }, [form, existingNames, existingGstins, editing]);

  const hasErrors = Object.values(errors).some(e => e);

  const touch = (field) => setTouched(prev => ({ ...prev, [field]: true }));
  const touchAll = () => {
    const all = {};
    Object.keys(errors).forEach(k => { all[k] = true; });
    setTouched(all);
  };

  const handleSave = () => {
    setSubmitted(true);
    touchAll();
    if (hasErrors) return;
    if (editing) {
      dispatch({ type: 'UPDATE_PARTY', payload: { ...form, id: editing } });
    } else {
      dispatch({ type: 'ADD_PARTY', payload: form });
    }
    closeForm();
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyParty);
    setEditing(null);
    setTouched({});
    setSubmitted(false);
  };

  const handleEdit = (party) => {
    setForm(party);
    setEditing(party.id);
    setTouched({});
    setSubmitted(false);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    const refs = isPartyReferenced(id, state);
    if (refs.length > 0) {
      alert(`Cannot delete: this party is referenced in ${refs.join(', ')}`);
      return;
    }
    if (window.confirm('Are you sure you want to delete this party? This action cannot be undone.')) {
      dispatch({ type: 'DELETE_PARTY', payload: id });
    }
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'type', label: 'Type', sortable: true, render: (v) => (
      <span className={`badge ${v === 'Customer' ? 'badge-success' : v === 'Supplier' ? 'badge-info' : 'badge-warning'}`}>{v}</span>
    )},
    { key: 'gstin', label: 'GSTIN' },
    { key: 'phone', label: 'Phone' },
    { key: 'state', label: 'State' },
    { key: 'openingBalance', label: 'Opening Bal', align: 'right', render: (v, row) => (
      <span className={row.balanceType === 'Dr' ? 'text-red-600' : 'text-green-600'}>
        {formatCurrency(v)} {row.balanceType}
      </span>
    )},
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Party Master</h1>
        <button onClick={() => { setForm(emptyParty); setEditing(null); setTouched({}); setSubmitted(false); setShowForm(true); }} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Party
        </button>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={state.parties}
          searchFields={['name', 'gstin', 'phone', 'type']}
          actions={(row) => (
            <>
              <button onClick={() => handleEdit(row)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Edit"><Edit2 size={15} /></button>
              <button onClick={() => handleDelete(row.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Delete"><Trash2 size={15} /></button>
            </>
          )}
        />
      </div>

      <Modal isOpen={showForm} onClose={closeForm} title={editing ? 'Edit Party' : 'Add Party'} size="lg">
        <ErrorSummary errors={errors} show={submitted && hasErrors} />

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Party Name" required error={errors.name} touched={touched.name || submitted} className="col-span-2">
            <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} onBlur={() => touch('name')} autoFocus maxLength={100} placeholder="Enter party name" />
          </FormField>

          <FormField label="Type" required>
            <select className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              <option>Customer</option>
              <option>Supplier</option>
              <option>Both</option>
            </select>
          </FormField>

          <FormField label="GSTIN" error={errors.gstin} touched={touched.gstin || submitted} hint="Format: 27AADCA1234B1Z5">
            <input className="input" value={form.gstin} onChange={e => setForm({...form, gstin: e.target.value.toUpperCase()})} onBlur={() => touch('gstin')} maxLength={15} placeholder="27XXXXX1234X1Z5" style={{ textTransform: 'uppercase' }} />
          </FormField>

          <FormField label="Phone" error={errors.phone} touched={touched.phone || submitted}>
            <input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value.replace(/[^0-9+\-\s()]/g, '')})} onBlur={() => touch('phone')} maxLength={15} placeholder="9876543210" />
          </FormField>

          <FormField label="Email" error={errors.email} touched={touched.email || submitted}>
            <input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} onBlur={() => touch('email')} maxLength={100} placeholder="email@example.com" />
          </FormField>

          <FormField label="State" required error={errors.state} touched={touched.state || submitted}>
            <select className="input" value={form.state} onChange={e => setForm({...form, state: e.target.value})} onBlur={() => touch('state')}>
              <option value="">-- Select State --</option>
              {['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Jammu & Kashmir','Ladakh','Chandigarh','Puducherry','Lakshadweep','Andaman & Nicobar','Dadra & Nagar Haveli'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Address" error={errors.address} touched={touched.address || submitted} className="col-span-2">
            <textarea className="input" rows={2} value={form.address} onChange={e => setForm({...form, address: e.target.value})} onBlur={() => touch('address')} maxLength={500} placeholder="Full address" />
          </FormField>

          <FormField label="Opening Balance" error={errors.openingBalance} touched={touched.openingBalance || submitted}>
            <input className="input" type="number" min="0" step="0.01" value={form.openingBalance} onChange={e => setForm({...form, openingBalance: Number(e.target.value)})} onBlur={() => touch('openingBalance')} />
          </FormField>

          <FormField label="Balance Type">
            <select className="input" value={form.balanceType} onChange={e => setForm({...form, balanceType: e.target.value})}>
              <option value="Dr">Debit (Dr) - They Owe Us</option>
              <option value="Cr">Credit (Cr) - We Owe Them</option>
            </select>
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
