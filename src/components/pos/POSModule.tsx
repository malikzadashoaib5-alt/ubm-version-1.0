import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Barcode, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  Printer, 
  RefreshCw,
  User,
  X
} from 'lucide-react';
import { Product, OrderItem, SalesOrder, Contact } from '../../types/index.ts';
import { useTenant } from '../../context/TenantContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { getProducts, createSalesOrder, getContacts } from '../../services/dbService.ts';

export const POSModule: React.FC = () => {
  const { currentBusiness, currentBranch, formatMoney } = useTenant();
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Cart state
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Contact | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  
  // Payment modal state
  const [showPayModal, setShowPayModal] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer' | 'split'>('cash');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [processingOrder, setProcessingOrder] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<SalesOrder | null>(null);

  const loadData = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      const [prods, conts] = await Promise.all([
        getProducts(currentBusiness.id),
        getContacts(currentBusiness.id)
      ]);
      setProducts(prods);
      setContacts(conts.filter(c => c.type === 'customer' || c.type === 'both'));
    } catch (e) {
      console.error('Error loading POS data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBusiness?.id]);

  // Categories
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  // Filtered products
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat && p.status === 'active';
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => {
          if (item.productId === product.id) {
            const newQty = item.quantity + 1;
            const sub = newQty * item.unitPrice;
            const tax = sub * (item.taxRate / 100);
            return {
              ...item,
              quantity: newQty,
              taxAmount: tax,
              total: sub + tax
            };
          }
          return item;
        });
      }

      const sub = product.sellingPrice;
      const tax = sub * ((product.taxRate || 0) / 100);
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          quantity: 1,
          unitPrice: product.sellingPrice,
          discount: 0,
          taxRate: product.taxRate || 0,
          taxAmount: tax,
          total: sub + tax
        }
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => 
      prev
        .map(item => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            const sub = newQty * item.unitPrice;
            const tax = sub * (item.taxRate / 100);
            return {
              ...item,
              quantity: newQty,
              taxAmount: tax,
              total: sub + tax
            };
          }
          return item;
        })
        .filter(Boolean) as OrderItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  // Financial Calculations
  const rawSubtotal = cart.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const discountTotal = rawSubtotal * (discountPercent / 100);
  const subtotalAfterDiscount = rawSubtotal - discountTotal;
  const taxTotal = cart.reduce((acc, item) => acc + item.taxAmount, 0);
  const grandTotal = subtotalAfterDiscount + taxTotal;

  const tenderedNum = parseFloat(amountTendered) || grandTotal;
  const changeDue = Math.max(0, tenderedNum - grandTotal);

  const handleCompleteSale = async () => {
    if (!currentBusiness || cart.length === 0) return;
    setProcessingOrder(true);
    try {
      const orderNumber = `POS-${Date.now().toString().slice(-6)}`;
      const order = await createSalesOrder({
        businessId: currentBusiness.id,
        branchId: currentBranch?.id || 'br_hq',
        orderNumber,
        type: 'pos',
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name || 'Walk-in Customer',
        items: cart,
        subtotal: rawSubtotal,
        discountTotal,
        taxTotal,
        total: grandTotal,
        amountPaid: tenderedNum >= grandTotal ? grandTotal : tenderedNum,
        balanceDue: tenderedNum >= grandTotal ? 0 : (grandTotal - tenderedNum),
        paymentStatus: tenderedNum >= grandTotal ? 'paid' : (tenderedNum > 0 ? 'partial' : 'unpaid'),
        paymentMethod,
        status: 'completed',
        cashierId: user?.uid || 'staff',
        cashierName: user?.displayName || user?.email?.split('@')[0] || 'Cashier',
        notes: `POS Terminal Sale - ${currentBranch?.name || 'HQ'}`
      });

      setCompletedOrder(order);
      setCart([]);
      setSelectedCustomer(null);
      setDiscountPercent(0);
      setShowPayModal(false);
      // Reload products to reflect stock decrement
      loadData();
    } catch (e) {
      console.error('Error completing sale:', e);
      alert('Failed to complete transaction.');
    } finally {
      setProcessingOrder(false);
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col lg:flex-row gap-4 p-4">
      {/* LEFT: PRODUCTS CATALOGUE GRID */}
      <div className="flex-1 flex flex-col bg-slate-900/60 border border-slate-800 rounded-2xl p-4 overflow-hidden">
        {/* Top Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search product name, SKU, or scan barcode..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 transition cursor-pointer self-start sm:self-auto"
            title="Refresh Products"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex space-x-2 overflow-x-auto pb-2 mb-3 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pr-1">
          {filteredProducts.map(prod => {
            const isOutOfStock = prod.stockQuantity <= 0;
            return (
              <div
                key={prod.id}
                onClick={() => !isOutOfStock && addToCart(prod)}
                className={`p-3 rounded-xl border flex flex-col justify-between transition cursor-pointer ${
                  isOutOfStock 
                    ? 'border-slate-800 bg-slate-950/40 opacity-60 cursor-not-allowed' 
                    : 'border-slate-800/80 bg-slate-950/80 hover:border-indigo-500/60 hover:shadow-lg hover:shadow-indigo-500/5'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-mono text-slate-500">{prod.sku}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      prod.stockQuantity <= prod.reorderLevel 
                        ? 'bg-amber-500/10 text-amber-400' 
                        : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {prod.stockQuantity} in stock
                    </span>
                  </div>
                  <h4 className="font-semibold text-xs text-white mt-1.5 line-clamp-2">{prod.name}</h4>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-2">
                  <span className="text-sm font-bold text-indigo-300">{formatMoney(prod.sellingPrice)}</span>
                  <button 
                    disabled={isOutOfStock}
                    className="p-1 rounded bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition disabled:opacity-30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 text-slate-500 text-sm">
              No products found. Add products in the Inventory module or adjust your search filter.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: LIVE BASKET & CHECKOUT PANEL */}
      <div className="w-full lg:w-96 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
        <div>
          {/* Basket Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-white text-sm">Sales Terminal</h3>
            </div>
            <span className="text-xs bg-indigo-500/10 text-indigo-400 font-semibold px-2 py-0.5 rounded-full">
              {cart.reduce((a, b) => a + b.quantity, 0)} items
            </span>
          </div>

          {/* Customer Selector */}
          <div className="mb-3">
            <select
              value={selectedCustomer?.id || ''}
              onChange={e => {
                const found = contacts.find(c => c.id === e.target.value);
                setSelectedCustomer(found || null);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="">👤 Walk-in Customer (Default)</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone || c.email || 'No contact'})</option>
              ))}
            </select>
          </div>

          {/* Cart Item List */}
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {cart.map(item => (
              <div key={item.productId} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div className="flex-1 mr-2">
                  <div className="text-xs font-semibold text-white truncate">{item.name}</div>
                  <div className="text-[11px] text-slate-400">
                    {formatMoney(item.unitPrice)} each {item.taxRate > 0 && `(+${item.taxRate}% tax)`}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                    <button
                      onClick={() => updateQuantity(item.productId, -1)}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-white px-1.5">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, 1)}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-xs font-bold text-white min-w-[50px] text-right">
                    {formatMoney(item.total)}
                  </span>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="p-1 text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="text-center py-10 text-slate-500 text-xs">
                Cart is empty. Select items from the catalog on the left to begin.
              </div>
            )}
          </div>
        </div>

        {/* Cart Totals & Checkout Button */}
        <div className="border-t border-slate-800 pt-3 space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Subtotal</span>
            <span>{formatMoney(rawSubtotal)}</span>
          </div>
          {discountTotal > 0 && (
            <div className="flex justify-between text-xs text-emerald-400">
              <span>Discount ({discountPercent}%)</span>
              <span>-{formatMoney(discountTotal)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs text-slate-400">
            <span>Estimated Tax</span>
            <span>{formatMoney(taxTotal)}</span>
          </div>
          <div className="flex justify-between text-base font-extrabold text-white border-t border-slate-800 pt-2">
            <span>Total Payable</span>
            <span className="text-indigo-400">{formatMoney(grandTotal)}</span>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              disabled={cart.length === 0}
              onClick={() => {
                setAmountTendered(grandTotal.toFixed(2));
                setShowPayModal(true);
              }}
              className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-40"
            >
              <CreditCard className="w-4 h-4" />
              <span>Charge {formatMoney(grandTotal)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-white text-base">Complete Payment Tender</h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-xs text-slate-400 uppercase font-semibold">Total Balance Due</span>
                <div className="text-3xl font-black text-indigo-400 mt-1">{formatMoney(grandTotal)}</div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cash' as const, label: 'Cash', icon: Banknote },
                    { id: 'card' as const, label: 'Card / POS', icon: CreditCard },
                    { id: 'bank_transfer' as const, label: 'Bank', icon: CheckCircle2 }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                        paymentMethod === m.id
                          ? 'border-indigo-500 bg-indigo-500/10 text-white ring-1 ring-indigo-500'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <m.icon className="w-4 h-4" />
                      <span className="text-xs font-semibold">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash Amount Tendered & Change */}
              {paymentMethod === 'cash' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Cash Amount Received</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amountTendered}
                    onChange={e => setAmountTendered(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono text-base focus:outline-none focus:border-indigo-500"
                  />
                  {changeDue > 0 && (
                    <div className="mt-2 text-xs font-semibold text-emerald-400 flex justify-between bg-emerald-950/30 p-2 rounded-lg border border-emerald-900/40">
                      <span>Change to Return:</span>
                      <span>{formatMoney(changeDue)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2">
                <button
                  disabled={processingOrder}
                  onClick={handleCompleteSale}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
                >
                  {processingOrder ? 'Recording Transaction...' : `Confirm & Print Receipt (${formatMoney(grandTotal)})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED RECEIPT MODAL */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Transaction Successful</h3>
              <p className="text-xs text-slate-400">Order #{completedOrder.orderNumber}</p>
            </div>

            {/* Printable Thermal Receipt Style */}
            <div className="bg-white text-black p-4 rounded-lg font-mono text-[11px] leading-relaxed shadow my-4 space-y-2">
              <div className="text-center border-b border-dashed border-gray-300 pb-2">
                <div className="font-bold text-sm">{currentBusiness?.name}</div>
                <div className="text-[10px] text-gray-600">{currentBusiness?.address}</div>
                <div className="text-[10px] text-gray-600">Tax ID: {currentBusiness?.taxNumber || 'Standard'}</div>
              </div>

              <div className="border-b border-dashed border-gray-300 pb-2 space-y-1">
                <div>Date: {new Date(completedOrder.createdAt).toLocaleString()}</div>
                <div>Receipt: {completedOrder.orderNumber}</div>
                <div>Cashier: {completedOrder.cashierName}</div>
                <div>Customer: {completedOrder.customerName}</div>
              </div>

              <div className="border-b border-dashed border-gray-300 pb-2 space-y-1">
                {completedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.quantity}x {item.name.substring(0, 16)}</span>
                    <span>{formatMoney(item.total)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-1 font-bold">
                <div className="flex justify-between">
                  <span>TOTAL:</span>
                  <span>{formatMoney(completedOrder.total)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-normal text-gray-600">
                  <span>Paid ({completedOrder.paymentMethod}):</span>
                  <span>{formatMoney(completedOrder.amountPaid)}</span>
                </div>
              </div>

              <div className="text-center text-[9px] text-gray-500 pt-2 border-t border-dashed border-gray-300">
                Thank you for your business! Powered by UBM SaaS.
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setCompletedOrder(null)}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer"
              >
                Next Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
