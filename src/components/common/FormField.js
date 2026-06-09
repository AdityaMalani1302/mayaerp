import React from 'react';

export default function FormField({ label, required, error, touched, children, hint, className = '' }) {
  const showError = touched && error;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className={showError ? '[&>input]:border-red-400 [&>input]:focus:ring-red-400 [&>select]:border-red-400 [&>select]:focus:ring-red-400 [&>textarea]:border-red-400 [&>textarea]:focus:ring-red-400' : ''}>
        {children}
      </div>
      {showError && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {hint && !showError && (
        <p className="mt-1 text-xs text-gray-400">{hint}</p>
      )}
    </div>
  );
}

// Error summary banner for top of form
export function ErrorSummary({ errors, show }) {
  if (!show) return null;
  const errorList = Object.entries(errors).filter(([, v]) => v);
  if (errorList.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-semibold text-red-800">
          Please fix {errorList.length} error{errorList.length > 1 ? 's' : ''} before saving
        </span>
      </div>
      <ul className="list-disc list-inside text-xs text-red-700 space-y-0.5 ml-7">
        {errorList.map(([, msg]) => (
          <li key={msg}>{msg}</li>
        ))}
      </ul>
    </div>
  );
}
