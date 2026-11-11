import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { User, Shield, KeyRound, Building2, CheckCircle2 } from 'lucide-react';

export default function Profile() {
  const { user } = useSelector((state) => state.auth);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      toast.success('Password changed successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      // toast shown by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">User Profile & Access Control</h1>
          <p className="text-xs text-slate-500 mt-1">Manage credentials and review active ERP authorizations.</p>
        </div>
        <Badge status={user?.status || 'Active'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left card: User Info */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <div className="text-center pb-4 border-b border-slate-100">
              <div className="w-16 h-16 rounded-full bg-brand-900 text-white font-bold text-xl flex items-center justify-center mx-auto mb-3 shadow">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <h3 className="text-base font-bold text-slate-900">{user?.full_name}</h3>
              <p className="text-xs text-slate-500">{user?.email}</p>
              <div className="mt-2">
                <span className="px-2.5 py-1 bg-brand-50 text-brand-700 text-xs font-semibold rounded-full border border-brand-200">
                  {user?.role}
                </span>
              </div>
            </div>

            <div className="pt-4 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>Department: {user?.department || 'Operations Management'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Shield className="w-4 h-4 text-slate-400" />
                <span>Access Level: Role-Based & Operational</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right card: Change password & Operational Permissions */}
        <div className="md:col-span-2 space-y-6">
          <Card title="Active Operational Permissions" subtitle="Configured operational rights for this account">
            <div className="flex flex-wrap gap-2">
              {Array.isArray(user?.operational_permissions) && user.operational_permissions.length > 0 ? (
                user.operational_permissions.map((perm) => (
                  <span
                    key={perm}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-100 text-slate-700 border border-slate-200 font-mono"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{perm}</span>
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-500">Default role-based supervisory permissions active.</p>
              )}
            </div>
          </Card>

          <Card title="Change Account Password" subtitle="Ensure a secure password with alphanumeric characters">
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>Update Password</span>
              </button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

