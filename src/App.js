import React, { useState, useEffect, useCallback } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/auth/LoginPage';
import AccessDenied from './components/auth/AccessDenied';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './components/dashboard/Dashboard';
import PartyMaster from './components/masters/PartyMaster';
import ItemMaster from './components/masters/ItemMaster';
import AccountMaster from './components/masters/AccountMaster';
import TaxMaster from './components/masters/TaxMaster';
import SalesInvoice from './components/sales/SalesInvoice';
import SalesReturn from './components/sales/SalesReturn';
import DeliveryChallan from './components/sales/DeliveryChallan';
import SalesOrder from './components/sales/SalesOrder';
import PurchaseBill from './components/purchase/PurchaseBill';
import PurchaseReturn from './components/purchase/PurchaseReturn';
import PurchaseOrder from './components/purchase/PurchaseOrder';
import StockSummary from './components/inventory/StockSummary';
import StockLedger from './components/inventory/StockLedger';
import StockJournal from './components/inventory/StockJournal';
import LowStock from './components/inventory/LowStock';
import ReceiptEntry from './components/accounts/ReceiptEntry';
import PaymentEntry from './components/accounts/PaymentEntry';
import JournalEntry from './components/accounts/JournalEntry';
import ExpenseEntry from './components/accounts/ExpenseEntry';
import ContraEntry from './components/accounts/ContraEntry';
import SalesReports from './components/reports/SalesReports';
import PurchaseReports from './components/reports/PurchaseReports';
import InventoryReports from './components/reports/InventoryReports';
import AccountReports from './components/reports/AccountReports';
import BusinessProfile from './components/settings/BusinessProfile';
import UserManagement from './components/settings/UserManagement';

const pages = {
  dashboard: Dashboard,
  'business-profile': BusinessProfile,
  'user-management': UserManagement,
  parties: PartyMaster,
  items: ItemMaster,
  accounts: AccountMaster,
  taxes: TaxMaster,
  'sales-invoice': SalesInvoice,
  'sales-return': SalesReturn,
  'delivery-challan': DeliveryChallan,
  'sales-order': SalesOrder,
  'purchase-bill': PurchaseBill,
  'purchase-return': PurchaseReturn,
  'purchase-order': PurchaseOrder,
  'stock-summary': StockSummary,
  'stock-ledger': StockLedger,
  'stock-journal': StockJournal,
  'low-stock': LowStock,
  receipt: ReceiptEntry,
  payment: PaymentEntry,
  journal: JournalEntry,
  expense: ExpenseEntry,
  contra: ContraEntry,
  'report-sales': SalesReports,
  'report-purchase': PurchaseReports,
  'report-inventory': InventoryReports,
  'report-accounts': AccountReports,
};

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
          <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">MayaSoft ERP</h2>
        <div className="flex items-center justify-center gap-2">
          <svg className="animate-spin w-5 h-5 text-blue-200" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-blue-200 text-sm">Loading your data...</p>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { isLoggedIn, hasAccess, authLoading } = useAuth();
  const { loading } = useApp();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleKeyboard = useCallback((e) => {
    if (e.key === 'Escape') {
      // handled by individual modals
    }
    if (e.key === 'F2') {
      e.preventDefault();
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [handleKeyboard]);

  if (loading || authLoading) {
    return <LoadingScreen />;
  }

  if (!isLoggedIn) {
    return <LoginPage />;
  }

  const canAccess = hasAccess(currentPage);
  const PageComponent = canAccess ? (pages[currentPage] || Dashboard) : null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onNavigate={setCurrentPage} />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {canAccess ? (
            <PageComponent />
          ) : (
            <AccessDenied onGoHome={() => setCurrentPage('dashboard')} />
          )}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
