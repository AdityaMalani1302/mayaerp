import React, { useState, useMemo } from 'react';
import { useAuth, ALL_MODULES, ALL_MODULE_KEYS, ROLE_TEMPLATES } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import FormField, { ErrorSummary } from '../common/FormField';
import { Plus, Edit2, Trash2, Shield, ShieldCheck, ShieldOff, Eye, EyeOff, UserCheck, UserX } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import { validators, validateForm } from '../../utils/validation';

const emptyUser = {
  username: '', password: '', fullName: '', email: '', phone: '',
  role: 'Salesperson', modules: [],
};

// Group modules by group name
const moduleGroups = ALL_MODULES.reduce((acc, mod) => {
  if (!acc[mod.group]) acc[mod.group] = [];
  acc[mod.group].push(mod);
  return acc;
}, {});

export default function UserManagement() {
  const { users, currentUser, addUser, updateUser, deleteUser } = useAuth();
  const askConfirm = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyUser);
  const [editing, setEditing] = useState(null);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [viewUser, setViewUser] = useState(null);

  const existingUsernames = useMemo(() =>
    users.map(u => ({ id: u.id, value: u.username })),
    [users]
  );

  const errors = useMemo(() => {
    const rules = {
      username: [
        validators.required(form.username, 'Username'),
        validators.minLength(form.username, 3, 'Username'),
        validators.maxLength(form.username, 30, 'Username'),
        form.username && !/^[a-zA-Z0-9._-]+$/.test(form.username) ? 'Only letters, numbers, dots, hyphens, underscores' : '',
        validators.unique(form.username, existingUsernames, 'Username', editing),
      ],
      fullName: [
        validators.required(form.fullName, 'Full name'),
        validators.minLength(form.fullName, 2, 'Full name'),
        validators.maxLength(form.fullName, 100, 'Full name'),
      ],
      email: [validators.email(form.email)],
      phone: [validators.phone(form.phone)],
    };

    // Password required for new users
    if (!editing) {
      rules.password = [
        validators.required(form.password, 'Password'),
        validators.minLength(form.password, 6, 'Password'),
        validators.maxLength(form.password, 50, 'Password'),
      ];
    } else if (form.password) {
      // If editing and password provided, validate it
      rules.password = [
        validators.minLength(form.password, 6, 'Password'),
      ];
    }

    // Modules check
    if (form.role !== 'Admin' && form.modules.length === 0) {
      rules.modules = ['At least one module must be selected'];
    }

    const { errors: e } = validateForm(rules);
    return e;
  }, [form, existingUsernames, editing]);

  const hasErrors = Object.values(errors).some(e => e);
  const touch = (field) => setTouched(prev => ({ ...prev, [field]: true }));

  const applyRoleTemplate = (role) => {
    const modules = ROLE_TEMPLATES[role] || [];
    setForm(prev => ({ ...prev, role, modules: [...modules] }));
  };

  const toggleModule = (key) => {
    setForm(prev => ({
      ...prev,
      modules: prev.modules.includes(key)
        ? prev.modules.filter(m => m !== key)
        : [...prev.modules, key],
    }));
  };

  const toggleGroup = (groupModules) => {
    const groupKeys = groupModules.map(m => m.key);
    const allSelected = groupKeys.every(k => form.modules.includes(k));
    if (allSelected) {
      setForm(prev => ({ ...prev, modules: prev.modules.filter(m => !groupKeys.includes(m)) }));
    } else {
      setForm(prev => ({ ...prev, modules: [...new Set([...prev.modules, ...groupKeys])] }));
    }
  };

  const selectAll = () => setForm(prev => ({ ...prev, modules: [...ALL_MODULE_KEYS] }));
  const deselectAll = () => setForm(prev => ({ ...prev, modules: [] }));

  const handleSave = () => {
    setSubmitted(true);
    const allTouched = {};
    Object.keys(errors).forEach(k => { allTouched[k] = true; });
    setTouched(allTouched);
    if (hasErrors) return;

    if (editing) {
      const payload = { ...form };
      // Don't update password if empty (keep old)
      if (!payload.password) delete payload.password;
      const result = updateUser(editing, payload);
      if (!result.success) { alert(result.error); return; }
    } else {
      const result = addUser(form);
      if (!result.success) { alert(result.error); return; }
    }
    closeForm();
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyUser);
    setEditing(null);
    setTouched({});
    setSubmitted(false);
    setShowPassword(false);
  };

  const handleEdit = (user) => {
    setForm({
      username: user.username,
      password: '', // Don't pre-fill password
      fullName: user.fullName,
      email: user.email || '',
      phone: user.phone || '',
      role: user.role,
      modules: [...(user.modules || [])],
    });
    setEditing(user.id);
    setTouched({});
    setSubmitted(false);
    setShowForm(true);
  };

  const handleDelete = async (user) => {
    if (user.id === 'admin-default') {
      alert('Cannot delete the default admin account');
      return;
    }
    if (user.id === currentUser?.id) {
      alert('Cannot delete your own account while logged in');
      return;
    }
    const ok = await askConfirm(`Delete user "${user.fullName}" (${user.username})? This cannot be undone.`, { title: 'Delete User', variant: 'danger', confirmLabel: 'Delete' });
    if (ok) {
      const result = deleteUser(user.id);
      if (!result.success) alert(result.error);
    }
  };

  const handleToggleActive = (user) => {
    if (user.id === 'admin-default') {
      alert('Cannot deactivate the default admin account');
      return;
    }
    const result = updateUser(user.id, { isActive: !user.isActive });
    if (!result.success) alert(result.error);
  };

  const columns = [
    { key: 'fullName', label: 'Name', sortable: true, render: (v, row) => (
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${row.isActive ? 'bg-blue-500' : 'bg-gray-400'}`}>
          {v?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div>
          <p className="font-medium text-gray-900">{v}</p>
          <p className="text-xs text-gray-500">@{row.username}</p>
        </div>
      </div>
    )},
    { key: 'role', label: 'Role', sortable: true, render: (v) => {
      const colors = { Admin: 'badge-danger', Accountant: 'badge-info', Salesperson: 'badge-success', Viewer: 'badge-gray', 'Purchase Manager': 'badge-warning', 'Inventory Manager': 'badge-warning' };
      return <span className={`badge ${colors[v] || 'badge-gray'}`}>{v}</span>;
    }},
    { key: 'email', label: 'Email' },
    { key: 'modules', label: 'Modules', render: (v) => (
      <span className="text-xs text-gray-500">{v?.length || 0} of {ALL_MODULE_KEYS.length}</span>
    )},
    { key: 'isActive', label: 'Status', render: (v) => (
      <span className={`badge ${v ? 'badge-success' : 'badge-danger'}`}>{v ? 'Active' : 'Inactive'}</span>
    )},
    { key: 'lastLogin', label: 'Last Login', render: (v) => v ? formatDate(v) : <span className="text-gray-400">Never</span> },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Create users and control their access to different modules</p>
        </div>
        <button onClick={() => { setForm(emptyUser); setEditing(null); setTouched({}); setSubmitted(false); setShowForm(true); }} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card !p-4">
          <p className="text-xs text-gray-500">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
        </div>
        <div className="card !p-4">
          <p className="text-xs text-gray-500">Active</p>
          <p className="text-2xl font-bold text-emerald-600">{users.filter(u => u.isActive).length}</p>
        </div>
        <div className="card !p-4">
          <p className="text-xs text-gray-500">Inactive</p>
          <p className="text-2xl font-bold text-red-600">{users.filter(u => !u.isActive).length}</p>
        </div>
        <div className="card !p-4">
          <p className="text-xs text-gray-500">Admins</p>
          <p className="text-2xl font-bold text-blue-600">{users.filter(u => u.role === 'Admin').length}</p>
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={users}
          searchFields={['fullName', 'username', 'email', 'role']}
          actions={(row) => (
            <>
              <button onClick={() => setViewUser(row)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="View"><Eye size={15} /></button>
              <button onClick={() => handleEdit(row)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Edit"><Edit2 size={15} /></button>
              <button onClick={() => handleToggleActive(row)} className={`p-1.5 rounded ${row.isActive ? 'hover:bg-amber-50 text-amber-600' : 'hover:bg-green-50 text-green-600'}`} title={row.isActive ? 'Deactivate' : 'Activate'}>
                {row.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
              </button>
              {row.id !== 'admin-default' && (
                <button onClick={() => handleDelete(row)} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Delete"><Trash2 size={15} /></button>
              )}
            </>
          )}
        />
      </div>

      {/* ─── Create / Edit User Modal ─── */}
      <Modal isOpen={showForm} onClose={closeForm} title={editing ? 'Edit User' : 'Create New User'} size="xl">
        <ErrorSummary errors={errors} show={submitted && hasErrors} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: User Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 pb-2 border-b">
              <Shield size={16} className="text-blue-600" /> Account Details
            </h3>

            <FormField label="Full Name" required error={errors.fullName} touched={touched.fullName || submitted}>
              <input className="input" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} onBlur={() => touch('fullName')} maxLength={100} placeholder="e.g. Rajesh Kumar" autoFocus />
            </FormField>

            <FormField label="Username" required error={errors.username} touched={touched.username || submitted} hint="Letters, numbers, dots, hyphens only">
              <input className="input font-mono" value={form.username} onChange={e => setForm({...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '')})} onBlur={() => touch('username')} maxLength={30} placeholder="e.g. rajesh.kumar" disabled={editing === 'admin-default'} />
            </FormField>

            <FormField label={editing ? 'New Password (leave blank to keep current)' : 'Password'} required={!editing} error={errors.password} touched={touched.password || submitted} hint={editing ? 'Leave empty to keep existing password' : 'Minimum 6 characters'}>
              <div className="relative">
                <input className="input pr-10" type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({...form, password: e.target.value})} onBlur={() => touch('password')} maxLength={50} placeholder={editing ? 'Enter new password (optional)' : 'Enter password'} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FormField>

            <FormField label="Email" error={errors.email} touched={touched.email || submitted}>
              <input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} onBlur={() => touch('email')} maxLength={100} placeholder="user@company.com" />
            </FormField>

            <FormField label="Phone" error={errors.phone} touched={touched.phone || submitted}>
              <input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value.replace(/[^0-9+\-\s]/g, '')})} onBlur={() => touch('phone')} maxLength={15} placeholder="9876543210" />
            </FormField>

            <FormField label="Role" required>
              <select className="input" value={form.role} onChange={e => applyRoleTemplate(e.target.value)} disabled={editing === 'admin-default'}>
                {Object.keys(ROLE_TEMPLATES).map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
                <option value="Custom">Custom</option>
              </select>
              <p className="mt-1 text-xs text-gray-400">
                {form.role === 'Admin' ? 'Full access to all modules' :
                 form.role === 'Custom' ? 'Select modules manually below' :
                 `Pre-configured access for ${form.role} role`}
              </p>
            </FormField>
          </div>

          {/* Right: Module Access */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <ShieldCheck size={16} className="text-blue-600" /> Module Access
                <span className="text-xs font-normal text-gray-400">({form.modules.length}/{ALL_MODULE_KEYS.length})</span>
              </h3>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-xs text-blue-600 hover:text-blue-700">Select All</button>
                <span className="text-gray-300">|</span>
                <button onClick={deselectAll} className="text-xs text-gray-500 hover:text-gray-700">Deselect All</button>
              </div>
            </div>

            {form.role === 'Admin' ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-700 flex items-center gap-2">
                <ShieldCheck size={18} />
                Admin role has full access to all modules. Module selection is disabled.
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {submitted && errors.modules && (
                  <p className="text-red-600 text-xs flex items-center gap-1">
                    <ShieldOff size={14} /> {errors.modules}
                  </p>
                )}
                {Object.entries(moduleGroups).map(([group, modules]) => {
                  const groupKeys = modules.map(m => m.key);
                  const selectedCount = groupKeys.filter(k => form.modules.includes(k)).length;
                  const allSelected = selectedCount === groupKeys.length;
                  const someSelected = selectedCount > 0 && !allSelected;

                  return (
                    <div key={group} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleGroup(modules)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={el => { if (el) el.indeterminate = someSelected; }}
                            onChange={() => {}}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">{group}</span>
                        </div>
                        <span className="text-xs text-gray-400">{selectedCount}/{modules.length}</span>
                      </button>
                      <div className="px-3 py-2 grid grid-cols-1 gap-1">
                        {modules.map(mod => (
                          <label key={mod.key} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.modules.includes(mod.key)}
                              onChange={() => toggleModule(mod.key)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-600">{mod.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={closeForm} className="btn btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn btn-primary" disabled={submitted && hasErrors}>
            {editing ? 'Update User' : 'Create User'}
          </button>
        </div>
      </Modal>

      {/* ─── View User Modal ─── */}
      <Modal isOpen={!!viewUser} onClose={() => setViewUser(null)} title={`User Details: ${viewUser?.fullName}`} size="lg">
        {viewUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white ${viewUser.isActive ? 'bg-blue-500' : 'bg-gray-400'}`}>
                {viewUser.fullName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{viewUser.fullName}</h3>
                <p className="text-sm text-gray-500">@{viewUser.username}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`badge ${viewUser.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {viewUser.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="badge badge-info">{viewUser.role}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Email:</span> {viewUser.email || '-'}</div>
              <div><span className="text-gray-500">Phone:</span> {viewUser.phone || '-'}</div>
              <div><span className="text-gray-500">Created:</span> {formatDate(viewUser.createdAt)}</div>
              <div><span className="text-gray-500">Last Login:</span> {viewUser.lastLogin ? formatDate(viewUser.lastLogin) : 'Never'}</div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Module Access ({viewUser.modules?.length || 0} modules)</h4>
              <div className="grid grid-cols-2 gap-1">
                {ALL_MODULES.map(mod => {
                  const hasAccess = viewUser.role === 'Admin' || viewUser.modules?.includes(mod.key);
                  return (
                    <div key={mod.key} className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${hasAccess ? 'text-emerald-700 bg-emerald-50' : 'text-gray-400 bg-gray-50'}`}>
                      {hasAccess ? <ShieldCheck size={12} /> : <ShieldOff size={12} />}
                      {mod.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
