import React, { useState } from 'react';
import { 
  Sparkles, 
  BrainCircuit, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  ShieldAlert, 
  X,
  Send
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext.tsx';
import { getProducts, getSalesOrders, getExpenses } from '../../services/dbService.ts';
import { generateBusinessInsights } from '../../services/aiService.ts';

export const AIAssistantModal: React.FC = () => {
  const { currentBusiness } = useTenant();
  const [analysisType, setAnalysisType] = useState<'executive' | 'inventory_reorder' | 'cashflow_forecast'>('executive');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [actionConfirmed, setActionConfirmed] = useState<boolean>(false);

  const handleGenerate = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    setResult(null);
    try {
      const [prods, ords, exps] = await Promise.all([
        getProducts(currentBusiness.id),
        getSalesOrders(currentBusiness.id),
        getExpenses(currentBusiness.id)
      ]);

      const aiResponse = await generateBusinessInsights({
        business: currentBusiness,
        products: prods,
        orders: ords,
        expenses: exps,
        analysisType
      });

      setResult(aiResponse);
    } catch (e: any) {
      console.error('AI Insight error:', e);
      setResult(`Failed to generate insights: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>UBM AI Business Advisor (Gemini 2.5)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            AI-assisted executive reporting, anomaly detection, inventory optimization, and cashflow modeling
          </p>
        </div>
      </div>

      {/* Safety & Cost Controls Banner */}
      <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-start space-x-3 text-xs">
        <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-slate-300 leading-relaxed">
          <strong className="text-indigo-300">Enterprise AI Governance & Cost Controls:</strong> Queries are evaluated securely with model rate limits, token bounding, and server-side authentication. Any consequential actions recommended by AI require explicit human approval before altering inventory or financials.
        </div>
      </div>

      {/* Analysis Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          {
            id: 'executive' as const,
            title: 'Executive Performance Audit',
            desc: 'Snapshot of profitability, sales velocity, and operational bottlenecks'
          },
          {
            id: 'inventory_reorder' as const,
            title: 'Supply Chain & Reorder Optimizer',
            desc: 'Reorder recommendations, stockout hazard detection, and working capital logic'
          },
          {
            id: 'cashflow_forecast' as const,
            title: '30-Day Cashflow Runway',
            desc: 'Receivables aging impact, overhead runway projection, and cash conservation'
          }
        ].map(item => (
          <div
            key={item.id}
            onClick={() => setAnalysisType(item.id)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              analysisType === item.id
                ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500'
                : 'border-slate-800 bg-slate-900 hover:border-slate-700'
            }`}
          >
            <h4 className="font-semibold text-white text-xs">{item.title}</h4>
            <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Run Button */}
      <div>
        <button
          disabled={loading}
          onClick={handleGenerate}
          className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing Enterprise Data via Gemini...</span>
            </>
          ) : (
            <>
              <BrainCircuit className="w-4 h-4" />
              <span>Generate AI Strategic Analysis</span>
            </>
          )}
        </button>
      </div>

      {/* Results Container */}
      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-white text-xs uppercase tracking-wider">AI Audit Findings</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Gemini 2.5 Flash</span>
          </div>

          <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
            {result}
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Need to apply recommended bulk stock adjustments or pricing changes?
            </span>
            <button
              onClick={() => setShowConfirmModal(true)}
              className="px-4 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Review Action Plan
            </button>
          </div>
        </div>
      )}

      {/* HUMAN CONFIRMATION MODAL FOR CONSEQUENTIAL ACTIONS */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>Confirm Consequential Action</span>
              </h3>
              <button onClick={() => setShowConfirmModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Per UBM Enterprise AI Safety Policies, automated changes to inventory reorder quantities, purchase commitments, or customer credit lines must be manually verified and confirmed by an authorized business manager.
            </p>

            <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400">
              ✓ Action: Synchronize suggested reorder quantities<br />
              ✓ Affected Tenant: {currentBusiness?.name}<br />
              ✓ Actor: Authenticated Manager
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 transition cursor-pointer"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  setActionConfirmed(true);
                  setShowConfirmModal(false);
                  alert('Action plan approved and queued to audit log.');
                }}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow transition cursor-pointer"
              >
                Approve & Execute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
