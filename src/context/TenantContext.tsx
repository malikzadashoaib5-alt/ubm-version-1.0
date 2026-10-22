import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Business, Branch, SubscriptionPlanId } from '../types/index.ts';
import { useAuth } from './AuthContext.tsx';
import { getUserBusinesses } from '../services/dbService.ts';
import { SUPPORTED_CURRENCIES } from '../config/modulesAndPlans.ts';

interface TenantContextType {
  currentBusiness: Business | null;
  businesses: Business[];
  currentBranch: Branch | null;
  currentView: string;
  loading: boolean;
  language: string;
  isRTL: boolean;
  switchBusiness: (businessId: string) => void;
  switchBranch: (branchId: string) => void;
  setCurrentView: (view: string) => void;
  setLanguage: (lang: string) => void;
  refreshBusinesses: () => Promise<void>;
  formatMoney: (amount: number) => string;
  isModuleActive: (moduleId: string) => boolean;
  canAccessPlanFeature: (minPlan: SubscriptionPlanId) => boolean;
  trialDaysRemaining: number;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);
  const [language, setLanguageState] = useState<string>('en');

  const refreshBusinesses = useCallback(async () => {
    if (!user) {
      setBusinesses([]);
      setCurrentBusiness(null);
      setCurrentBranch(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const bizList = await getUserBusinesses(user.uid);
      setBusinesses(bizList);

      if (bizList.length > 0) {
        // If current business not set or not in list, pick the first
        const matched = currentBusiness ? bizList.find(b => b.id === currentBusiness.id) : null;
        const activeBiz = matched || bizList[0];
        setCurrentBusiness(activeBiz);
        setCurrentBranch(activeBiz.branches[0] || null);
      } else {
        setCurrentBusiness(null);
        setCurrentBranch(null);
        setCurrentView('onboarding');
      }
    } catch (e) {
      console.error('Failed to load user businesses:', e);
    } finally {
      setLoading(false);
    }
  }, [user, currentBusiness?.id]);

  useEffect(() => {
    refreshBusinesses();
  }, [user]);

  const switchBusiness = (businessId: string) => {
    const biz = businesses.find(b => b.id === businessId);
    if (biz) {
      setCurrentBusiness(biz);
      setCurrentBranch(biz.branches[0] || null);
    }
  };

  const switchBranch = (branchId: string) => {
    if (currentBusiness) {
      const br = currentBusiness.branches.find(b => b.id === branchId);
      if (br) {
        setCurrentBranch(br);
      }
    }
  };

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    if (lang === 'ar' || lang === 'ur') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  };

  const isRTL = language === 'ar' || language === 'ur';

  const formatMoney = (amount: number): string => {
    if (!currentBusiness) {
      return `$${amount.toFixed(2)}`;
    }
    const currCfg = SUPPORTED_CURRENCIES.find(c => c.code === currentBusiness.baseCurrency);
    const symbol = currentBusiness.currencySymbol || currCfg?.symbol || '$';
    return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const isModuleActive = (moduleId: string): boolean => {
    if (!currentBusiness) return false;
    return currentBusiness.activeModules?.includes(moduleId) ?? true;
  };

  const canAccessPlanFeature = (minPlan: SubscriptionPlanId): boolean => {
    if (!currentBusiness) return false;
    const planHierarchy: Record<SubscriptionPlanId, number> = {
      starter: 1,
      professional: 2,
      enterprise: 3
    };
    const currentTier = planHierarchy[currentBusiness.subscription.planId] || 1;
    const requiredTier = planHierarchy[minPlan] || 1;
    return currentTier >= requiredTier;
  };

  const trialDaysRemaining = React.useMemo(() => {
    if (!currentBusiness || currentBusiness.subscription.status !== 'trialing') return 0;
    const diffMs = new Date(currentBusiness.subscription.trialEndsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, [currentBusiness]);

  return (
    <TenantContext.Provider value={{
      currentBusiness,
      businesses,
      currentBranch,
      currentView,
      loading,
      language,
      isRTL,
      switchBusiness,
      switchBranch,
      setCurrentView,
      setLanguage,
      refreshBusinesses,
      formatMoney,
      isModuleActive,
      canAccessPlanFeature,
      trialDaysRemaining
    }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
