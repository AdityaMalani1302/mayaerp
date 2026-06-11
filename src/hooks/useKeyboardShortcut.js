import { useEffect } from 'react';

export function useKeyboardShortcut(key, callback, { ctrl = false, meta = false, shift = false, enabled = true } = {}) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e) => {
      const matchCtrl = ctrl ? (e.ctrlKey || e.metaKey) : true;
      const matchMeta = meta ? e.metaKey : true;
      const matchShift = shift ? e.shiftKey : true;
      const matchKey = e.key.toLowerCase() === key.toLowerCase();
      if (matchKey && matchCtrl && matchMeta && matchShift) {
        e.preventDefault();
        e.stopPropagation();
        callback(e);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [key, callback, ctrl, meta, shift, enabled]);
}
