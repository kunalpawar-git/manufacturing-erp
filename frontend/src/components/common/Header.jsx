import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { logout, switchDemoRole } from '../../store/authSlice';
import api from '../../services/api';
import {
  Bell,
  Search,
  User,
  LogOut,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'react-toastify';

const demoRolesList = [
  { role: 'Super Admin', email: 'superadmin@demo.com', color: 'bg-indigo-600' },
  { role: 'Admin', email: 'admin@demo.com', color: 'bg-blue-600' },
  { role: 'Sales', email: 'sales@demo.com', color: 'bg-emerald-600' },
  { role: 'Accounts', email: 'accounts@demo.com', color: 'bg-purple-600' },
  { role: 'IQC Operator', email: 'iqc@demo.com', color: 'bg-amber-600' },
  { role: 'Production', email: 'production@demo.com', color: 'bg-cyan-600' },
  { role: 'QC Operator', email: 'qc@demo.com', color: 'bg-rose-600' },
  { role: 'Packaging', email: 'packaging@demo.com', color: 'bg-teal-600' },
];

export default function Header({ onMenuClick }) {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch {
      // ignore
    }
  };

  const handleRoleSwitch = async (email) => {
    try {
      await dispatch(switchDemoRole(email));
      setShowRoleSwitcher(false);
      navigate('/dashboard');
    } catch (err) {
      toast.error('Role switch failed: ' + err);
    }
  };

  const handleGlobalSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      // If looks like QR / part / box / PO, direct to QR or relevant module
      const q = searchQuery.trim();
      if (q.startsWith('PT-') || q.startsWith('BX-') || q.startsWith('B-') || q.startsWith('SH-')) {
        navigate(`/qr-traceability?search=${encodeURIComponent(q)}`);
      } else if (q.startsWith('PO-')) {
        navigate(`/purchase-orders?search=${encodeURIComponent(q)}`);
      } else {
        navigate(`/qr-traceability?search=${encodeURIComponent(q)}`);
      }
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile hamburger & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 focus:outline-none"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleGlobalSearch}
            placeholder="Search Part ID, Master Box (BX-), Batch (B-), PO, or Shipment..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50/80 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Right: Role Switcher, Notifications & User menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Demo Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-lg transition-colors"
            title="Switch Demo Role"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
            <span className="hidden md:inline">Demo Role:</span>
            <span className="font-semibold text-brand-700">{user?.role || 'Super Admin'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {showRoleSwitcher && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Switch Demo Account
              </div>
              <div className="max-h-72 overflow-y-auto py-1">
                {demoRolesList.map((dr) => (
                  <button
                    key={dr.role}
                    onClick={() => handleRoleSwitch(dr.email)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      user?.email === dr.email ? 'bg-brand-50 font-semibold text-brand-700' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${dr.color}`}></span>
                      <span>{dr.role}</span>
                    </div>
                    {user?.email === dr.email && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifPopover(!showNotifPopover)}
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifPopover && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">Notifications ({notifications.length})</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-brand-600 hover:text-brand-800 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">No notifications yet</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 text-xs hover:bg-slate-50 transition-colors ${
                        !n.is_read ? 'bg-brand-50/40 font-medium' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            n.type === 'error'
                              ? 'text-rose-500'
                              : n.type === 'warning'
                              ? 'text-amber-500'
                              : 'text-brand-500'
                          }`}
                        />
                        <div className="flex-1">
                          <p className="text-slate-900 font-medium">{n.title}</p>
                          <p className="text-slate-500 text-[11px] mt-0.5">{n.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-brand-900 text-white font-semibold text-xs flex items-center justify-center shadow-sm">
              {user?.full_name ? user.full_name.charAt(0) : 'U'}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.full_name || 'Admin User'}
              </div>
              <div className="text-[10px] text-slate-500">{user?.role || 'Super Admin'}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">{user?.full_name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-brand-50 text-brand-700 text-[10px] font-semibold rounded-full border border-brand-200">
                  {user?.role}
                </span>
              </div>
              <Link
                to="/profile"
                onClick={() => setShowUserDropdown(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>My Profile & Permissions</span>
              </Link>
              <a
                href="/api/docs"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
              >
                <ExternalLink className="w-4 h-4 text-slate-400" />
                <span>API Swagger Docs</span>
              </a>
              <div className="border-t border-slate-100 my-1"></div>
              <button
                onClick={() => dispatch(logout())}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

