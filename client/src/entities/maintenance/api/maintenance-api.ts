import { baseApi } from "@/shared/api/base-api";

export const TicketStatus = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  WONT_FIX: "WONT_FIX",
} as const;

export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export interface MaintenanceTicket {
  id: string;
  roomId: string;
  room?: {
    id: string;
    number: string;
    floor: number;
    type?: { name: string };
  };
  description: string;
  reportedBy: string;
  status: TicketStatus;
  createdAt: string;
  resolvedAt?: string;
  userId?: string; // staff who resolved it
}

export const maintenanceApi = {
  getAll: async (params?: {
    skip?: number;
    take?: number;
    search?: string;
    status?: string;
    priority?: string;
  }) => {
    const response = await baseApi.get<{
      data: MaintenanceTicket[];
      total: number;
    }>("/maintenance", { params });
    return response as unknown as { data: MaintenanceTicket[]; total: number };
  },

  getOne: (id: string) =>
    baseApi
      .get<MaintenanceTicket>(`/maintenance/${id}`)
      .then((res) => res as unknown as MaintenanceTicket),

  create: (data: { roomId: string; description: string }) =>
    baseApi
      .post<MaintenanceTicket>("/maintenance", data)
      .then((res) => res as unknown as MaintenanceTicket),

  updateStatus: (id: string, status: TicketStatus) =>
    baseApi
      .patch<MaintenanceTicket>(`/maintenance/${id}`, { status })
      .then((res) => res as unknown as MaintenanceTicket),
};
