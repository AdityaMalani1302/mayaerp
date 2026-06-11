import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Package, Users, FileText, X, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function GlobalSearch({ isOpen, onClose, onNavigate }) {
  const { state } = useApp();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const out = [];

    state.items?.forEach(item => {
      if (item.name.toLowerCase().includes(q) || (item.hsnCode || '').toLowerCase().includes(q)) {
        out.push({ ...item, _type: 'Item', _page: 'items', _icon: Package, _sub: `${item.category} · Stock: ${item.currentStock} ${item.unit}` });
      }
    });

    state.parties?.forEach(p => {
      if (p.name.toLowerCase().includes(q) || (p.gstin || '').includes(q) || (p.phone || '').includes(q)) {
        out.push({ ...p, _type: 'Party', _page: 'parties', _icon: Users, _sub: `${p.type} · ${p.state}` });
      }
    });

    state.salesInvoices?.forEach(inv => {
      const partyName = state.parties.find(p => p.id === inv.partyId)?.name || '';
      if (inv.invoiceNo.toLowerCase().includes(q) || partyName.toLowerCase().includes(q)) {
        out.push({ ...inv, _type: 'Invoice', _page: 'sales', _icon: FileText, _sub: `${partyName} · ${inv.grandTotal?.toLocaleString('en-IN')}` });
      }
    });

    state.purchaseBills?.forEach(b => {
      const partyName = state.parties.find(p => p.id === b.partyId)?.name || '';
      if (b.entryNo?.toLowerCase().includes(q) || b.billNo?.toLowerCase().includes(q) || partyName.toLowerCase().includes(q)) {
        out.push({ ...b, _type: 'Purchase Bill', _page: 'purchase', _icon: FileText, _sub: `${partyName} · ${b.grandTotal?.toLocaleString('en-IN')}` });
      }
    });

    return out.slice(0, 20);
  }, [query, state]);

  const handleSelect = (item) => {
    onNavigate(item._page);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-start justify-center pt-[15vh]" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-xl mx-4 bg-white rounded-xl shadow-modal-shadow overflow-hidden animate-scale-in">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search items, parties, invoices..."
            className="flex-1 border-0 outline-none text-sm bg-transparent placeholder:text-gray-400"
          />
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
          <span className="hidden sm:inline text-[10px] font-medium text-gray-400 uppercase bg-gray-100 px-1.5 py-0.5 rounded">Esc</span>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {results.length === 0 && query.trim() && (
            <div className="p-8 text-center text-sm text-gray-400">
              No results found for "{query}"
            </div>
          )}
          {results.map((item, i) => {
            const Icon = item._icon;
            return (
              <button
                key={`${item._type}-${item.id || i}`}
                onClick={() => handleSelect(item)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-brand-50 text-left transition-colors border-b border-gray-50 last:border-0"
              >
                <div className="p-1.5 rounded-lg bg-gray-100 text-gray-500">
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name || item.invoiceNo || item.entryNo}</p>
                  <p className="text-xs text-gray-400 truncate">{item._sub}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-medium text-gray-400 uppercase">{item._type}</span>
                  <ArrowRight size={12} className="text-gray-300" />
                </div>
              </button>
            );
          })}
          {query.trim() && results.length > 0 && (
            <div className="px-4 py-2 text-[10px] text-gray-400 text-center border-t border-gray-100">
              {results.length} result{results.length !== 1 ? 's' : ''} · Press Esc to close
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
