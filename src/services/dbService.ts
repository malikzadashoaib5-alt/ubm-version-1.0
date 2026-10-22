import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  increment 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase.ts';
import { 
  Business, 
  BusinessMember, 
  Product, 
  SalesOrder, 
  Purchase, 
  Contact, 
  Expense, 
  Account, 
  AuditLog, 
  SubscriptionPlanId, 
  BusinessCategory 
} from '../types/index.ts';
import { createNewUBMCertificate } from '../utils/certificate.ts';
import { DEFAULT_CHART_OF_ACCOUNTS, SUBSCRIPTION_PLANS, INDUSTRY_CATEGORIES } from '../config/modulesAndPlans.ts';

// Audit Log Helper
export async function createAuditLog(
  businessId: string, 
  userId: string, 
  userEmail: string, 
  action: string, 
  module: string, 
  details: string
): Promise<void> {
  const path = 'auditLogs';
  try {
    const logRef = doc(collection(db, path));
    const logData: AuditLog = {
      id: logRef.id,
      businessId,
      userId,
      userEmail,
      action,
      module,
      details,
      timestamp: new Date().toISOString()
    };
    await setDoc(logRef, logData);
  } catch (err) {
    console.error('Audit log failed:', err);
    // Don't block core flow if logging fails
  }
}

// -------------------------------------------------------------
// BUSINESS & ONBOARDING
// -------------------------------------------------------------
export async function createNewBusiness(params: {
  name: string;
  legalName?: string;
  category: BusinessCategory;
  ownerId: string;
  ownerEmail: string;
  baseCurrency: string;
  currencySymbol: string;
  taxNumber?: string;
  registrationNumber?: string;
  email: string;
  phone?: string;
  address: string;
  country: string;
  city: string;
  timezone: string;
  activeModules: string[];
  planId: SubscriptionPlanId;
  branchName: string;
  branchAddress: string;
}): Promise<Business> {
  const businessId = 'biz_' + Math.random().toString(36).substring(2, 10);
  const selectedPlan = SUBSCRIPTION_PLANS.find(p => p.id === params.planId) || SUBSCRIPTION_PLANS[0];

  const now = new Date();
  const trialEnds = new Date(now.getTime() + selectedPlan.trialDays * 24 * 60 * 60 * 1000);
  const currentPeriod = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const certificate = await createNewUBMCertificate(params.name, params.ownerId, params.taxNumber);

  const headquarterBranch = {
    id: 'br_hq_' + Math.random().toString(36).substring(2, 6),
    name: params.branchName || 'Headquarters',
    code: 'HQ-01',
    address: params.branchAddress || params.address,
    phone: params.phone,
    isHeadquarters: true
  };

  const businessData: Business = {
    id: businessId,
    name: params.name,
    legalName: params.legalName || params.name,
    category: params.category,
    ownerId: params.ownerId,
    ownerEmail: params.ownerEmail,
    baseCurrency: params.baseCurrency,
    currencySymbol: params.currencySymbol,
    taxNumber: params.taxNumber || '',
    registrationNumber: params.registrationNumber || '',
    email: params.email,
    phone: params.phone || '',
    address: params.address,
    country: params.country,
    city: params.city,
    timezone: params.timezone,
    activeModules: params.activeModules,
    subscription: {
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      status: 'trialing',
      trialEndsAt: trialEnds.toISOString(),
      currentPeriodEnd: currentPeriod.toISOString(),
      maxBranches: selectedPlan.maxBranches,
      maxStaff: selectedPlan.maxStaff,
      maxMonthlyTransactions: selectedPlan.maxMonthlyTransactions,
      features: selectedPlan.features
    },
    certificate,
    branches: [headquarterBranch],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  const path = 'businesses';
  try {
    await setDoc(doc(db, path, businessId), businessData);

    // Create Owner membership record
    const memberId = `${businessId}_${params.ownerId}`;
    const memberData: BusinessMember = {
      id: memberId,
      businessId,
      userId: params.ownerId,
      userEmail: params.ownerEmail,
      displayName: params.ownerEmail.split('@')[0],
      role: 'owner',
      branches: ['*'],
      status: 'active',
      createdAt: now.toISOString()
    };
    await setDoc(doc(db, 'businessMembers', memberId), memberData);

    // Initialize Default Chart of Accounts for this tenant
    for (const acc of DEFAULT_CHART_OF_ACCOUNTS) {
      const accRef = doc(collection(db, 'accounts'));
      await setDoc(accRef, {
        id: accRef.id,
        businessId,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        subType: acc.subType,
        currentBalance: acc.currentBalance,
        currency: params.baseCurrency,
        isSystem: true,
        createdAt: now.toISOString()
      });
    }

    // Record audit log
    await createAuditLog(
      businessId,
      params.ownerId,
      params.ownerEmail,
      'CREATE_BUSINESS',
      'ONBOARDING',
      `Registered business "${params.name}" with plan ${selectedPlan.name} and certificate ${certificate.certificateNumber}`
    );

    return businessData;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function getUserBusinesses(userId: string): Promise<Business[]> {
  const path = 'businesses';
  try {
    // 1. Fetch businesses where user is owner
    const qOwner = query(collection(db, path), where('ownerId', '==', userId));
    const snapOwner = await getDocs(qOwner);
    const businesses: Business[] = snapOwner.docs.map(d => d.data() as Business);

    // 2. Fetch businesses where user is a team member
    const qMembers = query(collection(db, 'businessMembers'), where('userId', '==', userId));
    const snapMembers = await getDocs(qMembers);
    for (const memDoc of snapMembers.docs) {
      const mem = memDoc.data() as BusinessMember;
      if (!businesses.some(b => b.id === mem.businessId)) {
        const bDoc = await getDoc(doc(db, 'businesses', mem.businessId));
        if (bDoc.exists()) {
          businesses.push(bDoc.data() as Business);
        }
      }
    }

    return businesses;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function updateBusinessSubscription(
  businessId: string, 
  planId: SubscriptionPlanId, 
  status: 'active' | 'trialing' | 'canceled'
): Promise<void> {
  const selectedPlan = SUBSCRIPTION_PLANS.find(p => p.id === planId) || SUBSCRIPTION_PLANS[0];
  const now = new Date();
  const currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await updateDoc(doc(db, 'businesses', businessId), {
    'subscription.planId': selectedPlan.id,
    'subscription.planName': selectedPlan.name,
    'subscription.status': status,
    'subscription.maxBranches': selectedPlan.maxBranches,
    'subscription.maxStaff': selectedPlan.maxStaff,
    'subscription.maxMonthlyTransactions': selectedPlan.maxMonthlyTransactions,
    'subscription.features': selectedPlan.features,
    'subscription.currentPeriodEnd': currentPeriodEnd,
    updatedAt: now.toISOString()
  });
}

// -------------------------------------------------------------
// PRODUCTS & INVENTORY
// -------------------------------------------------------------
export async function getProducts(businessId: string): Promise<Product[]> {
  const path = 'products';
  try {
    const q = query(collection(db, path), where('businessId', '==', businessId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Product);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Product> {
  const path = 'products';
  try {
    const isNew = !product.id;
    const prodRef = isNew ? doc(collection(db, path)) : doc(db, path, product.id!);
    const now = new Date().toISOString();

    const fullProduct: Product = {
      ...product,
      id: prodRef.id,
      createdAt: isNew ? now : ((product as any).createdAt || now),
      updatedAt: now
    };

    await setDoc(prodRef, fullProduct);
    return fullProduct;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function adjustStock(productId: string, adjustmentDelta: number, reason: string): Promise<void> {
  const path = 'products';
  try {
    await updateDoc(doc(db, path, productId), {
      stockQuantity: increment(adjustmentDelta),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

// -------------------------------------------------------------
// SALES & POS
// -------------------------------------------------------------
export async function getSalesOrders(businessId: string): Promise<SalesOrder[]> {
  const path = 'salesOrders';
  try {
    const q = query(collection(db, path), where('businessId', '==', businessId));
    const snap = await getDocs(q);
    const orders = snap.docs.map(d => d.data() as SalesOrder);
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function createSalesOrder(order: Omit<SalesOrder, 'id' | 'createdAt'>): Promise<SalesOrder> {
  const path = 'salesOrders';
  try {
    const orderRef = doc(collection(db, path));
    const now = new Date().toISOString();
    const fullOrder: SalesOrder = {
      ...order,
      id: orderRef.id,
      createdAt: now
    };

    await setDoc(orderRef, fullOrder);

    // Atomically decrement stock for each sold item
    for (const item of order.items) {
      if (item.productId) {
        try {
          await updateDoc(doc(db, 'products', item.productId), {
            stockQuantity: increment(-item.quantity),
            updatedAt: now
          });
        } catch {
          // Continue if product not found or unmanaged
        }
      }
    }

    // If customer has balance due, update contact ledger
    if (order.customerId && order.balanceDue > 0) {
      try {
        await updateDoc(doc(db, 'contacts', order.customerId), {
          currentBalance: increment(order.balanceDue)
        });
      } catch {
        // Continue
      }
    }

    await createAuditLog(
      order.businessId,
      order.cashierId,
      order.cashierName,
      'CREATE_SALES_ORDER',
      'SALES',
      `Order ${order.orderNumber} created for ${order.total} (Status: ${order.paymentStatus})`
    );

    return fullOrder;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

// -------------------------------------------------------------
// PURCHASES & SUPPLIER INTAKE
// -------------------------------------------------------------
export async function getPurchases(businessId: string): Promise<Purchase[]> {
  const path = 'purchases';
  try {
    const q = query(collection(db, path), where('businessId', '==', businessId));
    const snap = await getDocs(q);
    const purchases = snap.docs.map(d => d.data() as Purchase);
    return purchases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function createPurchase(purchase: Omit<Purchase, 'id' | 'createdAt'>): Promise<Purchase> {
  const path = 'purchases';
  try {
    const ref = doc(collection(db, path));
    const now = new Date().toISOString();
    const fullPurchase: Purchase = {
      ...purchase,
      id: ref.id,
      createdAt: now
    };

    await setDoc(ref, fullPurchase);

    // If status is received, increment stock
    if (purchase.status === 'received') {
      for (const item of purchase.items) {
        if (item.productId) {
          try {
            await updateDoc(doc(db, 'products', item.productId), {
              stockQuantity: increment(item.quantity),
              costPrice: item.unitCost, // Update latest purchase cost
              updatedAt: now
            });
          } catch {
            // Ignore
          }
        }
      }
    }

    // Update supplier payable balance if there is balance due
    if (purchase.supplierId && purchase.balanceDue > 0) {
      try {
        await updateDoc(doc(db, 'contacts', purchase.supplierId), {
          currentBalance: increment(-purchase.balanceDue) // negative = we owe them
        });
      } catch {
        // Ignore
      }
    }

    return fullPurchase;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

// -------------------------------------------------------------
// CONTACTS (Customers & Suppliers)
// -------------------------------------------------------------
export async function getContacts(businessId: string): Promise<Contact[]> {
  const path = 'contacts';
  try {
    const q = query(collection(db, path), where('businessId', '==', businessId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Contact);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveContact(contact: Omit<Contact, 'id' | 'createdAt'> & { id?: string }): Promise<Contact> {
  const path = 'contacts';
  try {
    const isNew = !contact.id;
    const ref = isNew ? doc(collection(db, path)) : doc(db, path, contact.id!);
    const now = new Date().toISOString();

    const fullContact: Contact = {
      ...contact,
      id: ref.id,
      createdAt: isNew ? now : ((contact as any).createdAt || now)
    };

    await setDoc(ref, fullContact);
    return fullContact;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// -------------------------------------------------------------
// EXPENSES
// -------------------------------------------------------------
export async function getExpenses(businessId: string): Promise<Expense[]> {
  const path = 'expenses';
  try {
    const q = query(collection(db, path), where('businessId', '==', businessId));
    const snap = await getDocs(q);
    const expenses = snap.docs.map(d => d.data() as Expense);
    return expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function createExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
  const path = 'expenses';
  try {
    const ref = doc(collection(db, path));
    const now = new Date().toISOString();
    const fullExpense: Expense = {
      ...expense,
      id: ref.id,
      createdAt: now
    };

    await setDoc(ref, fullExpense);
    return fullExpense;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

// -------------------------------------------------------------
// CHART OF ACCOUNTS & GENERAL LEDGER
// -------------------------------------------------------------
export async function getAccounts(businessId: string): Promise<Account[]> {
  const path = 'accounts';
  try {
    const q = query(collection(db, path), where('businessId', '==', businessId));
    const snap = await getDocs(q);
    const accounts = snap.docs.map(d => d.data() as Account);
    return accounts.sort((a, b) => a.code.localeCompare(b.code));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function createAccount(account: Omit<Account, 'id' | 'createdAt'>): Promise<Account> {
  const path = 'accounts';
  try {
    const ref = doc(collection(db, path));
    const now = new Date().toISOString();
    const fullAccount: Account = {
      ...account,
      id: ref.id,
      createdAt: now
    };

    await setDoc(ref, fullAccount);
    return fullAccount;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

// -------------------------------------------------------------
// AUDIT LOGS
// -------------------------------------------------------------
export async function getAuditLogs(businessId: string): Promise<AuditLog[]> {
  const path = 'auditLogs';
  try {
    const q = query(collection(db, path), where('businessId', '==', businessId));
    const snap = await getDocs(q);
    const logs = snap.docs.map(d => d.data() as AuditLog);
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 100);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// -------------------------------------------------------------
// SEED STARTER SAMPLE DATA FOR QUICK TRIAL
// -------------------------------------------------------------
export async function seedIndustryStarterData(business: Business): Promise<void> {
  const sampleProducts: Partial<Product>[] = [
    { name: 'Executive Organic Arabica Coffee (1kg)', sku: 'CF-1001', barcode: '8901234567891', category: 'Beverages', unit: 'kg', costPrice: 12.50, sellingPrice: 24.00, stockQuantity: 85, reorderLevel: 20, taxRate: 5 },
    { name: 'Ultra-Slim Mechanical Wireless Keyboard', sku: 'IT-5021', barcode: '8901234567892', category: 'Electronics', unit: 'pcs', costPrice: 45.00, sellingPrice: 89.99, stockQuantity: 34, reorderLevel: 10, taxRate: 10 },
    { name: 'Industrial Thermal Receipt Paper (Pack of 10)', sku: 'POS-008', barcode: '8901234567893', category: 'Supplies', unit: 'pack', costPrice: 8.00, sellingPrice: 16.50, stockQuantity: 120, reorderLevel: 25, taxRate: 5 },
    { name: 'Ergonomic Executive Mesh Office Chair', sku: 'FUR-209', barcode: '8901234567894', category: 'Furniture', unit: 'pcs', costPrice: 110.00, sellingPrice: 220.00, stockQuantity: 14, reorderLevel: 5, taxRate: 10 },
    { name: 'Commercial Grade Barcode Scanner 2D USB', sku: 'POS-012', barcode: '8901234567895', category: 'Hardware', unit: 'pcs', costPrice: 38.00, sellingPrice: 75.00, stockQuantity: 42, reorderLevel: 12, taxRate: 10 }
  ];

  for (const sp of sampleProducts) {
    await saveProduct({
      businessId: business.id,
      branchId: business.branches[0]?.id,
      name: sp.name!,
      sku: sp.sku!,
      barcode: sp.barcode,
      category: sp.category!,
      unit: sp.unit!,
      costPrice: sp.costPrice!,
      sellingPrice: sp.sellingPrice!,
      stockQuantity: sp.stockQuantity!,
      reorderLevel: sp.reorderLevel!,
      taxRate: sp.taxRate!,
      status: 'active'
    });
  }

  // Seed sample customer and supplier
  const customer = await saveContact({
    businessId: business.id,
    type: 'customer',
    name: 'Apex Global Logistics Ltd',
    companyName: 'Apex Global',
    email: 'purchasing@apexlogistics.com',
    phone: '+1 800 555 0192',
    address: '450 West Harbor Blvd, Suite 800',
    creditLimit: 5000,
    currentBalance: 0,
    status: 'active'
  });

  const supplier = await saveContact({
    businessId: business.id,
    type: 'supplier',
    name: 'Pacific Hardware Distributors Inc',
    companyName: 'Pacific Hardware',
    email: 'orders@pacifichardware.net',
    phone: '+1 888 234 5678',
    address: '1200 Terminal Island Way',
    creditLimit: 20000,
    currentBalance: 0,
    status: 'active'
  });

  // Seed sample sales order
  await createSalesOrder({
    businessId: business.id,
    branchId: business.branches[0]?.id || 'br_hq',
    orderNumber: 'INV-2026-0001',
    type: 'invoice',
    customerId: customer.id,
    customerName: customer.name,
    items: [
      {
        productId: '',
        name: 'Ultra-Slim Mechanical Wireless Keyboard',
        sku: 'IT-5021',
        quantity: 2,
        unitPrice: 89.99,
        discount: 0,
        taxRate: 10,
        taxAmount: 18.00,
        total: 197.98
      }
    ],
    subtotal: 179.98,
    discountTotal: 0,
    taxTotal: 18.00,
    total: 197.98,
    amountPaid: 197.98,
    balanceDue: 0,
    paymentStatus: 'paid',
    paymentMethod: 'card',
    status: 'completed',
    cashierId: business.ownerId,
    cashierName: business.ownerEmail.split('@')[0],
    notes: 'Initial opening transaction'
  });

  // Seed sample expense
  await createExpense({
    businessId: business.id,
    branchId: business.branches[0]?.id || 'br_hq',
    expenseNumber: 'EXP-001',
    category: 'Rent & Premises',
    amount: 1200,
    paymentMethod: 'bank_transfer',
    paidTo: 'Metropolitan Commercial Realty Corp',
    reference: 'RENT-OCT-2026',
    date: new Date().toISOString().split('T')[0],
    notes: 'Monthly headquarters office lease',
    recordedBy: business.ownerEmail
  });

  await createAuditLog(
    business.id,
    business.ownerId,
    business.ownerEmail,
    'SEED_SAMPLE_DATA',
    'SYSTEM',
    'Seeded starter catalogue, sample customer, supplier, invoice, and expense records.'
  );
}
