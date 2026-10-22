import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Plus, 
  Search, 
  RefreshCw, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  X,
  PieChart
} from 'lucide-react';
import { Expense } from '../../types/index.ts';
import { useTenant } from '../../context/TenantContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { getExpenses, createExpense } from '../../services/dbService.ts';

export const ExpensesModule: React.FC = () => {
  const { currentBusiness, currentBranch, formatMoney } = useTenant();
  const { user } = useAuth();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    category: 'Rent & Premises',
    amount: 150,
    paymentMethod: 'bank_transfer',
    paidTo: '',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const loadExpenses = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      const data = await getExpenses(currentBusiness.id);
      setExpenses(data);
    } catch (e) {
      console.error('Failed to load expenses:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [currentBusiness?.id]);

  const categories = [
    'Rent & Premises',
    'Utilities & Telecom',
    'Salaries & Wages',
    'Office & Supplies',
    'Marketing & Advertising',
    'Travel & Transport',
    'Repairs & Maintenance',
    'Software & Subscriptions',
    'Miscellaneous'
  ];

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = 
      e.paidTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.reference && e.reference.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = categoryFilter === 'All' || e.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness || !formData.paidTo) return;
    try {
      const expenseNumber = `EXP-${Math.floor(1000 + Math.random() * 9000)}`;
      await createExpense({
        businessId: currentBusiness.id,
        branchId: currentBranch?.id || 'br_hq',
        expenseNumber,
        category: formData.category,
        amount: Number(formData.amount),
        paymentMethod: formData.paymentMethod,
        paidTo: formData.paidTo,
        reference: formData.reference,
        date: formData.date,
        notes: formData.notes,
        recordedBy: user?.email || 'staff@ubm.app'
      });

      setShowAddModal(false);
      setFormData({
        category: 'Rent & Premises',
        amount: 150,
        paymentMethod: 'bank_transfer',
        paidTo: '',
        reference: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      loadExpenses();
    } catch (e) {
      console.error('Expense record failed:', e);
      alert('Failed to record expense.');
    }
  };

  const totalExpenseAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-indigo-400" />
            <span>Operating Expense Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cash outflow tracking, vendor reimbursements, operational overhead, and vouchers
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadExpenses}
            className="p-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium">Total Recorded Expenses</span>
          <div className="text-2xl font-bold text-white mt-1">{expenses.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium">Total Outflow Amount</span>
          <div className="text-2xl font-bold text-rose-400 mt-1">{formatMoney(totalExpenseAmount)}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium">Average Expense Ticket</span>
          <div className="text-2xl font-bold text-indigo-400 mt-1">
            {expenses.length > 0 ? formatMoney(totalExpenseAmount / expenses.length) : formatMoney(0)}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Filter expenses by payee, category, ref..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Category:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Voucher # & Date</th>
                <th className="py-3 px-4">Payee / Beneficiary</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredExpenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white font-mono">{exp.expenseNumber}</div>
                    <div className="text-[10px] text-slate-500">{exp.date}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-200">
                    {exp.paidTo}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 uppercase text-[10px] text-slate-400">
                    {exp.paymentMethod.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                    {exp.reference || '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                    -{formatMoney(exp.amount)}
                  </td>
                </tr>
              ))}

              {filteredExpenses.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    No expense records found. Click "Record New Expense" to track overhead.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD EXPENSE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-white text-base">Record Operating Expense</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Expense Category *</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Paid To / Vendor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electric Power Utility Corp"
                  value={formData.paidTo}
                  onChange={e => setFormData({ ...formData, paidTo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Amount Spent *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="bank_transfer">Bank Transfer / Wire</option>
                    <option value="cash">Operating Petty Cash</option>
                    <option value="card">Company Debit / Credit Card</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Invoice / Receipt Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. BILL-9821"
                    value={formData.reference}
                    onChange={e => setFormData({ ...formData, reference: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Expense Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description / Memo</label>
                <input
                  type="text"
                  placeholder="Additional expense details..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow transition cursor-pointer"
                >
                  Record Outflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
