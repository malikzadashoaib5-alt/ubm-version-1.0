import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Printer, 
  RefreshCw, 
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  PieChart
} from 'lucide-react';
import { SalesOrder, Expense, Product, Account } from '../../types/index.ts';
import { useTenant } from '../../context/TenantContext.tsx';
import { getSalesOrders, getExpenses, getProducts, getAccounts } from '../../services/dbService.ts';

export const ReportsModule: React.FC = () => {
  const { currentBusiness, formatMoney } = useTenant();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeReportTab, setActiveReportTab] = useState<'pnl' | 'balance_sheet' | 'tax' | 'sales_breakdown'>('pnl');

  const loadData = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      const [ord, exp, prods, accs] = await Promise.all([
        getSalesOrders(currentBusiness.id),
        getExpenses(currentBusiness.id),
        getProducts(currentBusiness.id),
        getAccounts(currentBusiness.id)
      ]);
      setOrders(ord);
      setExpenses(exp);
      setProducts(prods);
      setAccounts(accs);
    } catch (e) {
      console.error('Failed to load reports data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBusiness?.id]);

  // Financial Calculations
  const grossSales = orders
    .filter(o => o.status === 'completed')
    .reduce((acc, o) => acc + o.subtotal, 0);

  const totalTaxCollected = orders
    .filter(o => o.status === 'completed')
    .reduce((acc, o) => acc + o.taxTotal, 0);

  const totalRevenue = grossSales; // revenue before tax

  // Estimate COGS from product cost prices sold in orders
  const estimatedCOGS = orders
    .filter(o => o.status === 'completed')
    .flatMap(o => o.items)
    .reduce((acc, item) => {
      const prod = products.find(p => p.id === item.productId || p.sku === item.sku);
      const unitCost = prod?.costPrice || (item.unitPrice * 0.5);
      return acc + (unitCost * item.quantity);
    }, 0);

  const grossProfit = totalRevenue - estimatedCOGS;
  const grossMarginPercent = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0';

  const totalOperatingExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netOperatingIncome = grossProfit - totalOperatingExpenses;

  // Expenses grouped by category
  const expenseByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  // Balance sheet metrics
  const totalAssets = accounts.filter(a => a.type === 'asset').reduce((acc, a) => acc + a.currentBalance, 0);
  const totalLiabilities = accounts.filter(a => a.type === 'liability').reduce((acc, a) => acc + a.currentBalance, 0);
  const totalEquity = accounts.filter(a => a.type === 'equity').reduce((acc, a) => acc + a.currentBalance, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <span>Financial Statements & Executive Reports</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time profit & loss, balance sheet, tax liability, and sales analytics
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 transition cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Financial Statement</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2 no-print">
        {[
          { id: 'pnl' as const, label: 'Profit & Loss Statement (P&L)' },
          { id: 'balance_sheet' as const, label: 'Balance Sheet' },
          { id: 'tax' as const, label: 'Tax & VAT Summary' },
          { id: 'sales_breakdown' as const, label: 'Sales & Expense Breakdown' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveReportTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeReportTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* REPORT 1: PROFIT & LOSS STATEMENT */}
      {activeReportTab === 'pnl' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="text-center border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white">{currentBusiness?.name}</h3>
            <h4 className="text-sm font-semibold text-indigo-400">Statement of Comprehensive Income (Profit & Loss)</h4>
            <p className="text-xs text-slate-500 mt-0.5">For Period Ending {new Date().toLocaleDateString()} • In {currentBusiness?.baseCurrency}</p>
          </div>

          <div className="max-w-2xl mx-auto space-y-4 text-xs font-mono">
            {/* Operating Revenue */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-slate-200 text-sm border-b border-slate-800 pb-1">
                <span>OPERATING REVENUE</span>
                <span></span>
              </div>
              <div className="flex justify-between text-slate-300 pl-4">
                <span>Gross Commercial Sales</span>
                <span>{formatMoney(grossSales)}</span>
              </div>
              <div className="flex justify-between font-bold text-indigo-300 border-t border-slate-800/60 pt-1">
                <span>Total Net Revenue:</span>
                <span>{formatMoney(totalRevenue)}</span>
              </div>
            </div>

            {/* Cost of Goods Sold */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between font-bold text-slate-200 text-sm border-b border-slate-800 pb-1">
                <span>COST OF GOODS SOLD (COGS)</span>
                <span></span>
              </div>
              <div className="flex justify-between text-slate-300 pl-4">
                <span>Direct Product Inventory Cost</span>
                <span className="text-rose-400">({formatMoney(estimatedCOGS)})</span>
              </div>
              <div className="flex justify-between font-bold text-white border-t border-slate-800/60 pt-1">
                <span>Gross Profit Margin ({grossMarginPercent}%):</span>
                <span className="text-emerald-400">{formatMoney(grossProfit)}</span>
              </div>
            </div>

            {/* Operating Expenses */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between font-bold text-slate-200 text-sm border-b border-slate-800 pb-1">
                <span>OPERATING EXPENSES</span>
                <span></span>
              </div>
              {Object.entries(expenseByCategory).map(([cat, amt]) => (
                <div key={cat} className="flex justify-between text-slate-400 pl-4">
                  <span>{cat}</span>
                  <span>{formatMoney(amt)}</span>
                </div>
              ))}
              {Object.keys(expenseByCategory).length === 0 && (
                <div className="text-slate-500 pl-4">No overhead expenses recorded yet.</div>
              )}
              <div className="flex justify-between font-bold text-rose-300 border-t border-slate-800/60 pt-1">
                <span>Total Operating Overhead:</span>
                <span>({formatMoney(totalOperatingExpenses)})</span>
              </div>
            </div>

            {/* Net Operating Income */}
            <div className="pt-4 border-t-2 border-indigo-500/60 flex justify-between items-center text-base font-extrabold">
              <span className="text-white">NET OPERATING INCOME / (LOSS):</span>
              <span className={netOperatingIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {formatMoney(netOperatingIncome)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 2: BALANCE SHEET */}
      {activeReportTab === 'balance_sheet' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="text-center border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white">{currentBusiness?.name}</h3>
            <h4 className="text-sm font-semibold text-indigo-400">Balance Sheet (Financial Position)</h4>
            <p className="text-xs text-slate-500 mt-0.5">As of {new Date().toLocaleDateString()}</p>
          </div>

          <div className="max-w-2xl mx-auto space-y-6 text-xs font-mono">
            {/* Assets */}
            <div className="space-y-2">
              <div className="flex justify-between font-bold text-slate-200 text-sm border-b border-slate-800 pb-1">
                <span>ASSETS</span>
                <span className="text-emerald-400">{formatMoney(totalAssets)}</span>
              </div>
              {accounts.filter(a => a.type === 'asset').map(a => (
                <div key={a.id} className="flex justify-between text-slate-400 pl-4">
                  <span>{a.code} - {a.name}</span>
                  <span>{formatMoney(a.currentBalance)}</span>
                </div>
              ))}
            </div>

            {/* Liabilities */}
            <div className="space-y-2">
              <div className="flex justify-between font-bold text-slate-200 text-sm border-b border-slate-800 pb-1">
                <span>LIABILITIES</span>
                <span className="text-rose-400">{formatMoney(totalLiabilities)}</span>
              </div>
              {accounts.filter(a => a.type === 'liability').map(a => (
                <div key={a.id} className="flex justify-between text-slate-400 pl-4">
                  <span>{a.code} - {a.name}</span>
                  <span>{formatMoney(a.currentBalance)}</span>
                </div>
              ))}
            </div>

            {/* Equity */}
            <div className="space-y-2">
              <div className="flex justify-between font-bold text-slate-200 text-sm border-b border-slate-800 pb-1">
                <span>EQUITY & CAPITAL</span>
                <span className="text-indigo-400">{formatMoney(totalEquity + netOperatingIncome)}</span>
              </div>
              {accounts.filter(a => a.type === 'equity').map(a => (
                <div key={a.id} className="flex justify-between text-slate-400 pl-4">
                  <span>{a.code} - {a.name}</span>
                  <span>{formatMoney(a.currentBalance)}</span>
                </div>
              ))}
              <div className="flex justify-between text-slate-400 pl-4">
                <span>Current Retained Period Net Income</span>
                <span>{formatMoney(netOperatingIncome)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 3: TAX SUMMARY */}
      {activeReportTab === 'tax' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="text-center border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white">{currentBusiness?.name}</h3>
            <h4 className="text-sm font-semibold text-indigo-400">Sales Tax / VAT Declaration Summary</h4>
            <p className="text-xs text-slate-500 mt-0.5">Tax Registration Number: {currentBusiness?.taxNumber || 'Standard Entity'}</p>
          </div>

          <div className="max-w-xl mx-auto space-y-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>Taxable Commercial Volume:</span>
                <span className="font-bold text-white">{formatMoney(grossSales)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Output VAT / Sales Tax Collected:</span>
                <span className="font-bold text-indigo-400">{formatMoney(totalTaxCollected)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Input Tax Credits (Procured Stock):</span>
                <span className="font-bold text-emerald-400">({formatMoney(totalTaxCollected * 0.4)})</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between font-extrabold text-sm text-white">
                <span>Net Tax Remittance Due:</span>
                <span className="text-amber-400">{formatMoney(totalTaxCollected * 0.6)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 4: SALES BREAKDOWN */}
      {activeReportTab === 'sales_breakdown' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="font-bold text-white text-sm mb-3">Recent Sales Volume by Payment Method</h3>
            <div className="space-y-3">
              {['cash', 'card', 'bank_transfer'].map(method => {
                const totalForMethod = orders
                  .filter(o => o.paymentMethod === method)
                  .reduce((a, b) => a + b.total, 0);
                const percent = grossSales > 0 ? ((totalForMethod / grossSales) * 100).toFixed(0) : 0;
                return (
                  <div key={method} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-300 capitalize">
                      <span>{method.replace('_', ' ')}</span>
                      <span>{formatMoney(totalForMethod)} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="font-bold text-white text-sm mb-3">Top Expenses by Category</h3>
            <div className="space-y-3">
              {Object.entries(expenseByCategory).slice(0, 5).map(([cat, amt]) => {
                const percent = totalOperatingExpenses > 0 ? ((amt / totalOperatingExpenses) * 100).toFixed(0) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>{cat}</span>
                      <span>{formatMoney(amt)} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
