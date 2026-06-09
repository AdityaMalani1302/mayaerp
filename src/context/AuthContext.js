import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { isSupabaseConfigured, loadAuthData, saveAuthData } from '../supabase/dbService';

const AuthContext = createContext();

const AUTH_STORAGE_KEY = 'erp_auth_data';
const SESSION_KEY = 'erp_session';

export const ALL_MODULES = [
  { key: 'dashboard', label: 'Dashboard', group: 'General' },
  { key: 'business-profile', label: 'Business Profile', group: 'General' },
  { key: 'parties', label: 'Party Master', group: 'Masters' },
  { key: 'items', label: 'Item Master', group: 'Masters' },
  { key: 'accounts', label: 'Account Master', group: 'Masters' },
  { key: 'taxes', label: 'Tax Master', group: 'Masters' },
  { key: 'sales-invoice', label: 'Sales Invoice', group: 'Sales' },
  { key: 'sales-return', label: 'Sales Return', group: 'Sales' },
  { key: 'delivery-challan', label: 'Delivery Challan', group: 'Sales' },
  { key: 'sales-order', label: 'Sales Order', group: 'Sales' },
  { key: 'purchase-bill', label: 'Purchase Bill', group: 'Purchase' },
  { key: 'purchase-return', label: 'Purchase Return', group: 'Purchase' },
  { key: 'purchase-order', label: 'Purchase Order', group: 'Purchase' },
  { key: 'stock-summary', label: 'Stock Summary', group: 'Inventory' },
  { key: 'stock-ledger', label: 'Stock Ledger', group: 'Inventory' },
  { key: 'stock-journal', label: 'Stock Journal', group: 'Inventory' },
  { key: 'low-stock', label: 'Low Stock Alert', group: 'Inventory' },
  { key: 'receipt', label: 'Receipt Entry', group: 'Accounts' },
  { key: 'payment', label: 'Payment Entry', group: 'Accounts' },
  { key: 'journal', label: 'Journal Entry', group: 'Accounts' },
  { key: 'expense', label: 'Expense Entry', group: 'Accounts' },
  { key: 'contra', label: 'Contra Entry', group: 'Accounts' },
  { key: 'report-sales', label: 'Sales Reports', group: 'Reports' },
  { key: 'report-purchase', label: 'Purchase Reports', group: 'Reports' },
  { key: 'report-inventory', label: 'Inventory Reports', group: 'Reports' },
  { key: 'report-accounts', label: 'Account Reports', group: 'Reports' },
  { key: 'user-management', label: 'User Management', group: 'Admin' },
];

export const ALL_MODULE_KEYS = ALL_MODULES.map(m => m.key);

export const ROLE_TEMPLATES = {
  Admin: ALL_MODULE_KEYS,
  Accountant: [
    'dashboard', 'parties', 'accounts', 'taxes',
    'sales-invoice', 'sales-return', 'purchase-bill', 'purchase-return',
    'receipt', 'payment', 'journal', 'expense', 'contra',
    'report-sales', 'report-purchase', 'report-accounts',
  ],
  Salesperson: [
    'dashboard', 'parties', 'items',
    'sales-invoice', 'sales-return', 'delivery-challan', 'sales-order',
    'stock-summary', 'low-stock',
    'receipt',
    'report-sales',
  ],
  'Purchase Manager': [
    'dashboard', 'parties', 'items',
    'purchase-bill', 'purchase-return', 'purchase-order',
    'stock-summary', 'stock-ledger', 'low-stock',
    'payment',
    'report-purchase', 'report-inventory',
  ],
  'Inventory Manager': [
    'dashboard', 'items',
    'stock-summary', 'stock-ledger', 'stock-journal', 'low-stock',
    'delivery-challan',
    'report-inventory',
  ],
  Viewer: [
    'dashboard',
    'report-sales', 'report-purchase', 'report-inventory', 'report-accounts',
  ],
};

const defaultAdmin = {
  id: 'admin-default',
  username: 'admin',
  password: 'admin123',
  fullName: 'Administrator',
  email: 'admin@company.com',
  role: 'Admin',
  modules: ALL_MODULE_KEYS,
  isActive: true,
  createdAt: new Date().toISOString(),
  lastLogin: null,
};

function ensureAdmin(usersList) {
  const hasAdmin = usersList?.some(u => u.id === 'admin-default');
  if (!hasAdmin) {
    return [defaultAdmin, ...(usersList || [])];
  }
  return usersList.map(u =>
    u.id === 'admin-default' ? { ...u, modules: ALL_MODULE_KEYS, role: 'Admin' } : u
  );
}

function loadLocalAuthData() {
  try {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      return { users: ensureAdmin(data.users) };
    }
  } catch (e) {
    console.error('Failed to load auth data:', e);
  }
  return null;
}

function loadSession() {
  try {
    const s = localStorage.getItem(SESSION_KEY);
    if (s) return JSON.parse(s);
  } catch (e) { /* ignore */ }
  return null;
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(() => {
    const data = loadLocalAuthData();
    return data?.users || [defaultAdmin];
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    async function init() {
      let loadedUsers = null;

      if (isSupabaseConfigured()) {
        const data = await loadAuthData();
        if (data?.users) {
          loadedUsers = ensureAdmin(data.users);
        }
      }

      if (loadedUsers) {
        setUsers(loadedUsers);
      }

      const finalUsers = loadedUsers || users;
      const session = loadSession();
      if (session?.userId) {
        const user = finalUsers.find(u => u.id === session.userId && u.isActive);
        if (user) setCurrentUser(user);
      }

      setAuthLoading(false);
      setAuthInitialized(true);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!authInitialized) return;
    if (isSupabaseConfigured()) {
      saveAuthData(users);
    } else {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ users }));
    }
  }, [users, authInitialized]);

  useEffect(() => {
    if (!authInitialized) return;
    if (currentUser) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: currentUser.id }));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [currentUser, authInitialized]);

  const login = useCallback((username, password) => {
    const user = users.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );
    if (!user) return { success: false, error: 'Invalid username or password' };
    if (!user.isActive) return { success: false, error: 'This account has been deactivated. Contact your administrator.' };

    const updated = { ...user, lastLogin: new Date().toISOString() };
    setUsers(prev => prev.map(u => u.id === user.id ? updated : u));
    setCurrentUser(updated);
    return { success: true };
  }, [users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const addUser = useCallback((userData) => {
    if (users.some(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
      return { success: false, error: 'Username already exists' };
    }
    const newUser = {
      id: uuidv4(),
      ...userData,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: null,
    };
    setUsers(prev => [...prev, newUser]);
    return { success: true, user: newUser };
  }, [users]);

  const updateUser = useCallback((id, userData) => {
    if (id === 'admin-default' && userData.isActive === false) {
      return { success: false, error: 'Cannot deactivate the default admin account' };
    }
    if (id === 'admin-default' && userData.role && userData.role !== 'Admin') {
      return { success: false, error: 'Cannot change the default admin role' };
    }
    if (userData.username && users.some(u => u.id !== id && u.username.toLowerCase() === userData.username.toLowerCase())) {
      return { success: false, error: 'Username already exists' };
    }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...userData } : u));
    if (currentUser?.id === id) {
      setCurrentUser(prev => ({ ...prev, ...userData }));
    }
    return { success: true };
  }, [users, currentUser]);

  const deleteUser = useCallback((id) => {
    if (id === 'admin-default') {
      return { success: false, error: 'Cannot delete the default admin account' };
    }
    if (currentUser?.id === id) {
      return { success: false, error: 'Cannot delete your own account while logged in' };
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    return { success: true };
  }, [currentUser]);

  const hasAccess = useCallback((moduleKey) => {
    if (!currentUser) return false;
    if (currentUser.role === 'Admin') return true;
    return currentUser.modules?.includes(moduleKey) || false;
  }, [currentUser]);

  const isAdmin = currentUser?.role === 'Admin';

  return (
    <AuthContext.Provider value={{
      currentUser,
      users,
      isLoggedIn: !!currentUser,
      isAdmin,
      authLoading,
      login,
      logout,
      addUser,
      updateUser,
      deleteUser,
      hasAccess,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
