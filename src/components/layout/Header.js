import React, { useState, useRef, useEffect } from 'react';
import { Building2, Calendar, User, LogOut, ChevronDown, Shield, Key } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';

export default function Header({ onNavigate }) {
  const { state, dispatch, resetData } = useApp();
  const { currentUser, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const menuRef = useRef(null);
  const { updateUser } = useAuth();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
    }
  };

  const handleChangePassword = () => {
    setPwError('');
    if (!passwords.current) { setPwError('Current password is required'); return; }
    if (passwords.current !== currentUser.password) { setPwError('Current password is incorrect'); return; }
    if (!passwords.newPass) { setPwError('New password is required'); return; }
    if (passwords.newPass.length < 6) { setPwError('New password must be at least 6 characters'); return; }
    if (passwords.newPass !== passwords.confirm) { setPwError('Passwords do not match'); return; }
    if (passwords.current === passwords.newPass) { setPwError('New password must be different from current'); return; }

    const result = updateUser(currentUser.id, { password: passwords.newPass });
    if (result.success) {
      setPwSuccess(true);
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswords({ current: '', newPass: '', confirm: '' });
        setPwSuccess(false);
      }, 1500);
    } else {
      setPwError(result.error);
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between no-print">
        <button
          onClick={() => onNavigate?.('business-profile')}
          className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-2 py-1 -ml-2 transition-colors group"
          title="Edit Business Profile"
        >
          {state.company.logo ? (
            <img src={state.company.logo} alt="Logo" className="w-9 h-9 object-contain rounded" />
          ) : (
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Building2 size={20} className="text-blue-600" />
            </div>
          )}
          <div className="text-left">
            <h1 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{state.company.name}</h1>
            <p className="text-xs text-gray-500">
              {[state.company.city, state.company.state].filter(Boolean).join(', ') || state.company.address}
              {state.company.gstin && <span className="ml-2 text-gray-400">| GSTIN: {state.company.gstin}</span>}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={16} />
            <span>FY {state.company.financialYear}</span>
          </div>

          {/* User dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {currentUser?.fullName?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-gray-700">{currentUser?.fullName || 'Admin'}</p>
                <p className="text-[10px] text-gray-400">{currentUser?.role || 'Admin'}</p>
              </div>
              <ChevronDown size={14} className="text-gray-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{currentUser?.fullName}</p>
                  <p className="text-xs text-gray-500">@{currentUser?.username}</p>
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    <Shield size={10} /> {currentUser?.role}
                  </span>
                </div>

                <button
                  onClick={() => { setShowUserMenu(false); setShowChangePassword(true); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Key size={16} className="text-gray-400" /> Change Password
                </button>

                {currentUser?.role === 'Admin' && (
                  <button
                    onClick={() => { setShowUserMenu(false); onNavigate?.('user-management'); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User size={16} className="text-gray-400" /> User Management
                  </button>
                )}

                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={() => {
                      if (window.confirm('Reset all data to defaults?')) {
                        resetData();
                        window.location.reload();
                      }
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Reset Data
                  </button>
                  <button
                    onClick={() => { setShowUserMenu(false); handleLogout(); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      <Modal isOpen={showChangePassword} onClose={() => { setShowChangePassword(false); setPasswords({ current: '', newPass: '', confirm: '' }); setPwError(''); setPwSuccess(false); }} title="Change Password">
        {pwSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-lg font-semibold text-gray-900">Password Changed!</p>
            <p className="text-sm text-gray-500">Your password has been updated successfully.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pwError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{pwError}</div>
            )}
            <div>
              <label className="label">Current Password *</label>
              <input className="input" type="password" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} autoFocus />
            </div>
            <div>
              <label className="label">New Password *</label>
              <input className="input" type="password" value={passwords.newPass} onChange={e => setPasswords({...passwords, newPass: e.target.value})} placeholder="Minimum 6 characters" />
            </div>
            <div>
              <label className="label">Confirm New Password *</label>
              <input className="input" type="password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { setShowChangePassword(false); setPasswords({ current: '', newPass: '', confirm: '' }); setPwError(''); }} className="btn btn-secondary">Cancel</button>
              <button onClick={handleChangePassword} className="btn btn-primary">Change Password</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
