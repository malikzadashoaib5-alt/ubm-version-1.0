import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  FileText, 
  Truck, 
  Users, 
  Receipt, 
  BookOpen, 
  BarChart3, 
  Sparkles, 
  Award, 
  CreditCard, 
  Settings, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface NavItem {
  id: string;
  name: string;
  icon: any;
  moduleId?: string;
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, isModuleActive, currentBusiness } = useTenant();
  const { isPlatformAdmin } = useAuth();

  const navigation: { group: string; items: NavItem[] }[] = [
    {
      group: 'Overview & Front Desk',
      items: [
        { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
        { id: 'pos', name: 'POS Terminal', icon: ShoppingCart, moduleId: 'pos', badge: 'Fast' }
      ]
    },
    {
      group: 'Commercial & Operations',
      items: [
        { id: 'products', name: 'Products & Inventory', icon: Package, moduleId: 'products' },
        { id: 'sales', name: 'Sales & Invoices', icon: FileText, moduleId: 'sales' },
        { id: 'purchases', name: 'Purchases & Bills', icon: Truck, moduleId: 'purchases' },
        { id: 'contacts', name: 'Customers & Vendors', icon: Users, moduleId: 'contacts' }
      ]
    },
    {
      group: 'Financials & Intelligence',
      items: [
        { id: 'expenses', name: 'Operating Expenses', icon: Receipt, moduleId: 'expenses' },
        { id: 'accounting', name: 'General Ledger', icon: BookOpen, moduleId: 'accounting' },
        { id: 'reports', name: 'Financial Reports & P&L', icon: BarChart3, moduleId: 'reports' },
        { id: 'ai_assistant', name: 'AI Business Advisor', icon: Sparkles, moduleId: 'ai_assistant', badge: 'AI' }
      ]
    },
    {
      group: 'Compliance & Governance',
      items: [
        { id: 'certificate', name: 'UBM Setup Certificate', icon: Award, moduleId: 'certificate' },
        { id: 'billing', name: 'Plans & Quotas', icon: CreditCard },
        { id: 'settings', name: 'Tenant Settings', icon: Settings }
      ]
    }
  ];

  if (isPlatformAdmin) {
    navigation.push({
      group: 'Platform Super Admin',
      items: [
        { id: 'admin', name: 'Platform Operations', icon: ShieldCheck, badge: 'Root' }
      ]
    });
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-[calc(100vh-64px)] sticky top-16 no-print overflow-y-auto">
      <div className="p-3 space-y-6">
        {navigation.map(grp => {
          // Filter items by active module if applicable
          const visibleItems = grp.items.filter(item => 
            !item.moduleId || isModuleActive(item.moduleId)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={grp.group} className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 block mb-1">
                {grp.group}
              </span>

              {visibleItems.map(item => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <item.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                    </div>

                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-indigo-500/10 text-indigo-400'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Bottom Tenant Footer Card */}
      {currentBusiness && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-white truncate max-w-[140px]">
              {currentBusiness.name}
            </span>
            <span className="text-[10px] font-mono text-indigo-400 uppercase">
              {currentBusiness.subscription.planId}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono truncate">
            Cert: {currentBusiness.certificate.certificateNumber}
          </div>
        </div>
      )}
    </aside>
  );
};
