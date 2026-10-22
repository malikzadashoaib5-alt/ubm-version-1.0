import React, { useState } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Package, 
  ShieldCheck, 
  Globe, 
  Layers, 
  Award, 
  Sparkles,
  CreditCard,
  Briefcase
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTenant } from '../../context/TenantContext.tsx';
import { 
  INDUSTRY_CATEGORIES, 
  MODULE_REGISTRY, 
  SUPPORTED_CURRENCIES, 
  TIMEZONES, 
  SUBSCRIPTION_PLANS 
} from '../../config/modulesAndPlans.ts';
import { BusinessCategory, SubscriptionPlanId, Business } from '../../types/index.ts';
import { createNewBusiness, seedIndustryStarterData } from '../../services/dbService.ts';

export const OnboardingWizard: React.FC = () => {
  const { user } = useAuth();
  const { refreshBusinesses, setCurrentView } = useTenant();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [createdBusiness, setCreatedBusiness] = useState<Business | null>(null);

  // Form State
  const [category, setCategory] = useState<BusinessCategory>('retail');
  const [selectedModules, setSelectedModules] = useState<string[]>(
    INDUSTRY_CATEGORIES.find(c => c.id === 'retail')?.defaultModules || ['pos', 'sales', 'products', 'contacts']
  );
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');
  const [timezone, setTimezone] = useState<string>('America/New_York');
  const [businessName, setBusinessName] = useState<string>('');
  const [legalName, setLegalName] = useState<string>('');
  const [taxNumber, setTaxNumber] = useState<string>('');
  const [registrationNumber, setRegistrationNumber] = useState<string>('');
  const [businessEmail, setBusinessEmail] = useState<string>(user?.email || '');
  const [businessPhone, setBusinessPhone] = useState<string>('+1 (555) 019-2834');
  const [address, setAddress] = useState<string>('100 Enterprise Way, Suite 400');
  const [city, setCity] = useState<string>('New York');
  const [country, setCountry] = useState<string>('United States');
  const [branchName, setBranchName] = useState<string>('Main Store / HQ');
  const [planId, setPlanId] = useState<SubscriptionPlanId>('professional');
  const [seedSampleData, setSeedSampleData] = useState<boolean>(true);
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(true);

  const handleCategorySelect = (catId: BusinessCategory) => {
    setCategory(catId);
    const cat = INDUSTRY_CATEGORIES.find(c => c.id === catId);
    if (cat) {
      setSelectedModules(cat.defaultModules);
    }
  };

  const toggleModule = (modId: string) => {
    setSelectedModules(prev => 
      prev.includes(modId) ? prev.filter(m => m !== modId) : [...prev, modId]
    );
  };

  const handleCreateBusiness = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const currObj = SUPPORTED_CURRENCIES.find(c => c.code === baseCurrency);
      const biz = await createNewBusiness({
        name: businessName || 'My Global Enterprise',
        legalName: legalName || businessName,
        category,
        ownerId: user.uid,
        ownerEmail: user.email || 'owner@ubm-saas.com',
        baseCurrency,
        currencySymbol: currObj?.symbol || '$',
        taxNumber,
        registrationNumber,
        email: businessEmail || user.email || '',
        phone: businessPhone,
        address,
        country,
        city,
        timezone,
        activeModules: selectedModules,
        planId,
        branchName,
        branchAddress: address
      });

      if (seedSampleData) {
        try {
          await seedIndustryStarterData(biz);
        } catch (e) {
          console.warn('Seeding sample data failed, continuing:', e);
        }
      }

      setCreatedBusiness(biz);
      setStep(7); // Certificate screen

      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Ignore
      }

      await refreshBusinesses();
    } catch (err) {
      console.error('Business creation failed:', err);
      alert('Failed to initialize business tenant. Check connection and permissions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto w-full mb-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/20">
              UBM
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Universal Business Management</h1>
              <p className="text-xs text-slate-400">Enterprise Multi-Tenant SaaS Onboarding</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Step {step} of 7
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
          <div 
            className="bg-indigo-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${(step / 7) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Content Card */}
      <div className="max-w-4xl mx-auto w-full bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-6 sm:p-10 shadow-2xl flex-1 flex flex-col justify-between">
        
        {/* STEP 1: CATEGORY SELECTION */}
        {step === 1 && (
          <div>
            <div className="mb-6">
              <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider">Step 1: Classification</span>
              <h2 className="text-2xl font-extrabold text-white mt-1">Select Your Business Category</h2>
              <p className="text-slate-400 text-sm mt-1">
                UBM tailors inventory schemas, POS configurations, and accounting presets based on your industry sector.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[420px] overflow-y-auto pr-1">
              {INDUSTRY_CATEGORIES.map(cat => {
                const isSelected = category === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500' 
                        : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <Briefcase className={`w-5 h-5 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                        <h3 className="font-semibold text-slate-100">{cat.name}</h3>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">{cat.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: MODULE SELECTION */}
        {step === 2 && (
          <div>
            <div className="mb-6">
              <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider">Step 2: Architecture</span>
              <h2 className="text-2xl font-extrabold text-white mt-1">Activate Business Modules</h2>
              <p className="text-slate-400 text-sm mt-1">
                Select the operational modules to provision. You can enable or disable additional modules at any time.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
              {MODULE_REGISTRY.map(mod => {
                const isChecked = selectedModules.includes(mod.id);
                return (
                  <div
                    key={mod.id}
                    onClick={() => toggleModule(mod.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isChecked 
                        ? 'border-indigo-500 bg-indigo-500/10' 
                        : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-sm text-slate-100">{mod.name}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                      <p className="text-xs text-slate-400">{mod.description}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="uppercase tracking-wider">{mod.category}</span>
                      {mod.isCore && <span className="text-indigo-400 font-medium">Core Module</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: BASE CURRENCY & REGION */}
        {step === 3 && (
          <div>
            <div className="mb-6">
              <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider">Step 3: Financial Localization</span>
              <h2 className="text-2xl font-extrabold text-white mt-1">Base Currency & System Timezone</h2>
              <p className="text-slate-400 text-sm mt-1">
                Your base currency establishes the accounting ledger standard for sales, stock valuation, and tax reports.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Operating Base Currency
                </label>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {SUPPORTED_CURRENCIES.map(curr => (
                    <div
                      key={curr.code}
                      onClick={() => setBaseCurrency(curr.code)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        baseCurrency === curr.code
                          ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500'
                          : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="w-8 h-8 rounded-lg bg-slate-700 text-indigo-400 font-bold flex items-center justify-center text-sm">
                          {curr.symbol}
                        </span>
                        <div>
                          <div className="font-semibold text-sm text-slate-100">{curr.name}</div>
                          <div className="text-xs text-slate-400">{curr.code}</div>
                        </div>
                      </div>
                      {baseCurrency === curr.code && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Business Timezone
                </label>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {TIMEZONES.map(tz => (
                    <div
                      key={tz}
                      onClick={() => setTimezone(tz)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        timezone === tz
                          ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500'
                          : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-sm font-medium text-slate-200">{tz}</span>
                      {timezone === tz && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: BUSINESS INFORMATION */}
        {step === 4 && (
          <div>
            <div className="mb-6">
              <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider">Step 4: Legal & Contact Profile</span>
              <h2 className="text-2xl font-extrabold text-white mt-1">Business Identity & Headquarter Details</h2>
              <p className="text-slate-400 text-sm mt-1">
                Information entered here will appear on your verifiable UBM setup certificate, invoices, and customer receipts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Trade / Operating Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Hypermarket & Logistics"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Registered Legal Entity Name</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Global Operations LLC"
                  value={legalName}
                  onChange={e => setLegalName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tax ID / VAT Registration Number</label>
                <input
                  type="text"
                  placeholder="e.g. US-TAX-94827103"
                  value={taxNumber}
                  onChange={e => setTaxNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Commercial Registration Number</label>
                <input
                  type="text"
                  placeholder="e.g. CR-8892019"
                  value={registrationNumber}
                  onChange={e => setRegistrationNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Business Support Email *</label>
                <input
                  type="email"
                  required
                  value={businessEmail}
                  onChange={e => setBusinessEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Official Contact Phone</label>
                <input
                  type="tel"
                  value={businessPhone}
                  onChange={e => setBusinessPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">Headquarters Street Address *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Country *</label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">Initial Branch / Store Name</label>
                <input
                  type="text"
                  value={branchName}
                  onChange={e => setBranchName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: VERIFICATION & COMPLIANCE */}
        {step === 5 && (
          <div>
            <div className="mb-6">
              <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider">Step 5: Cloud Verification</span>
              <h2 className="text-2xl font-extrabold text-white mt-1">Accreditation & Compliance Notice</h2>
              <p className="text-slate-400 text-sm mt-1">
                UBM generates verifiable certificates to authenticate that your business tenant is operational, isolated, and provisioned on dedicated cloud storage.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex items-start space-x-3.5">
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-emerald-300 text-sm">Tenant Isolation Protocol</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    All inventory records, sales transactions, POS receipts, and general ledger accounts will be segregated under your business ID with Firestore security rules.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-600/30 flex items-start space-x-3.5">
                <Award className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-300 text-sm">Statutory Legal Disclaimer</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    The UBM Business Setup Certificate is an independent software accreditation certifying operational deployment within the UBM SaaS ecosystem. It is NOT an official state or government regulatory license.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-700">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={e => setAgreedToTerms(e.target.checked)}
                    className="mt-1 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-300 leading-relaxed">
                    I verify that I am authorized to represent this enterprise, accept the UBM Cloud Service Level Agreement, and acknowledge that tenant data isolation is enforced under my credentials.
                  </span>
                </label>
              </div>

              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-600/30">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={seedSampleData}
                    onChange={e => setSeedSampleData(e.target.checked)}
                    className="mt-1 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-indigo-200">Pre-seed with realistic industry starter catalogue & transactions (Recommended)</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Instantly loads sample products, inventory stock, sample customer & supplier, and an opening invoice so you can test POS, inventory, and reports immediately.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: SUBSCRIPTION & 14-DAY TRIAL */}
        {step === 6 && (
          <div>
            <div className="mb-6">
              <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider">Step 6: Subscription Tier</span>
              <h2 className="text-2xl font-extrabold text-white mt-1">Select Your Plan (14-Day Free Trial)</h2>
              <p className="text-slate-400 text-sm mt-1">
                Every new customer begins with an unrestricted 14-day full feature trial. No payment card required to start.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SUBSCRIPTION_PLANS.map(plan => {
                const isSelected = planId === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setPlanId(plan.id)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between relative ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500 shadow-xl shadow-indigo-500/10'
                        : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 right-4 bg-indigo-500 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shadow">
                        Recommended
                      </span>
                    )}

                    <div>
                      <h3 className="font-bold text-slate-100 text-lg">{plan.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">{plan.description}</p>
                      
                      <div className="mt-4 flex items-baseline">
                        <span className="text-3xl font-extrabold text-white">${plan.monthlyPrice}</span>
                        <span className="text-xs text-slate-400 ml-1">/ month</span>
                      </div>

                      <div className="mt-2 text-[11px] text-emerald-400 font-medium">
                        ✓ 14-day risk-free trial included
                      </div>

                      <ul className="mt-4 space-y-2 text-xs text-slate-300 border-t border-slate-700/60 pt-4">
                        {plan.features.slice(0, 4).map((f, i) => (
                          <li key={i} className="flex items-center space-x-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span className="truncate">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6">
                      <div className={`w-full py-2 rounded-lg text-center text-xs font-semibold ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {isSelected ? 'Selected Plan' : 'Select Plan'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 7: UBM CERTIFICATE & SUCCESS */}
        {step === 7 && createdBusiness && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <Award className="w-9 h-9" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Accredited & Activated</span>
            <h2 className="text-3xl font-extrabold text-white mt-1">Business Setup Certificate Generated</h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto mt-2">
              Enterprise <strong className="text-white">{createdBusiness.name}</strong> is securely provisioned in the cloud with tenant isolation.
            </p>

            {/* Certificate Preview Card */}
            <div className="mt-6 max-w-xl mx-auto bg-slate-900 border-2 border-indigo-500/40 rounded-xl p-6 text-left relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Official Cloud Certificate</span>
                  <div className="text-sm font-bold text-white">{createdBusiness.certificate.certificateNumber}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400">Verification Hash</span>
                  <div className="text-xs font-mono text-slate-300 truncate max-w-[150px]">
                    {createdBusiness.certificate.certificateHash.substring(0, 16)}...
                  </div>
                </div>
              </div>

              <div className="py-4 space-y-2">
                <div className="text-lg font-bold text-white">{createdBusiness.name}</div>
                <div className="text-xs text-slate-400">
                  Category: <span className="text-slate-200 capitalize">{createdBusiness.category}</span> | Currency: <span className="text-slate-200">{createdBusiness.baseCurrency}</span>
                </div>
                <div className="text-xs text-slate-400">
                  Headquarters: <span className="text-slate-200">{createdBusiness.address}, {createdBusiness.city}, {createdBusiness.country}</span>
                </div>
                <div className="text-xs text-slate-400">
                  Subscription: <span className="text-indigo-400 font-semibold">{createdBusiness.subscription.planName}</span> (14-Day Free Trial)
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 text-[10px] text-slate-500 italic">
                {createdBusiness.certificate.disclaimer}
              </div>
            </div>

            <div className="mt-8 flex justify-center space-x-4">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all cursor-pointer"
              >
                <span>Launch Enterprise Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Navigation Buttons (for Steps 1 to 6) */}
        {step < 7 && (
          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-700/50 flex items-center space-x-2 text-sm font-medium transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : <div />}

            {step < 6 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 4 && (!businessName.trim() || !address.trim())) {
                    alert('Please enter your business operating name and headquarters address.');
                    return;
                  }
                  if (step === 5 && !agreedToTerms) {
                    alert('Please accept the cloud service terms and tenant isolation policy to continue.');
                    return;
                  }
                  setStep(step + 1);
                }}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center space-x-2 text-sm font-semibold transition shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                <span>Next Step</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleCreateBusiness}
                className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white flex items-center space-x-2 text-sm font-bold transition shadow-xl shadow-indigo-600/25 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Provisioning Tenant...</span>
                ) : (
                  <>
                    <span>Complete & Issue Certificate</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto w-full text-center mt-6 text-xs text-slate-500">
        UBM Universal Business Management Cloud • Multi-Tenant Isolated PostgreSQL / Firestore Engine • Active User: {user?.email}
      </div>
    </div>
  );
};
