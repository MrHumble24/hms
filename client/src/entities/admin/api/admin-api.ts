import { baseApi } from "@/shared/api/base-api";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  subscriptionStatus: string;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  planType: string;
  maxBranches: number;
  maxUsers: number;
  lastPaymentDate?: string;
  nextBillingDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    branches: number;
    users: number;
    guests: number;
  };
}

export interface TenantUsage {
  branches: number;
  users: number;
  guests: number;
  bookings: number;
  limits: {
    maxBranches: number;
    maxUsers: number;
  };
  usage: {
    branchesUsed: string;
    usersUsed: string;
  };
}

export const adminApi = {
  getTenants: (params?: {
    skip?: number;
    take?: number;
    status?: "active" | "inactive";
    search?: string;
  }) =>
    baseApi
      .get<{ tenants: Tenant[]; total: number }>("/admin/tenants", {
        params,
      })
      .then((res) => res as unknown as { tenants: Tenant[]; total: number }),

  getTenant: (id: string) =>
    baseApi
      .get<Tenant>(`/admin/tenants/${id}`)
      .then((res) => res as unknown as Tenant),

  getTenantUsage: (id: string) =>
    baseApi
      .get<TenantUsage>(`/admin/tenants/${id}/usage`)
      .then((res) => res as unknown as TenantUsage),

  activateTenant: (id: string) =>
    baseApi
      .patch<Tenant>(`/admin/tenants/${id}/activate`)
      .then((res) => res as unknown as Tenant),

  deactivateTenant: (id: string, reason?: string) =>
    baseApi
      .patch<Tenant>(`/admin/tenants/${id}/deactivate`, { reason })
      .then((res) => res as unknown as Tenant),

  updateSubscription: (
    id: string,
    data: {
      subscriptionStatus?: string;
      subscriptionStart?: string;
      subscriptionEnd?: string;
      planType?: string;
      maxBranches?: number;
      maxUsers?: number;
      lastPaymentDate?: string;
      nextBillingDate?: string;
      notes?: string;
    },
  ) =>
    baseApi
      .patch<Tenant>(`/admin/tenants/${id}/subscription`, data)
      .then((res) => res as unknown as Tenant),

  createTenantAdmin: (
    id: string,
    data: { email: string; fullName: string; password: string },
  ) =>
    baseApi
      .post(`/admin/tenants/${id}/users/admin`, data)
      .then((res) => res as unknown as any),

  getTenantUsers: (id: string) =>
    baseApi
      .get<any[]>(`/admin/tenants/${id}/users`)
      .then((res) => res as unknown as any[]),

  createTenantUser: (
    id: string,
    data: {
      email: string;
      fullName: string;
      password: string;
      role: string;
    },
  ) =>
    baseApi
      .post(`/admin/tenants/${id}/users`, data)
      .then((res) => res as unknown as any),

  deleteTenantUser: (id: string, userId: string) =>
    baseApi.delete(`/admin/tenants/${id}/users/${userId}`),

  createTenant: (data: {
    name: string;
    slug: string;
    email: string;
    fullName: string;
    password: string;
    planType: string;
  }) =>
    baseApi
      .post<Tenant>("/admin/tenants", data)
      .then((res) => res as unknown as Tenant),

  getLogs: (params?: {
    skip?: number;
    take?: number;
    level?: string;
    context?: string;
  }) =>
    baseApi
      .get<{ logs: SystemLog[]; total: number }>("/admin/logs", {
        params,
      })
      .then((res) => res as unknown as { logs: SystemLog[]; total: number }),
};

export interface SystemLog {
  id: string;
  level: string;
  context: string | null;
  message: string;
  metadata: any;
  timestamp: string;
}
