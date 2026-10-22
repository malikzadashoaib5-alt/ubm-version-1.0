import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  AlertTriangle, 
  CheckCircle2, 
  SlidersHorizontal,
  RefreshCw,
  X,
  TrendingUp,
  Boxes
} from 'lucide-react';
import { Product } from '../../types/index.ts';
import { useTenant } from '../../context/TenantContext.tsx';
import { getProducts, saveProduct, adjustStock, createAuditLog } from '../../services/dbService.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const ProductsModule: React.FC = () => {
  const { currentBusiness, currentBranch, formatMoney } = useTenant();
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Modal states
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('Stock Audit Adjustment');

  // Product Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: 'General',
    unit: 'pcs',
    costPrice: 0,
    sellingPrice: 0,
    stockQuantity: 0,
    reorderLevel: 5,
    taxRate: 10,
    status: 'active' as 'active' | 'archived'
  });

  const loadProducts = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      const data = await getProducts(currentBusiness.id);
      setProducts(data);
    } catch (e) {
      console.error('Error fetching products:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [currentBusiness?.id]);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      category: 'General',
      unit: 'pcs',
      costPrice: 10,
      sellingPrice: 19.99,
      stockQuantity: 20,
      reorderLevel: 5,
      taxRate: 10,
      status: 'active'
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      barcode: prod.barcode || '',
      category: prod.category,
      unit: prod.unit,
      costPrice: prod.costPrice,
      sellingPrice: prod.sellingPrice,
      stockQuantity: prod.stockQuantity,
      reorderLevel: prod.reorderLevel,
      taxRate: prod.taxRate,
      status: prod.status
    });
    setShowAddModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;

    try {
      await saveProduct({
        id: editingProduct?.id,
        businessId: currentBusiness.id,
        branchId: currentBranch?.id || 'br_hq',
        name: formData.name,
        sku: formData.sku,
        barcode: formData.barcode,
        category: formData.category,
        unit: formData.unit,
        costPrice: Number(formData.costPrice),
        sellingPrice: Number(formData.sellingPrice),
        stockQuantity: Number(formData.stockQuantity),
        reorderLevel: Number(formData.reorderLevel),
        taxRate: Number(formData.taxRate),
        status: formData.status
      });

      setShowAddModal(false);
      loadProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Failed to save product record.');
    }
  };

  const handleStockAdjustment = async () => {
    if (!adjustingProduct || !currentBusiness || adjustDelta === 0) return;
    try {
      await adjustStock(adjustingProduct.id, adjustDelta, adjustReason);
      await createAuditLog(
        currentBusiness.id,
        user?.uid || 'staff',
        user?.email || 'staff@ubm.app',
        'STOCK_ADJUSTMENT',
        'INVENTORY',
        `Adjusted stock for ${adjustingProduct.name} by ${adjustDelta > 0 ? '+' : ''}${adjustDelta} units (${adjustReason})`
      );
      setAdjustingProduct(null);
      setAdjustDelta(0);
      loadProducts();
    } catch (err) {
      console.error('Stock adjustment error:', err);
      alert('Failed to adjust inventory stock.');
    }
  };

  // Metrics
  const totalItems = products.length;
  const totalStockUnits = products.reduce((acc, p) => acc + p.stockQuantity, 0);
  const totalInventoryValuation = products.reduce((acc, p) => acc + (p.stockQuantity * p.costPrice), 0);
  const lowStockCount = products.filter(p => p.stockQuantity <= p.reorderLevel).length;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Top Banner & KPI Cards */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Package className="w-5 h-5 text-indigo-400" />
            <span>Product & Inventory Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time stock valuation, reorder thresholds, and SKU/barcode catalog
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadProducts}
            className="p-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 transition cursor-pointer"
            title="Refresh Inventory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium">Total Catalog Items</span>
          <div className="text-2xl font-bold text-white mt-1">{totalItems}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium">Total Physical Units</span>
          <div className="text-2xl font-bold text-white mt-1">{totalStockUnits}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium">Inventory Valuation (Cost)</span>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{formatMoney(totalInventoryValuation)}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium">Low Stock Alerts</span>
          <div className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {lowStockCount}
          </div>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Filter by name, SKU, or barcode..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400">Category:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Item & Code</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Cost Price</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">Stock Level</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.map(prod => {
                const isLow = prod.stockQuantity <= prod.reorderLevel;
                const isOut = prod.stockQuantity <= 0;
                const margin = prod.sellingPrice > 0 ? (((prod.sellingPrice - prod.costPrice) / prod.sellingPrice) * 100).toFixed(0) : 0;

                return (
                  <tr key={prod.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{prod.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        SKU: {prod.sku} {prod.barcode && `| Barcode: ${prod.barcode}`}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300">
                        {prod.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      {formatMoney(prod.costPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-indigo-300 font-bold">
                      {formatMoney(prod.sellingPrice)}
                      <span className="text-[10px] text-slate-500 font-normal ml-1">({margin}% margin)</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <span className={`font-bold ${isOut ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {prod.stockQuantity} {prod.unit}
                      </span>
                      <div className="text-[10px] text-slate-500">Reorder at {prod.reorderLevel}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        isOut ? 'bg-rose-500/10 text-rose-400' : isLow ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Optimal'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setAdjustingProduct(prod);
                          setAdjustDelta(0);
                        }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 transition cursor-pointer"
                        title="Adjust Stock"
                      >
                        Adjust Stock
                      </button>
                      <button
                        onClick={() => handleOpenEdit(prod)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                        title="Edit Item"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    No products matching search criteria. Click "Add New Product" to record inventory.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-white text-base">
                {editingProduct ? 'Edit Catalog Product' : 'Add New Inventory Product'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Wireless Barcode Scanner"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">SKU / Item Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Barcode (EAN/UPC)</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Measurement Unit</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="pcs, kg, box, pack"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Cost Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.costPrice}
                    onChange={e => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Selling Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.sellingPrice}
                    onChange={e => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={e => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Reorder Alert</label>
                  <input
                    type="number"
                    value={formData.reorderLevel}
                    onChange={e => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={formData.taxRate}
                    onChange={e => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition cursor-pointer"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK STOCK ADJUSTMENT MODAL */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-white text-base">Adjust Stock Level</h3>
              <button onClick={() => setAdjustingProduct(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-xs text-slate-400">Target Product:</div>
                <div className="font-bold text-white text-sm">{adjustingProduct.name}</div>
                <div className="text-xs text-slate-500 font-mono">Current Quantity: {adjustingProduct.stockQuantity} {adjustingProduct.unit}</div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Quantity Delta (+ to increase, - to decrease)
                </label>
                <input
                  type="number"
                  value={adjustDelta}
                  onChange={e => setAdjustDelta(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono text-base focus:outline-none focus:border-indigo-500"
                />
                <div className="text-[11px] text-slate-400 mt-1">
                  New resulting stock: <strong className="text-white">{adjustingProduct.stockQuantity + adjustDelta}</strong> {adjustingProduct.unit}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Reason for Adjustment</label>
                <select
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Stock Audit Count">Physical Audit / Stock Count Reconciliation</option>
                  <option value="Damaged / Expired">Damaged, Broken, or Expired Stock</option>
                  <option value="Direct Supplier Intake">Direct / Unrecorded Supplier Delivery</option>
                  <option value="Internal Store Usage">Internal Store Consumption</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStockAdjustment}
                  disabled={adjustDelta === 0}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow transition cursor-pointer disabled:opacity-40"
                >
                  Apply Adjustment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
