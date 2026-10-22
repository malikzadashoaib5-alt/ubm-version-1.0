import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Award, 
  Lock, 
  ArrowRight,
  LogIn
} from 'lucide-react';
import { useAuth, PLATFORM_ADMIN_EMAIL } from '../../context/AuthContext.tsx';

export const AuthPortal: React.FC = () => {
  const { signInWithGoogle, signInDemoAccount, loading } = useAuth();
  const [signingIn, setSigningIn] = useState<boolean>(false);
  const [customEmail, setCustomEmail] = useState<string>('');

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error(e);
    } finally {
      setSigningIn(false);
    }
  };

  const handleDemoSignIn = async (email: string, displayName: string) => {
    setSigningIn(true);
    try {
      await signInDemoAccount(email, displayName);
    } catch (e) {
      console.error(e);
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center font-black text-white text-2xl mx-auto shadow-xl shadow-indigo-600/30 mb-4 border border-indigo-400/30">
            UBM
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Universal Business Management
          </h1>
          <p className="mt-2 text-xs text-slate-400 max-w-sm mx-auto">
            Multi-Tenant SaaS Platform for Enterprise POS, Inventory, Accounting & Verifiable Cloud Certification
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          {/* Primary Google Login Button */}
          <div>
            <button
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl shadow-lg flex items-center justify-center space-x-3 transition cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google Account</span>
            </button>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-800" />
            <span className="flex-shrink mx-4 text-slate-500 text-xs uppercase tracking-wider font-semibold">
              Or Fast Evaluation Login
            </span>
            <div className="flex-grow border-t border-slate-800" />
          </div>

          {/* Quick 1-Click Persona Logins */}
          <div className="space-y-2.5">
            <button
              onClick={() => handleDemoSignIn(PLATFORM_ADMIN_EMAIL, 'Platform Operator')}
              disabled={signingIn}
              className="w-full p-3 rounded-xl bg-slate-950 border border-indigo-500/30 hover:border-indigo-500/80 text-left flex items-center justify-between transition cursor-pointer group"
            >
              <div>
                <div className="text-xs font-bold text-indigo-300 group-hover:text-white flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Platform Owner & Administrator</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{PLATFORM_ADMIN_EMAIL}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition" />
            </button>

            <button
              onClick={() => handleDemoSignIn('owner@apexhypermarket.com', 'Sarah Jenkins (Owner)')}
              disabled={signingIn}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left flex items-center justify-between transition cursor-pointer group"
            >
              <div>
                <div className="text-xs font-bold text-slate-200 group-hover:text-white">
                  Independent Business Owner
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">owner@apexhypermarket.com</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition" />
            </button>

            <button
              onClick={() => handleDemoSignIn('cashier@apexhypermarket.com', 'Alex Rivera (Cashier)')}
              disabled={signingIn}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left flex items-center justify-between transition cursor-pointer group"
            >
              <div>
                <div className="text-xs font-bold text-slate-200 group-hover:text-white">
                  Store Cashier / POS Staff
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">cashier@apexhypermarket.com</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition" />
            </button>
          </div>

          {/* Custom Email Fast Sign-in */}
          <div className="pt-2">
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Or enter any custom email..."
                value={customEmail}
                onChange={e => setCustomEmail(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                disabled={!customEmail || signingIn}
                onClick={() => handleDemoSignIn(customEmail, customEmail.split('@')[0])}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-40"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500">
          <div className="p-2 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span>Strict Tenant Isolation</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <Award className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
            <span>Verifiable UBM Seal</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <Sparkles className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <span>14-Day Free Trial</span>
          </div>
        </div>
      </div>
    </div>
  );
};
