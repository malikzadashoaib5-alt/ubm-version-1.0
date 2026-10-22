import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Building2, 
  Users, 
  Layers, 
  ShieldCheck, 
  Plus, 
  RefreshCw,
  CheckCircle2,
  Lock,
  X,
  History
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { MODULE_REGISTRY } from '../../config/modulesAndPlans.ts';
import { getAuditLogs, createAuditLog } from '../../services/dbService.ts';
import { AuditLog, Branch, UserRole } from '../../types/index.ts';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase.ts';

export const SettingsModule: React.FC = () => {
  const { currentBusiness, refreshBusinesses, formatMoney } = useTenant();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'branches' | 'team' | 'modules' | 'audit'>('profile');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Profile Form
  const [businessName, setBusinessName] = useState(currentBusiness?.name || '');
  const [taxNumber, setTaxNumber] = useState(currentBusiness?.taxNumber || '');
  const [phone, setPhone] = useState(currentBusiness?.phone || '');
  const [address, setAddress] = useState(currentBusiness?.address || '');

  // Add Branch Modal
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');

  // Add Team Member Modal
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<UserRole>('cashier');

  useEffect(() => {
    if (currentBusiness) {
      setBusinessName(currentBusiness.name);
      setTaxNumber(currentBusiness.taxNumber || '');
      setPhone(currentBusiness.phone || '');
      setAddress(currentBusiness.address);
    }
  }, [currentBusiness]);

  const loadLogs = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      const logs = await getAuditLogs(currentBusiness.id);
      setAuditLogs(logs);
    } catch (e) {
      console.error('Audit log fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      loadLogs();
    }
  }, [activeTab, currentBusiness?.id]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'businesses', currentBusiness.id), {
        name: businessName,
        taxNumber,
        phone,
        address,
        updatedAt: new Date().toISOString()
      });
      await createAuditLog(
        currentBusiness.id,
        user?.uid || 'owner',
        user?.email || 'owner@ubm.app',
        'UPDATE_PROFILE',
        'SETTINGS',
        `Updated corporate settings for ${businessName}`
      );
      await refreshBusinesses();
      alert('Business profile updated.');
    } catch (e) {
      console.error('Update failed:', e);
      alert('Error updating business profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness || !newBranchName) return;

    // Check branch quota
    const maxBranches = currentBusiness.subscription.maxBranches || 1;
    if (currentBusiness.branches.length >= maxBranches) {
      alert(`Branch quota reached (${maxBranches}). Please upgrade to Professional or Enterprise in Billing Center.`);
      return;
    }

    const newBranch: Branch = {
      id: 'br_' + Math.random().toString(36).substring(2, 8),
      name: newBranchName,
      code: `BR-0${currentBusiness.branches.length + 1}`,
      address: newBranchAddress || currentBusiness.address,
      isHeadquarters: false
    };

    try {
      const updatedBranches = [...currentBusiness.branches, newBranch];
      await updateDoc(doc(db, 'businesses', currentBusiness.id), {
        branches: updatedBranches,
        updatedAt: new Date().toISOString()
      });
      await createAuditLog(
        currentBusiness.id,
        user?.uid || 'owner',
        user?.email || 'owner@ubm.app',
        'CREATE_BRANCH',
        'BRANCHES',
        `Added branch "${newBranch.name}" (${newBranch.code})`
      );
      setShowAddBranch(false);
      setNewBranchName('');
      setNewBranchAddress('');
      await refreshBusinesses();
      alert('New branch added successfully.');
    } catch (e) {
      console.error('Error adding branch:', e);
      alert('Failed to add branch.');
    }
  };

  const handleToggleModule = async (modId: string) => {
    if (!currentBusiness) return;
    const currentMods = currentBusiness.activeModules || [];
    const newMods = currentMods.includes(modId)
      ? currentMods.filter(m => m !== modId)
      : [...currentMods, modId];

    try {
      await updateDoc(doc(db, 'businesses', currentBusiness.id), {
        activeModules: newMods,
        updatedAt: new Date().toISOString()
      });
      await refreshBusinesses();
    } catch (e) {
      console.error('Module toggle failed:', e);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          <span>Enterprise Tenant Settings</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Branch architecture, RBAC team roles, modular activations, and tamper-proof audit trails
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        {[
          { id: 'profile' as const, label: 'Business Profile', icon: Building2 },
          { id: 'branches' as const, label: 'Multi-Branch Quotas', icon: Building2 },
          { id: 'team' as const, label: 'Team & RBAC Roles', icon: Users },
          { id: 'modules' as const, label: 'Module Activator', icon: Layers },
          { id: 'audit' as const, label: 'Audit Security Log', icon: History }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition cursor-pointer ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-2xl">
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Operating Business Name *</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tax / VAT Registration ID</label>
                <input
                  type="text"
                  value={taxNumber}
                  onChange={e => setTaxNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Headquarters Street Address</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow transition cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Business Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: BRANCHES */}
      {activeTab === 'branches' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-white text-base">Store & Warehouse Locations</h3>
              <p className="text-xs text-slate-400">
                Quota: {currentBusiness?.branches.length} of {currentBusiness?.subscription.maxBranches} branches configured
              </p>
            </div>
            <button
              onClick={() => setShowAddBranch(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Branch</span>
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {currentBusiness?.branches.map(br => (
              <div key={br.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm">{br.name}</span>
                    <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                      {br.code}
                    </span>
                    {br.isHeadquarters && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                        Headquarters
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{br.address}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TEAM & RBAC */}
      {activeTab === 'team' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-white text-base">Role-Based Access Control (RBAC)</h3>
              <p className="text-xs text-slate-400">
                Staff users assigned to this tenant with branch-scoped permissions
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-800 text-xs">
            <div className="py-3 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">{currentBusiness?.ownerEmail}</div>
                <div className="text-slate-400">Enterprise Owner • Full Cloud System Control</div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 font-bold uppercase text-[10px]">
                Owner (All Branches)
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400">
            <strong>Configurable Roles Supported:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-slate-300">
              <li><strong>Owner / Super Admin:</strong> Unrestricted tenant configuration, billing, and certificate management</li>
              <li><strong>Manager:</strong> Product pricing, supplier purchases, stock adjustments, and staff oversight</li>
              <li><strong>Cashier / Sales Staff:</strong> Point-of-sale checkout, customer receipts, and invoice generation</li>
              <li><strong>Accountant:</strong> General ledger, chart of accounts, expense vouchers, and tax declaration</li>
              <li><strong>Auditor:</strong> Read-only compliance inspection and immutable audit history access</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 4: MODULE ACTIVATOR */}
      {activeTab === 'modules' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="font-bold text-white text-base">Modular Architecture Registry</h3>
            <p className="text-xs text-slate-400">
              Enable or disable specific business capabilities on demand
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {MODULE_REGISTRY.map(mod => {
              const isActive = currentBusiness?.activeModules?.includes(mod.id) ?? true;
              return (
                <div
                  key={mod.id}
                  onClick={() => handleToggleModule(mod.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    isActive ? 'border-indigo-500/60 bg-indigo-500/10' : 'border-slate-800 bg-slate-950 opacity-60'
                  }`}
                >
                  <div>
                    <h4 className="font-semibold text-xs text-white">{mod.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{mod.description}</p>
                  </div>
                  <div className={`w-8 h-4 rounded-full p-0.5 transition ${isActive ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white transition transform ${isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-white text-base">Immutable Security Audit History</h3>
              <p className="text-xs text-slate-400">
                Cryptographic transaction trail logged across all tenant operations
              </p>
            </div>
            <button
              onClick={loadLogs}
              className="p-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {auditLogs.map(log => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">{log.userEmail}</span>
                  </div>
                  <div className="text-slate-300 mt-1">{log.details}</div>
                </div>
                <div className="text-[10px] text-slate-500 font-mono shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}

            {auditLogs.length === 0 && !loading && (
              <div className="text-center py-8 text-slate-500 text-xs">
                No recent security audit events recorded.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD BRANCH MODAL */}
      {showAddBranch && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-bold text-white text-base mb-3">Add Location / Branch</h3>
            <form onSubmit={handleAddBranch} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Branch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Westside Outlet"
                  value={newBranchName}
                  onChange={e => setNewBranchName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Physical Address</label>
                <input
                  type="text"
                  placeholder="Street, City"
                  value={newBranchAddress}
                  onChange={e => setNewBranchAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBranch(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow transition cursor-pointer"
                >
                  Create Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
