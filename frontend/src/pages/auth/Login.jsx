import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../store/authSlice';
import { Shield, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';

const demoUsers = [
  { role: 'Super Admin', email: 'superadmin@demo.com', desc: 'Full configuration & audit access' },
  { role: 'Admin', email: 'admin@demo.com', desc: 'Sales approvals & 3-way clearance' },
  { role: 'Sales', email: 'sales@demo.com', desc: 'Requirements & dispatch clearance' },
  { role: 'Accounts', email: 'accounts@demo.com', desc: 'Checklists & commercial clearance' },
  { role: 'IQC Operator', email: 'iqc@demo.com', desc: 'Material inspection & batch intake' },
  { role: 'Production', email: 'production@demo.com', desc: 'Work orders & sample prep' },
  { role: 'QC Operator', email: 'qc@demo.com', desc: 'Sample QC testing & pass/fail' },
  { role: 'Packaging', email: 'packaging@demo.com', desc: 'Verification & QR generation' },
];

export default function Login() {
  const [email, setEmail] = useState('superadmin@demo.com');
  const [password, setPassword] = useState('Demo@123');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(loginUser({ email, password })).unwrap();
      navigate('/dashboard');
    } catch {
      // Error handled in slice
    }
  };

  const handleQuickLogin = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Demo@123');
    try {
      await dispatch(loginUser({ email: demoEmail, password: 'Demo@123' })).unwrap();
      navigate('/dashboard');
    } catch {
      // Error handled in slice
    }
  };

  return (
    <div className="max-w-md w-full mx-auto px-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-500/30 mb-3">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Manufacturing Operations ERP</h2>
        <p className="text-xs text-slate-400 mt-1">Inventory, Production & QR Traceability System</p>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                placeholder="operator@demo.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Sign In to ERP Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* 1-Click Demo Accounts */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
            <UserCheck className="w-4 h-4 text-brand-600" />
            <span>1-Click Demo Accounts (Password: Demo@123)</span>
          </div>
          <p className="text-[11px] text-slate-500 mb-3">
            Click any role below to log in immediately with realistic permissions:
          </p>

          <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {demoUsers.map((u) => (
              <button
                key={u.role}
                type="button"
                onClick={() => handleQuickLogin(u.email)}
                className="text-left p-2 rounded-lg border border-slate-200 hover:border-brand-400 hover:bg-brand-50/50 transition-all text-slate-800 group"
              >
                <div className="text-xs font-bold text-slate-900 group-hover:text-brand-700">
                  {u.role}
                </div>
                <div className="text-[10px] text-slate-500 truncate">{u.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

