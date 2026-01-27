import { baseApi } from "@/shared/api/base-api";

export interface Branch {
  id: string;
  name: string;
  address?: string;
  isActive: boolean;
  tenantId: string;
  createdAt: string;
}

export interface CreateBranchDto {
  name: string;
  address?: string;
  isActive?: boolean;
}

export interface UpdateBranchDto {
  name?: string;
  address?: string;
  isActive?: boolean;
}

export const branchApi = {
  getAllBranches: (tenantId?: string) =>
    baseApi
      .get<Branch[]>("/branches", { params: { tenantId } })
      .then((res) => res as unknown as Branch[]),

  getBranch: (id: string) =>
    baseApi
      .get<Branch>(`/branches/${id}`)
      .then((res) => res as unknown as Branch),

  createBranch: (data: CreateBranchDto) =>
    baseApi
      .post<Branch>("/branches", data)
      .then((res) => res as unknown as Branch),

  updateBranch: (id: string, data: UpdateBranchDto) =>
    baseApi
      .patch<Branch>(`/branches/${id}`, data)
      .then((res) => res as unknown as Branch),

  deleteBranch: (id: string) => baseApi.delete(`/branches/${id}`),
};
