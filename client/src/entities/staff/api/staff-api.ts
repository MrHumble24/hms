import { baseApi } from "@/shared/api/base-api";
import { UserRole } from "@/entities/user/model/roles";

export { UserRole as Role };

export interface Staff {
  id: string;
  fullName: string;
  email: string;
  role: string;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: string;
  tasksAssigned?: any[];
  maintenanceTickets?: any[];
}

export interface CreateStaffDto {
  fullName: string;
  email: string;
  role: string;
  password?: string;
  phoneNumber?: string;
}

export interface UpdateStaffDto {
  fullName?: string;
  email?: string;
  isActive?: boolean;
}

export const staffApi = {
  getAllStaff: (params?: {
    skip?: number;
    take?: number;
    search?: string;
    role?: string;
    status?: string;
  }) =>
    baseApi
      .get<{ data: Staff[]; total: number }>("/staff", { params })
      .then((res) => res as unknown as { data: Staff[]; total: number }),

  getStaffByRole: (role: string) =>
    baseApi
      .get<Staff[]>("/staff", { params: { role } })
      .then((res) => res as unknown as Staff[]),

  createStaff: (data: any) =>
    baseApi.post<Staff>("/staff", data).then((res) => res as unknown as Staff),

  // Alias for compatibility
  create: (data: CreateStaffDto) => staffApi.createStaff(data),

  updateStaff: (id: string, data: any) =>
    baseApi
      .patch<Staff>(`/staff/${id}`, data)
      .then((res) => res as unknown as Staff),

  updateRole: (id: string, data: { role: string }) =>
    baseApi
      .patch<Staff>(`/staff/${id}/role`, data)
      .then((res) => res as unknown as Staff),

  deleteStaff: (id: string) => baseApi.delete(`/staff/${id}`),
};
