import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Spin } from "antd";
import { ProtectedRoute, PublicRoute } from "./auth-guard";
import { RoleGuard } from "@/shared/lib/auth/role-guard";
import { AdminLayout } from "@/app/layouts/admin-layout";

const FullScreenLoader = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
    }}
  >
    <Spin size="large" />
  </div>
);

const Loadable = (factory: () => Promise<any>, name: string) => {
  const LazyComponent = lazy(() =>
    factory().then((module) => ({ default: module[name] })),
  );
  return (props: any) => (
    <Suspense fallback={<FullScreenLoader />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Lazy loaded pages
const LoginPage = Loadable(() => import("@/pages/login"), "LoginPage");
const DashboardPage = Loadable(
  () => import("@/pages/dashboard"),
  "DashboardPage",
);
const RoomsPage = Loadable(() => import("@/pages/rooms/ui/page"), "RoomsPage");
const GuestsPage = Loadable(
  () => import("@/pages/guests/ui/guests-page"),
  "GuestsPage",
);
const RoomsManagementPage = Loadable(
  () => import("@/pages/rooms-management/ui/rooms-management-page"),
  "RoomsManagementPage",
);
const RoomTypesPage = Loadable(
  () => import("@/pages/room-types/ui/room-types-page"),
  "RoomTypesPage",
);
const InventoryPage = Loadable(
  () => import("@/pages/inventory/ui/inventory-page"),
  "InventoryPage",
);
const CompaniesPage = Loadable(
  () => import("@/pages/companies/ui/companies-page"),
  "CompaniesPage",
);
const HousekeepingPage = Loadable(
  () => import("@/pages/housekeeping/ui/housekeeping-page"),
  "HousekeepingPage",
);
const FolioMainPage = Loadable(
  () => import("@/pages/finance/ui/folio-page"),
  "FolioMainPage",
);
const FolioManagerPage = Loadable(
  () => import("@/pages/finance/ui/manager-overview"),
  "FolioManagerPage",
);
const BookingsPage = Loadable(() => import("@/pages/bookings"), "BookingsPage");
const TimelinePage = Loadable(
  () => import("@/pages/bookings/ui/timeline-page"),
  "TimelinePage",
);
const StaffPage = Loadable(
  () => import("@/pages/staff/ui/staff-page"),
  "StaffPage",
);
const SettingsPage = Loadable(
  () => import("@/pages/settings/ui/settings-page"),
  "SettingsPage",
);

const MenuManagementPage = Loadable(
  () => import("@/pages/restaurant"),
  "MenuManagementPage",
);
const POSPage = Loadable(() => import("@/pages/restaurant"), "POSPage");
const KDSPage = Loadable(() => import("@/pages/restaurant"), "KDSPage");
const OrderHistoryPage = Loadable(
  () => import("@/pages/restaurant"),
  "OrderHistoryPage",
);
const GuestMenuPage = Loadable(
  () => import("@/pages/restaurant"),
  "GuestMenuPage",
);

const TenantsPage = Loadable(
  () => import("@/pages/admin/tenants/ui/tenants-page"),
  "TenantsPage",
);
const TenantDetailsPage = Loadable(
  () => import("@/pages/admin/tenants/ui/tenant-details-page"),
  "TenantDetailsPage",
);
const LogsPage = Loadable(
  () => import("@/pages/admin/system-logs"),
  "LogsPage",
);

const MaintenancePage = Loadable(
  () => import("@/pages/maintenance"),
  "MaintenancePage",
);
const BranchPage = Loadable(() => import("@/pages/branches"), "BranchPage");
const CommunicationsPage = Loadable(
  () => import("@/pages/communications"),
  "CommunicationsPage",
);
const AuditPage = Loadable(() => import("@/pages/audit"), "AuditPage");
const EmehmonPage = Loadable(() => import("@/pages/emehmon"), "EmehmonPage");
const ConciergePage = Loadable(
  () => import("@/pages/concierge/ui/concierge-page"),
  "ConciergePage",
);
const SuspendedPage = Loadable(
  () => import("@/pages/suspended"),
  "SuspendedPage",
);
const TelegramBookingPage = Loadable(
  () => import("@/pages/telegram"),
  "TelegramBookingPage",
);

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
