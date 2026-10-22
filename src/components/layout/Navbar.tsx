import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ChevronDown, 
  Plus, 
  Globe, 
  Wifi, 
  WifiOff, 
  User, 
  LogOut, 
  ShieldAlert, 
  Award,
  Sparkles
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const Navbar: React.FC = () => {
  const { 
    currentBusiness, 
    businesses, 
    currentBranch, 
    switchBusiness, 
    switchBranch, 
    setCurrentView,
    language,
    setLanguage
  } = useTenant();

  const { user, signOut, isPlatformAdmin } = useAuth();
  const [showBizDropdown, setShowBizDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-6 h-16 flex items-center justify-between no-print">
      {/* Brand & Business Switcher */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <div 
          onClick={() => setCurrentView('dashboard')}
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center font-black text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition">
            UBM
          </div>
          <div className="hidden sm:block">
            <span className="font-extrabold text-white text-base tracking-tight leading-none block">UBM</span>
            <span className="text-[10px] text-slate-400 leading-none">Universal Business Management</span>
          </div>
        </div>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-slate-800 hidden sm:block" />

        {/* Multi-Tenant Business Switcher Dropdown */}
        {currentBusiness && (
          <div className="relative">
            <button
              onClick={() => {
                setShowBizDropdown(!showBizDropdown);
                setShowBranchDropdown(false);
              }}
              className="flex items-center space-x-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 transition cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="max-w-[130px] sm:max-w-[180px] truncate">{currentBusiness.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showBizDropdown && (
              <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  Your Business Enterprises
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {businesses.map(b => (
                    <button
                      key={b.id}
                      onClick={() => {
                        switchBusiness(b.id);
                        setShowBizDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-800 transition ${
                        b.id === currentBusiness.id ? 'bg-indigo-600/10 text-indigo-400 font-bold' : 'text-slate-300'
                      }`}
                    >
                      <span className="truncate">{b.name}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{b.category}</span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-slate-800 mt-1 pt-1 px-1">
                  <button
                    onClick={() => {
                      setShowBizDropdown(false);
                      setCurrentView('onboarding');
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-400 hover:bg-indigo-600/10 flex items-center space-x-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Register Another Business</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Branch Switcher Dropdown */}
        {currentBusiness && currentBusiness.branches.length > 1 && (
          <div className="relative hidden md:block">
            <button
              onClick={() => {
                setShowBranchDropdown(!showBranchDropdown);
                setShowBizDropdown(false);
              }}
              className="flex items-center space-x-1.5 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 px-2.5 py-1.5 rounded-xl text-xs text-slate-300 transition cursor-pointer"
            >
              <span className="text-[10px] text-slate-500 uppercase">Branch:</span>
              <span className="font-semibold text-white truncate max-w-[120px]">{currentBranch?.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showBranchDropdown && (
              <div className="absolute left-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-50">
                {currentBusiness.branches.map(br => (
                  <button
                    key={br.id}
                    onClick={() => {
                      switchBranch(br.id);
                      setShowBranchDropdown(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-slate-800 ${
                      br.id === currentBranch?.id ? 'text-indigo-400 font-bold' : 'text-slate-300'
                    }`}
                  >
                    <span>{br.name}</span>
                    <span className="font-mono text-[10px] text-slate-500">{br.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls: Connectivity, Language, Platform Admin, Profile */}
      <div className="flex items-center space-x-3">
        {/* Network / Offline Indicator */}
        <div className="flex items-center space-x-1 text-[11px] px-2 py-1 rounded-lg bg-slate-950 border border-slate-800">
          {isOnline ? (
            <>
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline text-emerald-400">Cloud Sync Active</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-amber-400" />
              <span className="text-amber-400">Offline Caching</span>
            </>
          )}
        </div>

        {/* Multilingual Switcher (EN, ES, FR, AR, UR) */}
        <div className="relative">
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="en">EN</option>
            <option value="es">ES (Español)</option>
            <option value="fr">FR (Français)</option>
            <option value="ar">AR (العربية - RTL)</option>
            <option value="ur">UR (اردو - RTL)</option>
          </select>
        </div>

        {/* Platform Admin Quick Button (Owner only) */}
        {isPlatformAdmin && (
          <button
            onClick={() => setCurrentView('admin')}
            className="px-2.5 py-1 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
            title="Platform Owner Console"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Platform Admin</span>
          </button>
        )}

        {/* User Profile & Sign Out */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center space-x-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 p-1.5 sm:px-3 sm:py-1.5 rounded-xl transition cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="text-xs text-slate-200 hidden sm:inline max-w-[120px] truncate">
              {user?.displayName || user?.email?.split('@')[0]}
            </span>
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50">
              <div className="px-3 py-2 border-b border-slate-800">
                <div className="font-semibold text-xs text-white truncate">{user?.displayName || 'User'}</div>
                <div className="text-[11px] text-slate-400 font-mono truncate">{user?.email}</div>
              </div>
              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  setCurrentView('certificate');
                }}
                className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 flex items-center space-x-2"
              >
                <Award className="w-3.5 h-3.5 text-indigo-400" />
                <span>UBM Certificate</span>
              </button>
              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  setCurrentView('billing');
                }}
                className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 flex items-center space-x-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Subscription Plan</span>
              </button>
              <div className="border-t border-slate-800 my-1" />
              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  signOut();
                }}
                className="w-full px-3 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10 flex items-center space-x-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out Account</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
