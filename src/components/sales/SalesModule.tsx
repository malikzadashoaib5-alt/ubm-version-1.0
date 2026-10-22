import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Printer, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Eye,
  RefreshCw,
  X,
  CreditCard,
  User
} from 'lucide-react';
import { SalesOrder, Product, Contact, OrderItem } from '../../types/index.ts';
import { useTenant } from '../../context/TenantContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { getSalesOrders, getProducts, getContacts, createSalesOrder } from '../../services/dbService.ts';

export const SalesModule: React.FC = () => {
  const { currentBusiness, currentBranch, formatMoney } = useTenant();
  const { user } = useAuth();

  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // New Invoice Form
  const [customerId, setCustomerId] = useState<string>('');
  const [invoiceType, setInvoiceType] = useState<'invoice' | 'quote'>('invoice');
  const [invoiceItems, setInvoiceItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState<string>('Payment terms: Net 30 days.');

  const loadData = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      const [ord, prods, conts] = await Promise.all([
        getSalesOrders(currentBusiness.id),
        getProducts(currentBusiness.id),
        getContacts(currentBusiness.id)
      ]);
      setOrders(ord);
      setProducts(prods);
      setContacts(conts.filter(c => c.type === 'customer' || c.type === 'both'));
    } catch (e) {
      console.error('Error loading sales orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBusiness?.id]);

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddItemToInvoice = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const sub = prod.sellingPrice;
    const tax = sub * ((prod.taxRate || 0) / 100);

    setInvoiceItems(prev => [
      ...prev,
      {
        productId: prod.id,
        name: prod.name,
        sku: prod.sku,
        quantity: 1,
        unitPrice: prod.sellingPrice,
        discount: 0,
        taxRate: prod.taxRate || 0,
        taxAmount: tax,
        total: sub + tax
      }
    ]);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness || invoiceItems.length === 0) return;

    const rawSubtotal = invoiceItems.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0);
    const taxTotal = invoiceItems.reduce((acc, i) => acc + i.taxAmount, 0);
    const total = rawSubtotal + taxTotal;
    const cust = contacts.find(c => c.id === customerId);

    try {
      const orderNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await createSalesOrder({
        businessId: currentBusiness.id,
        branchId: currentBranch?.id || 'br_hq',
        orderNumber,
        type: invoiceType,
        customerId: cust?.id,
        customerName: cust?.name || 'Standard Client',
        items: invoiceItems,
        subtotal: rawSubtotal,
        discountTotal: 0,
        taxTotal,
        total,
        amountPaid: 0,
        balanceDue: total,
        paymentStatus: 'unpaid',
        paymentMethod: 'bank_transfer',
        status: 'completed',
        cashierId: user?.uid || 'staff',
        cashierName: user?.displayName || user?.email?.split('@')[0] || 'Sales Rep',
        notes
      });

      setShowCreateModal(false);
      setInvoiceItems([]);
      setCustomerId('');
      loadData();
    } catch (e) {
      console.error('Invoice creation failed:', e);
      alert('Failed to generate invoice.');
    }
  };

  const totalSalesVolume = orders.reduce((acc, o) => acc + o.total, 0);
  const totalReceivables = orders.reduce((acc, o) => acc + o.balanceDue, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span>Sales & Commercial Invoicing</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Commercial invoices, pro-forma quotes, accounts receivable, and delivery documentation
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 transition cursor-pointer"
            title="Refresh Invoices"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setInvoiceItems([]);
              setShowCreateModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Commercial Invoice</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium">Total Orders Issued</span>
          <div className="text-2xl font-bold text-white mt-1">{orders.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium">Total Billed Revenue</span>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{formatMoney(totalSalesVolume)}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium">Outstanding Receivables</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">{formatMoney(totalReceivables)}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium">Payment Rate</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {totalSalesVolume > 0 ? `${(((totalSalesVolume - totalReceivables) / totalSalesVolume) * 100).toFixed(0)}%` : '100%'}
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by order # or client name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Payment Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid in Full</option>
              <option value="partial">Partially Paid</option>
              <option value="unpaid">Unpaid / Due</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Invoice # & Date</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Invoice Total</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Payment Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white font-mono">{order.orderNumber}</div>
                    <div className="text-[10px] text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-200">
                    {order.customerName}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] uppercase font-bold text-slate-400">
                      {order.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white">
                    {formatMoney(order.total)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    <span className={order.balanceDue > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                      {formatMoney(order.balanceDue)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      order.paymentStatus === 'paid' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : order.paymentStatus === 'partial' 
                        ? 'bg-amber-500/10 text-amber-400' 
                        : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {order.paymentStatus.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] font-medium flex items-center space-x-1 ml-auto transition cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View Invoice</span>
                    </button>
                  </td>
                </tr>
              ))}

              {filteredOrders.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    No sales records found. Invoices created in POS or using the creator above will show here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED PRINTABLE INVOICE VIEWER */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 no-print">
              <h3 className="font-bold text-white text-base">Commercial Document #{selectedOrder.orderNumber}</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Invoice</span>
                </button>
                <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Friendly Document Frame */}
            <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-xl font-sans text-xs shadow space-y-6">
              <div className="flex justify-between items-start border-b border-gray-200 pb-4">
                <div>
                  <h1 className="text-xl font-black text-indigo-900">{currentBusiness?.name}</h1>
                  <p className="text-gray-600">{currentBusiness?.address}</p>
                  <p className="text-gray-600">Tax Registration: {currentBusiness?.taxNumber || 'Standard Reg'}</p>
                  <p className="text-gray-600">Email: {currentBusiness?.email}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black uppercase tracking-wider text-gray-800">{selectedOrder.type}</div>
                  <div className="font-mono text-gray-600 mt-1">#{selectedOrder.orderNumber}</div>
                  <div className="text-gray-500">Date: {new Date(selectedOrder.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-bold uppercase text-[10px] text-gray-500">Billed To:</span>
                  <div className="font-bold text-sm text-gray-900 mt-1">{selectedOrder.customerName}</div>
                </div>
                <div className="text-right">
                  <span className="font-bold uppercase text-[10px] text-gray-500">Payment Status:</span>
                  <div className="font-bold text-sm uppercase text-indigo-700 mt-1">{selectedOrder.paymentStatus}</div>
                  <div className="text-gray-500">Method: {selectedOrder.paymentMethod}</div>
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300 text-gray-600 uppercase text-[10px]">
                    <th className="py-2">Description</th>
                    <th className="py-2 text-right">Qty</th>
                    <th className="py-2 text-right">Unit Price</th>
                    <th className="py-2 text-right">Tax</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedOrder.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 font-medium">{item.name}</td>
                      <td className="py-2 text-right">{item.quantity}</td>
                      <td className="py-2 text-right font-mono">{formatMoney(item.unitPrice)}</td>
                      <td className="py-2 text-right font-mono">{formatMoney(item.taxAmount)}</td>
                      <td className="py-2 text-right font-mono font-bold">{formatMoney(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end border-t-2 border-gray-300 pt-3">
                <div className="w-64 space-y-1.5 text-right font-mono">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>{formatMoney(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax:</span>
                    <span>{formatMoney(selectedOrder.taxTotal)}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm text-gray-900 border-t border-gray-300 pt-1">
                    <span>Total:</span>
                    <span>{formatMoney(selectedOrder.total)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Amount Paid:</span>
                    <span>{formatMoney(selectedOrder.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between text-rose-700 font-bold">
                    <span>Balance Due:</span>
                    <span>{formatMoney(selectedOrder.balanceDue)}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="border-t border-gray-200 pt-3 text-[11px] text-gray-500 italic">
                  <strong>Notes:</strong> {selectedOrder.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW INVOICE BUILDER */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-white text-base">New Commercial Invoice Builder</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Select Customer *</label>
                  <select
                    required
                    value={customerId}
                    onChange={e => setCustomerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Choose registered customer...</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.companyName || 'Individual'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Document Type</label>
                  <select
                    value={invoiceType}
                    onChange={e => setInvoiceType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="invoice">Standard Commercial Invoice</option>
                    <option value="quote">Formal Quotation / Estimate</option>
                  </select>
                </div>
              </div>

              {/* Add line item from catalogue */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Add Product from Catalog</label>
                <select
                  onChange={e => {
                    if (e.target.value) {
                      handleAddItemToInvoice(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select item to add...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - {formatMoney(p.sellingPrice)} (Stock: {p.stockQuantity})</option>
                  ))}
                </select>
              </div>

              {/* Selected line items list */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {invoiceItems.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-white">{item.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {item.quantity} x {formatMoney(item.unitPrice)} (+{item.taxRate}% tax)
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white font-mono">{formatMoney(item.total)}</span>
                      <button
                        type="button"
                        onClick={() => setInvoiceItems(prev => prev.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {invoiceItems.length === 0 && (
                  <div className="text-center py-6 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                    No items added yet. Select products above to populate this invoice.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Invoice Notes & Payment Instructions</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={invoiceItems.length === 0 || !customerId}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg transition cursor-pointer disabled:opacity-40"
                >
                  Generate Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
