import React from 'react';
import { Inbox, Plus } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 rounded-full bg-gray-100 mb-4">
        <Icon size={40} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 text-center max-w-sm mb-6">{description}</p>
      )}
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn btn-primary inline-flex items-center gap-2">
          <Plus size={16} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
