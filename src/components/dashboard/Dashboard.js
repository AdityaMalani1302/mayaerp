import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/helpers';
import {
  TrendingUp, TrendingDown, Wallet, Building2,
  ArrowUpCircle, ArrowDownCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const { state } = useApp();

  const stats = useMemo(() => {
    const totalSales = state.salesInvoices.reduce((s, i) => s + (i.grandTotal || 0), 0);
    const totalPurchases = state.purchaseBills.reduce((s, i) => s + (i.grandTotal || 0), 0);
    const cashAccount = state.accounts.find(a => a.name === 'Cash');
    const bankAccounts = state.accounts.filter(a => a.type === 'Bank');
    const bankBalance = bankAccounts.reduce((s, a) => s + a.balance, 0);
    const outReceivables = state.salesInvoices
      .filter(i => i.status === 'Unpaid' || i.status === 'Partial')
      .reduce((s, i) => s + (i.grandTotal - (i.paidAmount || 0)), 0);
    const outPayables = state.purchaseBills
      .filter(b => b.status === 'Unpaid' || b.status === 'Partial')
      .reduce((s, b) => s + (b.grandTotal - (b.paidAmount || 0)), 0);
    return {
      totalSales,
      totalPurchases,
      cashBalance: cashAccount?.balance || 0,
      bankBalance,
      outReceivables,
      outPayables,
    };
  }, [state]);

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((m, i) => {
      const monthStr = String(i + 1).padStart(2, '0');
      const sales = state.salesInvoices
        .filter(inv => inv.date && inv.date.substring(5, 7) === monthStr)
        .reduce((s, inv) => s + (inv.grandTotal || 0), 0);
      const purchases = state.purchaseBills
        .filter(bill => bill.date && bill.date.substring(5, 7) === monthStr)
        .reduce((s, bill) => s + (bill.grandTotal || 0), 0);
      return { month: m, Sales: sales, Purchase: purchases };
    });
  }, [state.salesInvoices, state.purchaseBills]);

  const topProducts = useMemo(() => {
    const itemSales = {};
    state.salesInvoices.forEach(inv => {
      inv.items?.forEach(li => {
        const item = state.items.find(i => i.id === li.itemId);
        const name = item?.name || 'Unknown';
        itemSales[name] = (itemSales[name] || 0) + (li.netAmount || 0);
      });
    });
    return Object.entries(itemSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [state.salesInvoices, state.items]);

  const recentTransactions = useMemo(() => {
    const txns = [
      ...state.salesInvoices.map(i => ({ type: 'Sale', ref: i.invoiceNo, date: i.date, amount: i.grandTotal, party: state.parties.find(p => p.id === i.partyId)?.name })),
      ...state.purchaseBills.map(b => ({ type: 'Purchase', ref: b.entryNo, date: b.date, amount: b.grandTotal, party: state.parties.find(p => p.id === b.partyId)?.name })),
      ...state.receipts.map(r => ({ type: 'Receipt', ref: r.receiptNo, date: r.date, amount: r.amount, party: state.parties.find(p => p.id === r.partyId)?.name })),
      ...state.payments.map(p => ({ type: 'Payment', ref: p.paymentNo, date: p.date, amount: p.amount, party: state.parties.find(pr => pr.id === p.partyId)?.name })),
    ];
    return txns.sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 10);
  }, [state]);

  const cards = [
    { label: 'Total Sales', value: stats.totalSales, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Purchases', value: stats.totalPurchases, icon: TrendingDown, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Cash Balance', value: stats.cashBalance, icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Bank Balance', value: stats.bankBalance, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Receivables', value: stats.outReceivables, icon: ArrowUpCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Payables', value: stats.outPayables, icon: ArrowDownCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div>
      <h1 className="page-title mb-6">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card !p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon size={18} className={card.color} />
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-1">{card.label}</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(card.value)}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Sales vs Purchase</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="Sales" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Purchase" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Top 5 Selling Products</h3>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topProducts}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name.substring(0, 15)} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {topProducts.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">No sales data yet</div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Transactions</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Ref No</th>
                <th>Date</th>
                <th>Party</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-6 text-gray-400">No transactions yet</td></tr>
              ) : (
                recentTransactions.map((txn, i) => (
                  <tr key={i}>
                    <td>
                      <span className={`badge ${
                        txn.type === 'Sale' ? 'badge-success' :
                        txn.type === 'Purchase' ? 'badge-info' :
                        txn.type === 'Receipt' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {txn.type}
                      </span>
                    </td>
                    <td className="font-medium">{txn.ref}</td>
                    <td>{txn.date}</td>
                    <td>{txn.party}</td>
                    <td className="text-right font-medium">{formatCurrency(txn.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
