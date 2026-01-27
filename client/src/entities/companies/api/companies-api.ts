import { baseApi as api } from "@/shared/api/base-api";

export interface DiscountContract {
  id: string;
  companyId: string;
  discountPercent: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  taxId: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  contracts?: DiscountContract[];
  bookings?: any[]; // Simple type for now
  _count?: {
    bookings: number;
    contracts: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyDto {
  name: string;
  taxId: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}

export interface CreateDiscountContractDto {
  discountPercent: number;
  startDate: string;
  endDate?: string;
  isActive?: boolean;
  description?: string;
}

export const companiesApi = {
  findAll: async () => {
    const response = await api.get<Company[]>("/companies");
    return response;
  },

  findOne: async (id: string) => {
    const response = await api.get<Company>(`/companies/${id}`);
    return response;
  },

  create: async (data: CreateCompanyDto) => {
    const response = await api.post<Company>("/companies", data);
    return response;
  },

  update: async (id: string, data: Partial<CreateCompanyDto>) => {
    const response = await api.patch<Company>(`/companies/${id}`, data);
    return response;
  },

  remove: async (id: string) => {
    await api.delete(`/companies/${id}`);
  },

  // Contracts
  createContract: async (
    companyId: string,
    data: CreateDiscountContractDto,
  ) => {
    const response = await api.post<DiscountContract>(
      `/companies/${companyId}/contracts`,
      data,
    );
    return response;
  },

  updateContract: async (contractId: string, data: any) => {
    const response = await api.patch<DiscountContract>(
      `/companies/contracts/${contractId}`,
      data,
    );
    return response;
  },

  removeContract: async (contractId: string) => {
    await api.delete(`/companies/contracts/${contractId}`);
  },
};
