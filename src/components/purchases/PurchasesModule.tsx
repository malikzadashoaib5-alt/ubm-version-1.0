import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  X,
  PackageCheck
} from 'lucide-react';
import { Purchase, Product, Contact, PurchaseItem } from '../../types/index.ts';
import { useTenant } from '../../context/TenantContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { getPurchases, getProducts, getContacts, createPurchase } from '../../services/dbService.ts';

export const PurchasesModule: React.FC = () => {
  const { currentBusiness, currentBranch, formatMoney } = useTenant();
  const { user } = useAuth();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form State
  const [supplierId, setSupplierId] = useState<string>('');
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [status, setStatus] = useState<'received' | 'ordered'>('received');
  const [amountPaid, setAmountPaid] = useState<number>(0);

  const loadData = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      const [p, prods, conts] = await Promise.all([
        getPurchases(currentBusiness.id),
        getProducts(currentBusiness.id),
        getContacts(currentBusiness.id)
      ]);
      setPurchases(p);
      setProducts(prods);
      setSuppliers(conts.filter(c => c.type === 'supplier' || c.type === 'both'));
    } catch (e) {
      console.error('Error loading purchases:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBusiness?.id]);

  const handleAddItem = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    setPurchaseItems(prev => [
      ...prev,
      {
        productId: prod.id,
        name: prod.name,
        sku: prod.sku,
        quantity: 10,
        unitCost: prod.costPrice,
        total: 10 * prod.costPrice
      }
    ]);
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness || purchaseItems.length === 0 || !supplierId) return;

    const subtotal = purchaseItems.reduce((acc, i) => acc + i.total, 0);
    const total = subtotal; // can add tax if needed
    const balanceDue = Math.max(0, total - amountPaid);
    const supp = suppliers.find(s => s.id === supplierId);

    try {
      const purchaseNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await createPurchase({
        businessId: currentBusiness.id,
        branchId: currentBranch?.id || 'br_hq',
        purchaseNumber,
        supplierId: supp?.id || '',
        supplierName: supp?.name || 'Authorized Supplier',
        items: purchaseItems,
        subtotal,
        taxTotal: 0,
        total,
        amountPaid,
        balanceDue,
        paymentStatus: balanceDue === 0 ? 'paid' : (amountPaid > 0 ? 'partial' : 'unpaid'),
        status,
        receivedDate: status === 'received' ? new Date().toISOString() : undefined
      });

      setShowAddModal(false);
      setPurchaseItems([]);
      setSupplierId('');
      setAmountPaid(0);
      loadData();
    } catch (e) {
      console.error('Failed to create purchase:', e);
      alert('Failed to record purchase intake.');
    }
  };

  const totalProcured = purchases.reduce((acc, p) => acc + p.total, 0);
  const totalPayables = purchases.reduce((acc, p) => acc + p.balanceDue, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Truck className="w-5 h-5 text-indigo-400" />
            <span>Purchases, Supplier Intake & Bills</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Restock inventory, track accounts payable, and record vendor purchase orders
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Stock Intake / PO</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium">Total Purchase Orders</span>
          <div className="text-2xl font-bold text-white mt-1">{purchases.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium">Total Procured Value</span>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{formatMoney(totalProcured)}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium">Accounts Payable (We Owe)</span>
          <div className="text-2xl font-bold text-rose-400 mt-1">{formatMoney(totalPayables)}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">PO # & Date</th>
                <th className="py-3 px-4">Vendor / Supplier</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Total Cost</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {purchases.map(p => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono">
                    <div className="font-semibold text-white">{p.purchaseNumber}</div>
                    <div className="text-[10px] text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-200">
                    {p.supplierName}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.status === 'received' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {p.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white">
                    {formatMoney(p.total)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    <span className={p.balanceDue > 0 ? 'text-rose-400 font-bold' : 'text-slate-500'}>
                      {formatMoney(p.balanceDue)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-medium uppercase text-slate-300">
                      {p.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}

              {purchases.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    No purchase orders recorded yet. Click "Record Stock Intake / PO" above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW PURCHASE INTAKE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-white text-base">Record Supplier Purchase / Stock Intake</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Select Supplier *</label>
                <select
                  required
                  value={supplierId}
                  onChange={e => setSupplierId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Choose registered supplier...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.companyName || 'Supplier'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Intake Delivery Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="received">Received Goods (Instantly increase inventory stock)</option>
                  <option value="ordered">Ordered Pending (Awaiting shipment)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Add Product to Restock</label>
                <select
                  onChange={e => {
                    if (e.target.value) {
                      handleAddItem(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select item to add...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Current: {p.stockQuantity} {p.unit})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {purchaseItems.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-white">{item.name}</div>
                      <div className="text-[10px] text-slate-400">
                        Qty: {item.quantity} x {formatMoney(item.unitCost)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white font-mono">{formatMoney(item.total)}</span>
                      <button
                        type="button"
                        onClick={() => setPurchaseItems(prev => prev.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
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
                  disabled={purchaseItems.length === 0 || !supplierId}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg transition cursor-pointer disabled:opacity-40"
                >
                  Confirm Intake
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
