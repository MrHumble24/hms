import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/entities/user/model/auth-store";
import {
  hasPermission,
  getHomeRouteForRole,
} from "@/entities/user/model/roles";

interface RoleGuardProps {
  permission: string;
  children?: React.ReactNode;
}

export const RoleGuard = ({ permission, children }: RoleGuardProps) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(user.role, permission)) {
    // If user is authenticated but unauthorized, strictly direct to a safe page or 403
    // Redirect to their specific home route instead of generic "/"
    const fallback = getHomeRouteForRole(user.role);
    // Prevent infinite loop if fallback is the same as current location (though RoleGuard is usually on specific paths)
    // If fallback is "/", but user deosn't have access to "/", getHomeRouteForRole should have handled it.
    return <Navigate to={fallback} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
