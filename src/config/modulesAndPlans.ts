import { ModuleDefinition, SubscriptionPlanId, BusinessCategory, CurrencyConfig } from '../types/index.ts';

export const MODULE_REGISTRY: ModuleDefinition[] = [
  { id: 'pos', name: 'Point of Sale (POS)', description: 'Fast cashier terminal with barcode scanning, receipts & multi-pay', icon: 'ShoppingCart', category: 'sales', isCore: true, requiredPlan: 'starter' },
  { id: 'sales', name: 'Sales & Invoicing', description: 'Quotes, commercial invoices, receivable tracking and delivery notes', icon: 'FileText', category: 'sales', isCore: true, requiredPlan: 'starter' },
  { id: 'products', name: 'Inventory & Products', description: 'Item catalogue, SKU/barcodes, reorder levels and stock management', icon: 'Package', category: 'inventory', isCore: true, requiredPlan: 'starter' },
  { id: 'purchases', name: 'Purchases & Bills', description: 'Purchase orders, supplier bills, stock intake and payables', icon: 'Truck', category: 'procurement', isCore: true, requiredPlan: 'starter' },
  { id: 'contacts', name: 'Customers & Suppliers', description: 'Customer & vendor CRM, credit limits, contact history', icon: 'Users', category: 'crm', isCore: true, requiredPlan: 'starter' },
  { id: 'expenses', name: 'Expense Tracking', description: 'Operating expense vouchers, categories and cash outflow records', icon: 'Receipt', category: 'finance', isCore: true, requiredPlan: 'starter' },
  { id: 'accounting', name: 'Chart of Accounts & Ledger', description: 'Double-entry accounting, cashbook, general journal & trial balance', icon: 'BookOpen', category: 'finance', isCore: false, requiredPlan: 'professional' },
  { id: 'reports', name: 'Financial Reports & P&L', description: 'Income statement, balance sheet, tax summary and sales analytics', icon: 'BarChart3', category: 'analytics', isCore: true, requiredPlan: 'starter' },
  { id: 'ai_assistant', name: 'AI Business Advisor', description: 'Gemini-powered executive summaries, cashflow forecast and smart reorder', icon: 'Sparkles', category: 'ai', isCore: false, requiredPlan: 'professional' },
  { id: 'certificate', name: 'UBM Verifiable Certificate', description: 'Cryptographically sealed setup certificate and public verification URL', icon: 'Award', category: 'compliance', isCore: true, requiredPlan: 'starter' },
  { id: 'multi_branch', name: 'Multi-Branch Management', description: 'Branch-level inventory isolation, branch permissions and transfers', icon: 'Building2', category: 'organization', isCore: false, requiredPlan: 'enterprise' },
  { id: 'audit_logs', name: 'Security & Audit History', description: 'Immutable transaction trails, actor tracking and security records', icon: 'ShieldCheck', category: 'compliance', isCore: true, requiredPlan: 'starter' }
];

export const SUBSCRIPTION_PLANS = [
  {
    id: 'starter' as SubscriptionPlanId,
    name: 'Starter Plan',
    monthlyPrice: 29,
    annualPrice: 290,
    trialDays: 14,
    description: 'Essential business engine for independent stores and growing ventures',
    maxBranches: 1,
    maxStaff: 3,
    maxMonthlyTransactions: 1000,
    features: [
      'Core POS Terminal & Barcode Scanner',
      'Sales & Standard Invoicing',
      'Product Catalogue (up to 1,000 items)',
      'Customer & Supplier Directory',
      'Expense Tracker & Receipts',
      'Verifiable UBM Setup Certificate',
      '14-day Full Feature Trial'
    ]
  },
  {
    id: 'professional' as SubscriptionPlanId,
    name: 'Professional Plan',
    monthlyPrice: 79,
    annualPrice: 790,
    trialDays: 14,
    popular: true,
    description: 'Comprehensive ERP for scaling businesses and multi-service firms',
    maxBranches: 3,
    maxStaff: 10,
    maxMonthlyTransactions: 10000,
    features: [
      'Everything in Starter',
      'Double-Entry Accounting & General Ledger',
      'P&L Statement & Balance Sheet',
      'Purchase Orders & Payables Management',
      'AI Business Advisor (Gemini powered)',
      'Up to 3 Branches / Warehouses',
      'Credit Limit Controls & Aging Reports',
      'Priority Email Support'
    ]
  },
  {
    id: 'enterprise' as SubscriptionPlanId,
    name: 'Enterprise Plan',
    monthlyPrice: 199,
    annualPrice: 1990,
    trialDays: 14,
    description: 'Unlimited capacity for multi-branch chains, manufacturing & large enterprises',
    maxBranches: 25,
    maxStaff: 50,
    maxMonthlyTransactions: 100000,
    features: [
      'Everything in Professional',
      'Unlimited Branches & Locations',
      'Up to 50 Staff Members with Role RBAC',
      'Advanced Multi-branch Stock Transfers',
      'Dedicated Verification SLA',
      'Custom Chart of Accounts & Tax Rules',
      'Audit Trail Export & API Webhooks',
      '24/7 Dedicated Account Manager'
    ]
  }
];

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US' },
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'de-DE' },
  { code: 'GBP', name: 'British Pound', symbol: '£', locale: 'en-GB' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED', locale: 'ar-AE' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', locale: 'ar-SA' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', locale: 'ur-PK' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', locale: 'en-IN' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', locale: 'en-CA' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', locale: 'en-AU' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', locale: 'ja-JP' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', locale: 'en-SG' }
];

export const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Riyadh',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney'
];

export const INDUSTRY_CATEGORIES: { id: BusinessCategory; name: string; description: string; defaultModules: string[] }[] = [
  {
    id: 'retail',
    name: 'Retail Store & Supermarket',
    description: 'Point of sale, barcode scanning, fast checkout, variant inventory, customer loyalty',
    defaultModules: ['pos', 'sales', 'products', 'purchases', 'contacts', 'expenses', 'reports', 'certificate', 'audit_logs']
  },
  {
    id: 'wholesale',
    name: 'Wholesale & Distribution',
    description: 'Bulk purchase orders, credit terms, warehouse stock control, customer credit limits',
    defaultModules: ['sales', 'products', 'purchases', 'contacts', 'expenses', 'accounting', 'reports', 'certificate', 'audit_logs']
  },
  {
    id: 'services',
    name: 'Professional Services & Consulting',
    description: 'Service invoicing, client accounts, expense claims, profit & loss analysis',
    defaultModules: ['sales', 'contacts', 'expenses', 'accounting', 'reports', 'ai_assistant', 'certificate', 'audit_logs']
  },
  {
    id: 'hospitality',
    name: 'Restaurant, Cafe & Hospitality',
    description: 'Table / counter POS, food ingredient costs, daily cashier reconciliation, cashbook',
    defaultModules: ['pos', 'sales', 'products', 'expenses', 'reports', 'certificate', 'audit_logs']
  },
  {
    id: 'healthcare',
    name: 'Healthcare, Clinic & Pharmacy',
    description: 'Medicine inventory, prescription sales, supplier batches, patient billing',
    defaultModules: ['pos', 'sales', 'products', 'purchases', 'contacts', 'expenses', 'reports', 'certificate', 'audit_logs']
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing & Workshop',
    description: 'Raw materials inventory, production batch expenses, supplier payables, distribution invoicing',
    defaultModules: ['sales', 'products', 'purchases', 'contacts', 'expenses', 'accounting', 'reports', 'certificate', 'audit_logs']
  },
  {
    id: 'general',
    name: 'General Commercial Enterprise',
    description: 'Versatile foundation supporting all standard commercial operations and accounting',
    defaultModules: ['pos', 'sales', 'products', 'purchases', 'contacts', 'expenses', 'reports', 'certificate', 'audit_logs']
  }
];

export const DEFAULT_CHART_OF_ACCOUNTS = [
  { code: '1010', name: 'Operating Cash on Hand', type: 'asset' as const, subType: 'Current Asset', currentBalance: 5000 },
  { code: '1020', name: 'Primary Bank Account', type: 'asset' as const, subType: 'Current Asset', currentBalance: 25000 },
  { code: '1200', name: 'Accounts Receivable', type: 'asset' as const, subType: 'Current Asset', currentBalance: 0 },
  { code: '1400', name: 'Inventory Asset', type: 'asset' as const, subType: 'Current Asset', currentBalance: 12000 },
  { code: '2010', name: 'Accounts Payable', type: 'liability' as const, subType: 'Current Liability', currentBalance: 0 },
  { code: '2020', name: 'Sales Tax / VAT Payable', type: 'liability' as const, subType: 'Current Liability', currentBalance: 0 },
  { code: '3010', name: 'Owner Equity & Retained Capital', type: 'equity' as const, subType: 'Equity', currentBalance: 42000 },
  { code: '4010', name: 'General Sales Revenue', type: 'revenue' as const, subType: 'Operating Revenue', currentBalance: 0 },
  { code: '5010', name: 'Cost of Goods Sold (COGS)', type: 'expense' as const, subType: 'Cost of Sales', currentBalance: 0 },
  { code: '6010', name: 'Rent & Premises', type: 'expense' as const, subType: 'Operating Expense', currentBalance: 0 },
  { code: '6020', name: 'Utilities & Telecom', type: 'expense' as const, subType: 'Operating Expense', currentBalance: 0 },
  { code: '6030', name: 'Salaries & Wages', type: 'expense' as const, subType: 'Payroll Expense', currentBalance: 0 },
  { code: '6040', name: 'Office & Supplies', type: 'expense' as const, subType: 'Administrative Expense', currentBalance: 0 }
];
