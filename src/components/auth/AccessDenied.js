import React from 'react';
import { ShieldOff } from 'lucide-react';

export default function AccessDenied({ onGoHome }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="bg-red-100 rounded-full p-6 mb-6">
        <ShieldOff size={48} className="text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
      <p className="text-gray-500 text-center max-w-md mb-6">
        You don't have permission to access this module. Please contact your administrator to request access.
      </p>
      <button onClick={onGoHome} className="btn btn-primary">
        Go to Dashboard
      </button>
    </div>
  );
}
