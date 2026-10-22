import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Package, 
  FileText, 
  TrendingUp, 
  Users, 
  Award, 
  AlertTriangle, 
  ArrowRight, 
  Clock, 
  CreditCard,
  Sparkles,
  Building2,
  RefreshCw
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { getProducts, getSalesOrders, getExpenses } from '../../services/dbService.ts';
import { Product, SalesOrder, Expense } from '../../types/index.ts';

export const DashboardOverview: React.FC = () => {
  const { currentBusiness, currentBranch, formatMoney, setCurrentView, trialDaysRemaining } = useTenant();
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      const [p, o, e] = await Promise.all([
        getProducts(currentBusiness.id),
        getSalesOrders(currentBusiness.id),
        getExpenses(currentBusiness.id)
      ]);
      setProducts(p);
      setOrders(o);
      setExpenses(e);
    } catch (err) {
      console.error('Error loading dashboard overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBusiness?.id]);

  const totalSalesRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((acc, o) => acc + o.total, 0);

  const totalExpenseAmount = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalSalesRevenue - totalExpenseAmount;
  const lowStockItems = products.filter(p => p.stockQuantity <= p.reorderLevel);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* 14-Day Free Trial Notice Banner */}
      {currentBusiness?.subscription.status === 'trialing' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                14-Day Full Enterprise Trial Active • {trialDaysRemaining} Days Remaining
              </h3>
              <p className="text-xs text-slate-400">
                You have unrestricted access to all core modules, POS, multi-branch, and accounting tools.
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentView('billing')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer"
          >
            Upgrade Plan
          </button>
        </div>
      )}

      {/* Welcome & Enterprise Identity Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {currentBusiness?.name}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-indigo-300 text-xs font-semibold capitalize border border-slate-700">
              {currentBusiness?.category}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Branch: <strong className="text-slate-200">{currentBranch?.name || 'Headquarters'}</strong> • Currency: <strong className="text-slate-200">{currentBusiness?.baseCurrency}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setCurrentView('certificate')}
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Verifiable UBM Certificate</span>
          </button>
          <button
            onClick={() => setCurrentView('pos')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Launch POS Terminal</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Gross Sales Volume</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{formatMoney(totalSalesRevenue)}</div>
          <div className="text-[10px] text-slate-500 mt-1">{orders.length} total orders completed</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Operating Expenses</span>
            <FileText className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">{formatMoney(totalExpenseAmount)}</div>
          <div className="text-[10px] text-slate-500 mt-1">{expenses.length} expense vouchers recorded</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Net Operating Margin</span>
            <span className="text-xs font-bold text-indigo-400">P&L</span>
          </div>
          <div className={`text-2xl font-black ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatMoney(netProfit)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Real-time ledger net balance</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Inventory Catalog</span>
            <Package className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{products.length} Items</div>
          <div className="text-[10px] text-amber-400 mt-1">
            {lowStockItems.length > 0 ? `${lowStockItems.length} items need reordering` : 'Optimal stock levels'}
          </div>
        </div>
      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-600/30 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-xs text-amber-200">
              <strong>Low Inventory Threshold Alert:</strong> {lowStockItems.length} products have fallen below their safety reorder level ({lowStockItems.slice(0, 3).map(p => p.name).join(', ')}...).
            </div>
          </div>
          <button
            onClick={() => setCurrentView('purchases')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs shrink-0 transition cursor-pointer"
          >
            Create Restock PO
          </button>
        </div>
      )}

      {/* Quick Launchpad & Recent Sales Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Operational Launchpad */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="font-bold text-white text-sm">Quick Action Launchpad</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => setCurrentView('pos')}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-indigo-500/60 text-left transition cursor-pointer group"
            >
              <ShoppingCart className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-110 transition" />
              <div className="font-semibold text-xs text-white">POS Terminal</div>
              <div className="text-[10px] text-slate-400">Cashier register</div>
            </button>

            <button
              onClick={() => setCurrentView('products')}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-indigo-500/60 text-left transition cursor-pointer group"
            >
              <Package className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition" />
              <div className="font-semibold text-xs text-white">Inventory</div>
              <div className="text-[10px] text-slate-400">Stock & SKUs</div>
            </button>

            <button
              onClick={() => setCurrentView('sales')}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-indigo-500/60 text-left transition cursor-pointer group"
            >
              <FileText className="w-5 h-5 text-blue-400 mb-2 group-hover:scale-110 transition" />
              <div className="font-semibold text-xs text-white">Commercial Invoices</div>
              <div className="text-[10px] text-slate-400">Receivables billing</div>
            </button>

            <button
              onClick={() => setCurrentView('ai_assistant')}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-indigo-500/60 text-left transition cursor-pointer group"
            >
              <Sparkles className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition" />
              <div className="font-semibold text-xs text-white">AI Advisor</div>
              <div className="text-[10px] text-slate-400">Gemini 2.5 Audit</div>
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setCurrentView('reports')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 transition cursor-pointer"
            >
              <span>View Financial P&L & Balance Sheet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Transactions Feed */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-sm">Recent Sales Orders</h3>
              <button
                onClick={() => setCurrentView('sales')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                View All
              </button>
            </div>

            <div className="divide-y divide-slate-800">
              {orders.slice(0, 5).map(o => (
                <div key={o.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white font-mono">{o.orderNumber}</div>
                    <div className="text-[11px] text-slate-400">{o.customerName} • {new Date(o.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-indigo-300">{formatMoney(o.total)}</div>
                    <span className="text-[10px] uppercase font-semibold text-emerald-400">{o.paymentStatus}</span>
                  </div>
                </div>
              ))}

              {orders.length === 0 && !loading && (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No orders recorded yet. Launch the POS terminal or create an invoice to begin.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex justify-between">
            <span>UBM Tenant Isolated Database Active</span>
            <span className="font-mono">ID: {currentBusiness?.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
