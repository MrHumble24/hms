export const UserRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  RECEPTIONIST: "RECEPTIONIST",
  HOUSEKEEPER: "HOUSEKEEPER",
  MAINTENANCE: "MAINTENANCE",
  KITCHEN: "KITCHEN",
  WAITER: "WAITER",
  ACCOUNTANT: "ACCOUNTANT",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// Map each role to the routes/features they can access
// This is a whitelist approach - more secure/scalable than scattering strings
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.SUPER_ADMIN]: ["*"], // Access everything
  [UserRole.ADMIN]: [
    "dashboard",
    "bookings",
    "guests",
    "companies",
    "housekeeping",
    "rooms",
    "inventory",
    "finance",
    "staff",
    "settings",
    "restaurant-pos",
    "restaurant-menu",
    "restaurant-kds",
    "restaurant-history",
    "maintenance",
    "room-types",
    "branches",
    "communications",
    "emehmon",
    "audit",
  ],
  [UserRole.MANAGER]: [
    "dashboard",
    "bookings",
    "guests",
    "companies",
    "housekeeping",
    "rooms",
    "inventory",
    "staff",
    "restaurant",
    "maintenance",
    "room-types",
    "branches",
    "communications",
    "emehmon",
    "audit",
    // No finance/settings sensitive data if needed, but usually managers have wide access
  ],
  [UserRole.RECEPTIONIST]: [
    "dashboard",
    "bookings",
    "guests",
    "rooms", // Visual grid
    "companies",
    "maintenance", // Report issues
    "finance", // Payments (limited view usually, but page access allowed)
  ],
  [UserRole.HOUSEKEEPER]: [
    "housekeeping",
    "maintenance", // Report issues
  ],
  [UserRole.MAINTENANCE]: [
    "maintenance",
    "rooms", // To see room status
  ],
  [UserRole.KITCHEN]: ["restaurant", "restaurant-kds", "restaurant-menu"],
  [UserRole.WAITER]: ["restaurant", "restaurant-pos", "restaurant-history"],
  [UserRole.ACCOUNTANT]: ["dashboard", "finance", "companies", "inventory"],
};

export const hasPermission = (
  userRole: string | undefined,
  requiredPermission: string,
): boolean => {
  if (!userRole) return false;

  // Super Admin bypass
  if (userRole === UserRole.SUPER_ADMIN) return true;

  // Check if role exists in config
  const permissions = ROLE_PERMISSIONS[userRole as UserRole];
  if (!permissions) return false;

  // Wildcard check
  if (permissions.includes("*")) return true;

  return permissions.includes(requiredPermission);
};

export const getHomeRouteForRole = (role: string | undefined): string => {
  switch (role) {
    case UserRole.SUPER_ADMIN:
    case UserRole.ADMIN:
    case UserRole.MANAGER:
    case UserRole.RECEPTIONIST: // Receptionist has dashboard access
    case UserRole.ACCOUNTANT:
      return "/";
    case UserRole.HOUSEKEEPER:
      return "/housekeeping";
    case UserRole.MAINTENANCE:
      return "/maintenance";
    case UserRole.KITCHEN:
      return "/restaurant/kds";
    case UserRole.WAITER:
      return "/restaurant/pos";
    default:
      return "/";
  }
};
