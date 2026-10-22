import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { TenantProvider, useTenant } from './context/TenantContext.tsx';
import { AuthPortal } from './components/auth/AuthPortal.tsx';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard.tsx';
import { Navbar } from './components/layout/Navbar.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { DashboardOverview } from './components/dashboard/DashboardOverview.tsx';
import { POSModule } from './components/pos/POSModule.tsx';
import { ProductsModule } from './components/inventory/ProductsModule.tsx';
import { SalesModule } from './components/sales/SalesModule.tsx';
import { PurchasesModule } from './components/purchases/PurchasesModule.tsx';
import { ContactsModule } from './components/contacts/ContactsModule.tsx';
import { ExpensesModule } from './components/expenses/ExpensesModule.tsx';
import { AccountingModule } from './components/accounting/AccountingModule.tsx';
import { ReportsModule } from './components/reports/ReportsModule.tsx';
import { AIAssistantModal } from './components/ai/AIAssistantModal.tsx';
import { UBMCertificateModal } from './components/certificate/UBMCertificateModal.tsx';
import { BillingCenter } from './components/subscription/BillingCenter.tsx';
import { SettingsModule } from './components/settings/SettingsModule.tsx';
import { PlatformAdminArea } from './components/admin/PlatformAdminArea.tsx';
import { RefreshCw } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { currentBusiness, currentView, loading: tenantLoading } = useTenant();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-white text-xl animate-pulse">
            UBM
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Initializing Cloud Multi-Tenant Engine...</span>
          </div>
        </div>
      </div>
    );
  }

  // Mandatory Requirement 1: Every customer has an authenticated account
  if (!user) {
    return <AuthPortal />;
  }

  // Mandatory Requirement 1 & 3: Each new customer starts with onboarding, never another customer's business
  if (!currentBusiness || currentView === 'onboarding') {
    return <OnboardingWizard />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-slate-950/60 pb-12">
          {currentView === 'dashboard' && <DashboardOverview />}
          {currentView === 'pos' && <POSModule />}
          {currentView === 'products' && <ProductsModule />}
          {currentView === 'sales' && <SalesModule />}
          {currentView === 'purchases' && <PurchasesModule />}
          {currentView === 'contacts' && <ContactsModule />}
          {currentView === 'expenses' && <ExpensesModule />}
          {currentView === 'accounting' && <AccountingModule />}
          {currentView === 'reports' && <ReportsModule />}
          {currentView === 'ai_assistant' && <AIAssistantModal />}
          {currentView === 'certificate' && <div className="p-6"><UBMCertificateModal business={currentBusiness} /></div>}
          {currentView === 'billing' && <BillingCenter />}
          {currentView === 'settings' && <SettingsModule />}
          {currentView === 'admin' && <PlatformAdminArea />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <MainAppContent />
      </TenantProvider>
    </AuthProvider>
  );
}
