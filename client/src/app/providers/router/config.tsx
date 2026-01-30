import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute, PublicRoute } from "./auth-guard";
import { RoleGuard } from "@/shared/lib/auth/role-guard";
import { LoginPage } from "@/pages/login";
import { DashboardPage } from "@/pages/dashboard";
import { RoomsPage } from "@/pages/rooms/ui/page";
import { GuestsPage } from "@/pages/guests/ui/guests-page";
import { RoomsManagementPage } from "@/pages/rooms-management/ui/rooms-management-page";
import { RoomTypesPage } from "@/pages/room-types/ui/room-types-page";
import { InventoryPage } from "@/pages/inventory/ui/inventory-page";
import { CompaniesPage } from "@/pages/companies/ui/companies-page";
import { HousekeepingPage } from "@/pages/housekeeping/ui/housekeeping-page";
import { FolioMainPage } from "@/pages/finance/ui/folio-page";
import { FolioManagerPage } from "@/pages/finance/ui/manager-overview";
import { BookingsPage } from "@/pages/bookings";
import { TimelinePage } from "@/pages/bookings/ui/timeline-page";
import { AdminLayout } from "@/app/layouts/admin-layout";
import { StaffPage } from "@/pages/staff/ui/staff-page";
import { SettingsPage } from "@/pages/settings/ui/settings-page";
import {
  MenuManagementPage,
  POSPage,
  KDSPage,
  OrderHistoryPage,
  GuestMenuPage,
} from "@/pages/restaurant";
import { TenantsPage } from "@/pages/admin/tenants/ui/tenants-page";
import { TenantDetailsPage } from "@/pages/admin/tenants/ui/tenant-details-page";
import { MaintenancePage } from "@/pages/maintenance";
import { BranchPage } from "@/pages/branches";
import { CommunicationsPage } from "@/pages/communications";
import { AuditPage } from "@/pages/audit";
import { EmehmonPage } from "@/pages/emehmon";
import { ConciergePage } from "@/pages/concierge/ui/concierge-page";

import { SuspendedPage } from "@/pages/suspended";
import { TelegramBookingPage } from "@/pages/telegram";
import { LogsPage } from "@/pages/admin/logs/ui/logs-page";

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/suspended",
        element: <SuspendedPage />,
      },
      {
        path: "/restaurant/public/menu",
        element: <GuestMenuPage />,
      },
      {
        path: "/tg",
        element: <TelegramBookingPage />,
      },
      {
        path: "/tg/book",
        element: <TelegramBookingPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            path: "/",
            element: (
              <RoleGuard permission="dashboard">
                <DashboardPage />
              </RoleGuard>
            ),
          },
          {
            path: "/bookings",
            element: (
              <RoleGuard permission="bookings">
                <BookingsPage />
              </RoleGuard>
            ),
          },
          {
            path: "/bookings/timeline",
            element: (
              <RoleGuard permission="bookings">
                <TimelinePage />
              </RoleGuard>
            ),
          },
          {
            path: "/guests",
            element: (
              <RoleGuard permission="guests">
                <GuestsPage />
              </RoleGuard>
            ),
          },
          {
            path: "/companies",
            element: (
              <RoleGuard permission="companies">
                <CompaniesPage />
              </RoleGuard>
            ),
          },
          {
            path: "/housekeeping",
            element: (
              <RoleGuard permission="housekeeping">
                <HousekeepingPage />
              </RoleGuard>
            ),
          },
          {
            path: "/rooms",
            element: (
              <RoleGuard permission="rooms">
                <RoomsManagementPage />
              </RoleGuard>
            ),
          },
          {
            path: "/room-types",
            element: (
              <RoleGuard permission="room-types">
                <RoomTypesPage />
              </RoleGuard>
            ),
          },
          {
            path: "/rooms/visual",
            element: (
              <RoleGuard permission="rooms">
                <RoomsPage />
              </RoleGuard>
            ),
          },
          {
            path: "/inventory",
            element: (
              <RoleGuard permission="inventory">
                <InventoryPage />
              </RoleGuard>
            ),
          },
          {
            path: "/finance",
            element: (
              <RoleGuard permission="finance">
                <FolioManagerPage />
              </RoleGuard>
            ),
          },
          {
            path: "/finance/folios/:id",
            element: (
              <RoleGuard permission="finance">
                <FolioMainPage />
              </RoleGuard>
            ),
          },
          {
            path: "/staff",
            element: (
              <RoleGuard permission="staff">
                <StaffPage />
              </RoleGuard>
            ),
          },
          {
            path: "/restaurant/pos",
            element: (
              <RoleGuard permission="restaurant-pos">
                <POSPage />
              </RoleGuard>
            ),
          },
          {
            path: "/restaurant/menu",
            element: (
              <RoleGuard permission="restaurant-menu">
                <MenuManagementPage />
              </RoleGuard>
            ),
          },
          {
            path: "/restaurant/kds",
            element: (
              <RoleGuard permission="restaurant-kds">
                <KDSPage />
              </RoleGuard>
            ),
          },
          {
            path: "/restaurant/history",
            element: (
              <RoleGuard permission="restaurant-history">
                <OrderHistoryPage />
              </RoleGuard>
            ),
          },
          {
            path: "/settings",
            element: (
              <RoleGuard permission="settings">
                <SettingsPage />
              </RoleGuard>
            ),
          },
          // Super Admin specific routes need no specific guard if RoleGuard handles "dashboard" fallback or explicitly checks SUPER_ADMIN
          // But our config has "*" for SUPER_ADMIN, so any permission works.
          // However, these routes are specific to Admin. We should create a permission for them or check role.
          // In config, ADMIN does NOT have access to "admin-tenants". Only SUPER_ADMIN does.
          // We did not add "admin-tenants" to ADMIN role. We added nothing for SUPER_ADMIN because of "*".
          // So let's use "admin-tenants" as permission key.
          {
            path: "/admin/tenants",
            element: (
              <RoleGuard permission="admin-tenants">
                <TenantsPage />
              </RoleGuard>
            ),
          },
          {
            path: "/admin/tenants/:id",
            element: (
              <RoleGuard permission="admin-tenants">
                <TenantDetailsPage />
              </RoleGuard>
            ),
          },
          {
            path: "/admin/logs",
            element: (
              <RoleGuard permission="admin-logs">
                <LogsPage />
              </RoleGuard>
            ),
          },
          {
            path: "/maintenance",
            element: (
              <RoleGuard permission="maintenance">
                <MaintenancePage />
              </RoleGuard>
            ),
          },
          {
            path: "/branches",
            element: (
              <RoleGuard permission="branches">
                <BranchPage />
              </RoleGuard>
            ),
          },
          {
            path: "/communications",
            element: (
              <RoleGuard permission="communications">
                <CommunicationsPage />
              </RoleGuard>
            ),
          },
          {
            path: "/audit",
            element: (
              <RoleGuard permission="audit">
                <AuditPage />
              </RoleGuard>
            ),
          },
          {
            path: "/emehmon",
            element: (
              <RoleGuard permission="emehmon">
                <EmehmonPage />
              </RoleGuard>
            ),
          },
          {
            path: "/concierge",
            element: (
              <RoleGuard permission="concierge">
                <ConciergePage />
              </RoleGuard>
            ),
          },
        ],
      },
    ],
  },
]);
