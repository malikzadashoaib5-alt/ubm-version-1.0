import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  RefreshCw, 
  TrendingUp, 
  Scale, 
  Layers, 
  X,
  Lock,
  Wallet
} from 'lucide-react';
import { Account, AccountType } from '../../types/index.ts';
import { useTenant } from '../../context/TenantContext.tsx';
import { getAccounts, createAccount } from '../../services/dbService.ts';

export const AccountingModule: React.FC = () => {
  const { currentBusiness, formatMoney, canAccessPlanFeature } = useTenant();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    code: '1050',
    name: 'Petty Cash Branch #2',
    type: 'asset' as AccountType,
    subType: 'Current Asset',
    currentBalance: 0
  });

  const loadAccounts = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      const data = await getAccounts(currentBusiness.id);
      setAccounts(data);
    } catch (e) {
      console.error('Failed to load accounts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [currentBusiness?.id]);

  const filteredAccounts = accounts.filter(a => {
    return selectedType === 'all' || a.type === selectedType;
  });

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;
    try {
      await createAccount({
        businessId: currentBusiness.id,
        code: formData.code,
        name: formData.name,
        type: formData.type,
        subType: formData.subType,
        currentBalance: Number(formData.currentBalance),
        currency: currentBusiness.baseCurrency
      });

      setShowAddModal(false);
      loadAccounts();
    } catch (e) {
      console.error('Failed to create account:', e);
      alert('Error creating ledger account.');
    }
  };

  const totalAssets = accounts.filter(a => a.type === 'asset').reduce((acc, a) => acc + a.currentBalance, 0);
  const totalLiabilities = accounts.filter(a => a.type === 'liability').reduce((acc, a) => acc + a.currentBalance, 0);
  const totalEquity = accounts.filter(a => a.type === 'equity').reduce((acc, a) => acc + a.currentBalance, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Chart of Accounts & General Ledger</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Double-entry bookkeeping foundation, cashbook liquidity, and trial balance structure
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadAccounts}
            className="p-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Ledger Account</span>
          </button>
        </div>
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium">Total Ledger Accounts</span>
          <div className="text-2xl font-bold text-white mt-1">{accounts.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium">Total Assets (1000s)</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{formatMoney(totalAssets)}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium">Total Liabilities (2000s)</span>
          <div className="text-2xl font-bold text-rose-400 mt-1">{formatMoney(totalLiabilities)}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium">Net Equity (3000s)</span>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{formatMoney(totalEquity)}</div>
        </div>
      </div>

      {/* Account Type Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Accounts' },
          { id: 'asset', label: 'Assets (1000s)' },
          { id: 'liability', label: 'Liabilities (2000s)' },
          { id: 'equity', label: 'Equity (3000s)' },
          { id: 'revenue', label: 'Revenue (4000s)' },
          { id: 'expense', label: 'Expenses (5000-6000s)' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedType(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedType === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Accounts List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Account Code</th>
                <th className="py-3 px-4">Account Title</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Sub-Category</th>
                <th className="py-3 px-4 text-right">Current Ledger Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAccounts.map(acc => (
                <tr key={acc.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-300">
                    {acc.code}
                  </td>
                  <td className="py-3 px-4 font-semibold text-white">
                    {acc.name}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] uppercase font-bold text-slate-300">
                      {acc.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {acc.subType}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white">
                    {formatMoney(acc.currentBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD ACCOUNT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-white text-base">Create General Ledger Account</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Account Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Account Type *</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as AccountType })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="asset">Asset (1000s)</option>
                    <option value="liability">Liability (2000s)</option>
                    <option value="equity">Equity (3000s)</option>
                    <option value="revenue">Revenue (4000s)</option>
                    <option value="expense">Expense (5000-6000s)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Account Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Corporate Escrow Account"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Sub-Type Category</label>
                <input
                  type="text"
                  value={formData.subType}
                  onChange={e => setFormData({ ...formData, subType: e.target.value })}
                  placeholder="e.g. Current Asset, Fixed Asset, Current Liability"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Opening Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.currentBalance}
                  onChange={e => setFormData({ ...formData, currentBalance: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
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
                  Register Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
