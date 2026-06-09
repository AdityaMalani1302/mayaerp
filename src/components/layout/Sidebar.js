import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard, ShoppingCart, Package, Warehouse,
  DollarSign, BarChart3, ChevronDown, ChevronRight, PanelLeftClose, PanelLeft,
  FileText, RotateCcw, Truck, ClipboardList, Receipt, CreditCard,
  BookOpen, Wallet, ArrowLeftRight, Settings, Building2, Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const allMenuItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'business-profile', label: 'Business Profile', icon: Building2 },
  {
    key: 'masters', label: 'Masters', icon: Settings,
    children: [
      { key: 'parties', label: 'Party Master' },
      { key: 'items', label: 'Item Master' },
      { key: 'accounts', label: 'Account Master' },
      { key: 'taxes', label: 'Tax Master' },
    ],
  },
  {
    key: 'sales', label: 'Sales', icon: ShoppingCart,
    children: [
      { key: 'sales-invoice', label: 'Sales Invoice', icon: FileText },
      { key: 'sales-return', label: 'Sales Return', icon: RotateCcw },
      { key: 'delivery-challan', label: 'Delivery Challan', icon: Truck },
      { key: 'sales-order', label: 'Sales Order', icon: ClipboardList },
    ],
  },
  {
    key: 'purchase', label: 'Purchase', icon: Package,
    children: [
      { key: 'purchase-bill', label: 'Purchase Bill', icon: FileText },
      { key: 'purchase-return', label: 'Purchase Return', icon: RotateCcw },
      { key: 'purchase-order', label: 'Purchase Order', icon: ClipboardList },
    ],
  },
  {
    key: 'inventory', label: 'Inventory', icon: Warehouse,
    children: [
      { key: 'stock-summary', label: 'Stock Summary' },
      { key: 'stock-ledger', label: 'Stock Ledger' },
      { key: 'stock-journal', label: 'Stock Journal' },
      { key: 'low-stock', label: 'Low Stock Alert' },
    ],
  },
  {
    key: 'finance', label: 'Accounts', icon: DollarSign,
    children: [
      { key: 'receipt', label: 'Receipt Entry', icon: Receipt },
      { key: 'payment', label: 'Payment Entry', icon: CreditCard },
      { key: 'journal', label: 'Journal Entry', icon: BookOpen },
      { key: 'expense', label: 'Expense Entry', icon: Wallet },
      { key: 'contra', label: 'Contra Entry', icon: ArrowLeftRight },
    ],
  },
  {
    key: 'reports', label: 'Reports', icon: BarChart3,
    children: [
      { key: 'report-sales', label: 'Sales Reports' },
      { key: 'report-purchase', label: 'Purchase Reports' },
      { key: 'report-inventory', label: 'Inventory Reports' },
      { key: 'report-accounts', label: 'Account Reports' },
    ],
  },
  { key: 'user-management', label: 'User Management', icon: Users },
];

export default function Sidebar({ currentPage, onNavigate, collapsed, onToggle }) {
  const [expanded, setExpanded] = useState({});
  const { hasAccess } = useAuth();

  // Filter menu items based on user access
  const menuItems = useMemo(() => {
    return allMenuItems
      .map(item => {
        if (item.children) {
          const visibleChildren = item.children.filter(child => hasAccess(child.key));
          if (visibleChildren.length === 0) return null;
          return { ...item, children: visibleChildren };
        }
        return hasAccess(item.key) ? item : null;
      })
      .filter(Boolean);
  }, [hasAccess]);

  const toggleExpand = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isActive = (key) => currentPage === key;
  const isParentActive = (item) => item.children?.some(c => c.key === currentPage);

  return (
    <aside className={`bg-white border-r border-gray-200 h-screen flex flex-col transition-all duration-200 ${collapsed ? 'w-16' : 'w-64'} flex-shrink-0`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        {!collapsed && <span className="text-lg font-bold text-blue-700">MayaSoft ERP</span>}
        <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {menuItems.map(item => {
          const Icon = item.icon;
          const hasChildren = item.children?.length > 0;
          const isExp = expanded[item.key] || isParentActive(item);

          if (!hasChildren) {
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`sidebar-link w-full ${isActive(item.key) ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          }

          return (
            <div key={item.key}>
              <button
                onClick={() => collapsed ? onNavigate(item.children[0].key) : toggleExpand(item.key)}
                className={`sidebar-link w-full ${isParentActive(item) ? 'text-blue-700' : 'sidebar-link-inactive'}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={20} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {isExp ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </>
                )}
              </button>
              {!collapsed && isExp && (
                <div className="ml-5 pl-3 border-l border-gray-200 space-y-0.5 mt-0.5">
                  {item.children.map(child => (
                    <button
                      key={child.key}
                      onClick={() => onNavigate(child.key)}
                      className={`sidebar-link w-full text-xs ${isActive(child.key) ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
                    >
                      {child.icon && <child.icon size={16} />}
                      <span>{child.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-3 border-t border-gray-100 text-xs text-gray-400 text-center">
          v1.0 - MayaSoft ERP
        </div>
      )}
    </aside>
  );
}
