import { useAuthStore } from "@/entities/user/model/auth-store";
import { hasPermission } from "@/entities/user/model/roles";

interface PermissionGateProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGate = ({
  permission,
  children,
  fallback = null,
}: PermissionGateProps) => {
  const { user } = useAuthStore();

  if (!hasPermission(user?.role, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
