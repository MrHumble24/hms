import { baseApi } from "@/shared/api/base-api";

export interface Branch {
  id: string;
  name: string;
  isActive: boolean;
  tenantId: string;
  legalName?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  taxId?: string;
  latitude?: number;
  longitude?: number;
  checkInTime?: string;
  checkOutTime?: string;
  currency?: string;
  description?: any;
  isSetupCompleted: boolean;
  slug?: string;
  isFeatured?: boolean;
  starRating?: number;
  tags?: string[];
  gallery?: string[];
  createdAt: string;
}

export interface CreateBranchDto {
  name: string;
  address?: string;
  isActive?: boolean;
}

export interface UpdateBranchDto {
  name?: string;
  isActive?: boolean;
  legalName?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  taxId?: string;
  latitude?: number;
  longitude?: number;
  checkInTime?: string;
  checkOutTime?: string;
  currency?: string;
  description?: any;
  isSetupCompleted?: boolean;
  slug?: string;
  isFeatured?: boolean;
  starRating?: number;
  tags?: string[];
  gallery?: string[];
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
