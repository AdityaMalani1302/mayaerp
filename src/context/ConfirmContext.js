import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmContext = createContext(null);

const variantStyles = {
  danger: { icon: AlertTriangle, iconColor: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', btn: 'btn-danger', title: 'text-red-700' },
  warning: { icon: AlertTriangle, iconColor: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', btn: 'btn-warning', title: 'text-amber-700' },
  default: { icon: AlertTriangle, iconColor: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', btn: 'btn-primary', title: 'text-blue-700' },
};

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setState({ message, resolve, ...options });
    });
  }, []);

  const handleConfirm = () => {
    state?.resolve(true);
    setState(null);
  };

  const handleCancel = () => {
    state?.resolve(false);
    setState(null);
  };

  const vs = variantStyles[state?.variant] || variantStyles.default;
  const Icon = vs.icon;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && handleCancel()}>
          <div className="fixed inset-0 bg-black/40" />
          <div className="relative bg-white rounded-xl shadow-modal-shadow max-w-md w-full p-6 animate-scale-in">
            <button onClick={handleCancel} className="absolute top-4 right-4 p-1 rounded hover:bg-gray-100 text-gray-400">
              <X size={16} />
            </button>
            <div className="flex gap-4">
              <div className={`p-2 rounded-full ${vs.bg} shrink-0`}>
                <Icon size={22} className={vs.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                {state.title && <h3 className={`text-base font-semibold mb-1 ${vs.title}`}>{state.title}</h3>}
                <p className="text-sm text-gray-600">{state.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button onClick={handleCancel} className="btn btn-secondary">
                {state.cancelLabel || 'Cancel'}
              </button>
              <button onClick={handleConfirm} className={vs.btn}>
                {state.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
