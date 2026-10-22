export type UserRole = 'owner' | 'admin' | 'manager' | 'cashier' | 'accountant' | 'auditor';

export type BusinessCategory = 
  | 'retail' 
  | 'wholesale' 
  | 'services' 
  | 'hospitality' 
  | 'healthcare' 
  | 'manufacturing' 
  | 'general';

export type SubscriptionPlanId = 'starter' | 'professional' | 'enterprise';

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';

export interface SubscriptionDetails {
  planId: SubscriptionPlanId;
  planName: string;
  status: SubscriptionStatus;
  trialEndsAt: string;
  currentPeriodEnd: string;
  maxBranches: number;
  maxStaff: number;
  maxMonthlyTransactions: number;
  features: string[];
}

export interface UBMCertificate {
  certificateNumber: string;
  verificationCode: string;
  issueDate: string;
  validUntil: string;
  certificateHash: string;
  status: 'issued' | 'revoked';
  issuedBy: string;
  issuerAuthority: string;
  disclaimer: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  phone?: string;
  isHeadquarters: boolean;
}

export interface Business {
  id: string;
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
  subscription: SubscriptionDetails;
  certificate: UBMCertificate;
  branches: Branch[];
  createdAt: string;
  updatedAt: string;
}

export interface BusinessMember {
  id: string; // `${businessId}_${userId}`
  businessId: string;
  userId: string;
  userEmail: string;
  displayName: string;
  role: UserRole;
  branches: string[]; // branch IDs, or ['*'] for all
  status: 'active' | 'invited' | 'suspended';
  createdAt: string;
}

export interface Product {
  id: string;
  businessId: string;
  branchId?: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  taxRate: number; // percentage, e.g. 10
  status: 'active' | 'archived';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface SalesOrder {
  id: string;
  businessId: string;
  branchId: string;
  orderNumber: string;
  type: 'pos' | 'invoice' | 'quote';
  customerId?: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'split';
  status: 'completed' | 'draft' | 'cancelled';
  cashierId: string;
  cashierName: string;
  notes?: string;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface Purchase {
  id: string;
  businessId: string;
  branchId: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  status: 'received' | 'ordered' | 'cancelled';
  receivedDate?: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  businessId: string;
  type: 'customer' | 'supplier' | 'both';
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  creditLimit: number;
  currentBalance: number; // positive = owes us (receivable), negative = we owe them (payable)
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Expense {
  id: string;
  businessId: string;
  branchId: string;
  expenseNumber: string;
  category: string;
  amount: number;
  paymentMethod: string;
  paidTo: string;
  reference?: string;
  date: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface Account {
  id: string;
  businessId: string;
  code: string;
  name: string;
  type: AccountType;
  subType: string;
  currentBalance: number;
  currency: string;
  isSystem?: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  businessId: string;
  userId: string;
  userEmail: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
}

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  isCore: boolean;
  requiredPlan: SubscriptionPlanId;
}

export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  locale: string;
}
