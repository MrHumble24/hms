import { baseApi } from "@/shared/api/base-api";

export interface AuditLog {
  id: string;
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    role?: string;
  };
}

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "EXPORT"
  | "VIEW";

export interface QueryAuditLogsDto {
  userId?: string;
  action?: AuditAction;
  entityType?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  skip?: number;
  take?: number;
}

export interface AuditLogsResponse {
  data: AuditLog[];
  total: number;
}

export const auditApi = {
  getAll: (params?: QueryAuditLogsDto) =>
    baseApi
      .get<AuditLogsResponse>("/audit", { params })
      .then((res) => res as unknown as AuditLogsResponse),

  getByEntity: (entityType: string, entityId: string) =>
    baseApi
      .get<AuditLog[]>(`/audit/entity/${entityType}/${entityId}`)
      .then((res) => res as unknown as AuditLog[]),

  getByUser: (userId: string) =>
    baseApi
      .get<AuditLog[]>(`/audit/user/${userId}`)
      .then((res) => res as unknown as AuditLog[]),

  getRecent: (limit?: number) =>
    baseApi
      .get<AuditLog[]>("/audit/recent", { params: { limit } })
      .then((res) => res as unknown as AuditLog[]),
};
