import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/entities/user/model/auth-store";
import { getHomeRouteForRole } from "@/entities/user/model/roles";

export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state: any) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const PublicRoute = () => {
  const isAuthenticated = useAuthStore((state: any) => state.isAuthenticated);
  const user = useAuthStore((state: any) => state.user);
  const location = useLocation();

  if (isAuthenticated && location.pathname !== "/suspended") {
    const home = getHomeRouteForRole(user?.role);
    return <Navigate to={home} replace />;
  }

  return <Outlet />;
};
