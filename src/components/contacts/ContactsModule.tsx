import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  DollarSign, 
  RefreshCw,
  X,
  Building,
  UserCheck
} from 'lucide-react';
import { Contact } from '../../types/index.ts';
import { useTenant } from '../../context/TenantContext.tsx';
import { getContacts, saveContact } from '../../services/dbService.ts';

export const ContactsModule: React.FC = () => {
  const { currentBusiness, formatMoney } = useTenant();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'customer' | 'supplier'>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    type: 'customer' as 'customer' | 'supplier' | 'both',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    creditLimit: 5000,
    currentBalance: 0,
    status: 'active' as const
  });

  const loadContacts = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      const data = await getContacts(currentBusiness.id);
      setContacts(data);
    } catch (e) {
      console.error('Failed to load contacts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, [currentBusiness?.id]);

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.companyName && c.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === 'all' || c.type === typeFilter || c.type === 'both';
    return matchesSearch && matchesType;
  });

  const handleOpenAdd = () => {
    setEditingContact(null);
    setFormData({
      name: '',
      companyName: '',
      type: 'customer',
      email: '',
      phone: '',
      address: '',
      taxId: '',
      creditLimit: 5000,
      currentBalance: 0,
      status: 'active'
    });
    setShowAddModal(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;
    try {
      await saveContact({
        id: editingContact?.id,
        businessId: currentBusiness.id,
        name: formData.name,
        companyName: formData.companyName,
        type: formData.type,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        taxId: formData.taxId,
        creditLimit: Number(formData.creditLimit),
        currentBalance: Number(formData.currentBalance),
        status: formData.status
      });

      setShowAddModal(false);
      loadContacts();
    } catch (e) {
      console.error('Failed to save contact:', e);
      alert('Error saving contact.');
    }
  };

  const totalReceivables = contacts
    .filter(c => c.currentBalance > 0)
    .reduce((a, b) => a + b.currentBalance, 0);

  const totalPayables = contacts
    .filter(c => c.currentBalance < 0)
    .reduce((a, b) => a + Math.abs(b.currentBalance), 0);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>Customers & Suppliers Directory</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Client relationships, vendor balances, credit lines, and transaction ledgers
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadContacts}
            className="p-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Contact</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium">Total Registered Contacts</span>
          <div className="text-2xl font-bold text-white mt-1">{contacts.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium">Total Customers</span>
          <div className="text-2xl font-bold text-indigo-400 mt-1">
            {contacts.filter(c => c.type === 'customer' || c.type === 'both').length}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium">Accounts Receivable (Owed to Us)</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{formatMoney(totalReceivables)}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium">Accounts Payable (We Owe)</span>
          <div className="text-2xl font-bold text-rose-400 mt-1">{formatMoney(totalPayables)}</div>
        </div>
      </div>

      {/* Filters and List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search contact name, company, email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Classification:</span>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Contacts</option>
              <option value="customer">Customers Only</option>
              <option value="supplier">Suppliers / Vendors</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Contact & Company</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Communication</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-right">Credit Line</th>
                <th className="py-3 px-4 text-right">Current Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredContacts.map(c => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{c.name}</div>
                    {c.companyName && <div className="text-[10px] text-slate-400">{c.companyName}</div>}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] uppercase font-bold text-indigo-400">
                      {c.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 space-y-0.5 text-[11px]">
                    {c.email && <div>{c.email}</div>}
                    {c.phone && <div>{c.phone}</div>}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {c.address || '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    {formatMoney(c.creditLimit)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold">
                    {c.currentBalance > 0 ? (
                      <span className="text-emerald-400">+{formatMoney(c.currentBalance)}</span>
                    ) : c.currentBalance < 0 ? (
                      <span className="text-rose-400">-{formatMoney(Math.abs(c.currentBalance))}</span>
                    ) : (
                      <span className="text-slate-500">{formatMoney(0)}</span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredContacts.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    No contacts found. Click "Add New Contact" to register clients or suppliers.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD CONTACT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-white text-base">Register New Contact</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="e.g. Acme Corp"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Contact Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="customer">Customer / Buyer</option>
                    <option value="supplier">Supplier / Vendor</option>
                    <option value="both">Both (Buyer & Supplier)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Credit Limit</label>
                  <input
                    type="number"
                    value={formData.creditLimit}
                    onChange={e => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Physical / Billing Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, City, Country"
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
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
