import { useSelector } from 'react-redux';

export function useAuth() {
  const { user, token, isAuthenticated } = useSelector((state) => state.auth);
  const roleName = user?.role || user?.Role?.name || 'Admin';
  const permissions = user?.operational_permissions || [];

  const hasRole = (...allowedRoles) => allowedRoles.includes(roleName);
  const hasPermission = (permKey) =>
    roleName === 'Super Admin' || roleName === 'Admin' || permissions.includes(permKey);

  return {
    user,
    token,
    isAuthenticated,
    roleName,
    permissions,
    hasRole,
    hasPermission,
  };
}

