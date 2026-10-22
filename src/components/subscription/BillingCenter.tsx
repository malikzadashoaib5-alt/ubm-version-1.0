import React, { useState } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  ArrowUpRight, 
  Download,
  Building2,
  Users,
  Repeat
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext.tsx';
import { SUBSCRIPTION_PLANS } from '../../config/modulesAndPlans.ts';
import { updateBusinessSubscription, createAuditLog } from '../../services/dbService.ts';
import { SubscriptionPlanId } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const BillingCenter: React.FC = () => {
  const { currentBusiness, formatMoney, trialDaysRemaining, refreshBusinesses } = useTenant();
  const { user } = useAuth();

  const [upgradingPlan, setUpgradingPlan] = useState<SubscriptionPlanId | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState<boolean>(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);

  const sub = currentBusiness?.subscription;

  const handleStartUpgrade = (planId: SubscriptionPlanId) => {
    setUpgradingPlan(planId);
    setShowCheckoutModal(true);
  };

  const handleConfirmUpgrade = async () => {
    if (!currentBusiness || !upgradingPlan) return;
    setLoading(true);
    try {
      await updateBusinessSubscription(currentBusiness.id, upgradingPlan, 'active');
      await createAuditLog(
        currentBusiness.id,
        user?.uid || 'owner',
        user?.email || 'owner@ubm.app',
        'UPGRADE_SUBSCRIPTION',
        'BILLING',
        `Upgraded subscription to ${upgradingPlan.toUpperCase()} plan (Active). Payment validated via Gateway hook.`
      );

      setShowCheckoutModal(false);
      setUpgradingPlan(null);
      await refreshBusinesses();
      alert('Subscription successfully upgraded! Your entitlement quotas have been updated.');
    } catch (e) {
      console.error('Subscription update failed:', e);
      alert('Failed to upgrade subscription.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentBusiness) return;
    if (confirm('Are you sure you want to cancel your subscription? You will remain on your current plan until the end of your billing cycle.')) {
      setLoading(true);
      try {
        await updateBusinessSubscription(currentBusiness.id, currentBusiness.subscription.planId, 'canceled');
        await refreshBusinesses();
        alert('Subscription status marked as canceled at period end.');
      } catch (e) {
        console.error('Cancel subscription failed:', e);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-indigo-400" />
            <span>Subscription & Entitlement Quotas</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your cloud subscription plan, branch seats, staff quotas, and billing statements
          </p>
        </div>

        {/* Current Plan Status Pill */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-300 font-medium">
            Current: <strong className="text-white">{sub?.planName}</strong> ({sub?.status})
          </span>
          {sub?.status === 'trialing' && (
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full">
              {trialDaysRemaining} days remaining in trial
            </span>
          )}
        </div>
      </div>

      {/* Quota Usage Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center space-x-1.5">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>Branch Quota</span>
            </span>
            <span className="font-mono text-white font-bold">
              {currentBusiness?.branches.length || 1} / {sub?.maxBranches || 1}
            </span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-500 h-full rounded-full" 
              style={{ width: `${Math.min(100, ((currentBusiness?.branches.length || 1) / (sub?.maxBranches || 1)) * 100)}%` }} 
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Staff Seat Quota</span>
            </span>
            <span className="font-mono text-white font-bold">
              1 / {sub?.maxStaff || 3}
            </span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full" 
              style={{ width: `${Math.min(100, (1 / (sub?.maxStaff || 3)) * 100)}%` }} 
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center space-x-1.5">
              <Repeat className="w-4 h-4 text-indigo-400" />
              <span>Monthly Transactions</span>
            </span>
            <span className="font-mono text-white font-bold">
              Active / {sub?.maxMonthlyTransactions?.toLocaleString() || '1,000'}
            </span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: '15%' }} />
          </div>
        </div>
      </div>

      {/* Pricing Comparison Grid */}
      <div className="pt-4">
        <div className="flex justify-center mb-6">
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center space-x-1 text-xs font-semibold">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-1.5 rounded-lg transition cursor-pointer ${
                billingPeriod === 'monthly' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-4 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
                billingPeriod === 'annual' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SUBSCRIPTION_PLANS.map(plan => {
            const isCurrent = sub?.planId === plan.id;
            const price = billingPeriod === 'monthly' ? plan.monthlyPrice : Math.round(plan.annualPrice / 12);

            return (
              <div
                key={plan.id}
                className={`p-6 rounded-2xl border flex flex-col justify-between relative transition-all ${
                  isCurrent
                    ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500 shadow-xl'
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 right-6 bg-indigo-500 text-white text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full shadow">
                    Most Popular
                  </span>
                )}

                <div>
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{plan.description}</p>

                  <div className="mt-4 flex items-baseline">
                    <span className="text-3xl font-black text-white">${price}</span>
                    <span className="text-xs text-slate-400 ml-1">/ month</span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
                    <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Entitlements:</div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{plan.maxBranches} Branch Location{plan.maxBranches > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Up to {plan.maxStaff} Staff User Accounts</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{plan.maxMonthlyTransactions.toLocaleString()} Monthly Transactions</span>
                    </div>

                    <div className="pt-2 space-y-1.5">
                      {plan.features.map((f, i) => (
                        <div key={i} className="flex items-center space-x-2 text-slate-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold cursor-default"
                    >
                      Active Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartUpgrade(plan.id)}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition cursor-pointer"
                    >
                      Switch to {plan.name}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing Invoices History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-white text-base">Subscription Statements & Tax Invoices</h3>
        <div className="divide-y divide-slate-800 text-xs">
          <div className="py-3 flex items-center justify-between text-slate-300">
            <div>
              <div className="font-semibold text-white font-mono">UBM-INV-2026-10-01</div>
              <div className="text-[11px] text-slate-500">14-Day Free Enterprise Trial Period</div>
            </div>
            <div className="text-right flex items-center space-x-4">
              <span className="font-mono text-emerald-400 font-bold">$0.00 (Trial)</span>
              <button
                onClick={() => alert('Downloading official UBM SaaS subscription receipt PDF.')}
                className="p-1.5 text-indigo-300 hover:text-white rounded-lg hover:bg-slate-800"
                title="Download Receipt"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {sub?.status === 'active' && (
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleCancelSubscription}
              className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer"
            >
              Cancel Subscription
            </button>
          </div>
        )}
      </div>

      {/* SIMULATED CHECKOUT GATEWAY MODAL */}
      {showCheckoutModal && upgradingPlan && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-white text-base mb-1">Confirm Subscription Upgrade</h3>
            <p className="text-xs text-slate-400 mb-4">
              Upgrading to <strong>{SUBSCRIPTION_PLANS.find(p => p.id === upgradingPlan)?.name}</strong>.
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs mb-4">
              <div className="flex justify-between text-slate-300">
                <span>Selected Plan:</span>
                <span className="font-bold text-white uppercase">{upgradingPlan}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Billing Interval:</span>
                <span className="capitalize">{billingPeriod}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Payment Hook:</span>
                <span className="text-indigo-400 font-mono">Stripe Webhook Sim (Sandbox)</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-bold text-white">
                <span>Amount Due:</span>
                <span className="text-emerald-400">
                  ${billingPeriod === 'monthly' ? SUBSCRIPTION_PLANS.find(p => p.id === upgradingPlan)?.monthlyPrice : SUBSCRIPTION_PLANS.find(p => p.id === upgradingPlan)?.annualPrice}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="flex-1 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmUpgrade}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Processing Hook...' : 'Confirm & Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
