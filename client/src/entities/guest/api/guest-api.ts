import { baseApi as api } from "@/shared/api/base-api";

export type Gender = "MALE" | "FEMALE";

export type VisaType = "TOURIST" | "BUSINESS" | "DIPLOMATIC" | "WORK" | "STUDY";

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  patronymic?: string;
  phone: string;
  email?: string;
  citizenship: string;
  passportSeries: string;
  passportNumber: string;
  dateOfBirth: string;
  gender: Gender;
  passportIssueDate?: string;
  passportExpiryDate?: string;
  visaNumber?: string;
  dateOfEntry?: string;
  passportScanUrl?: string;
  region?: string;
  district?: string;
  address?: string;
  visaType?: VisaType;
  createdAt: string;
  updatedAt: string;
}

export type CreateGuestDto = Omit<Guest, "id" | "createdAt" | "updatedAt">;
export type UpdateGuestDto = Partial<CreateGuestDto>;

export const guestApi = {
  getAll: async (params?: {
    skip?: number;
    take?: number;
    search?: string;
  }) => {
    const response = await api.get<{ data: Guest[]; total: number }>(
      "/guests",
      { params },
    );
    return response as unknown as { data: Guest[]; total: number };
  },

  getOne: async (id: string) => {
    const response = await api.get<Guest>(`/guests/${id}`);
    return response;
  },

  create: async (data: CreateGuestDto) => {
    const response = await api.post<Guest>("/guests", data);
    return response;
  },

  update: async (id: string, data: UpdateGuestDto) => {
    const response = await api.patch<Guest>(`/guests/${id}`, data);
    return response;
  },

  remove: async (id: string) => {
    const response = await api.delete(`/guests/${id}`);
    return response;
  },

  lookupGlobal: async (series: string, number: string) => {
    const response = await api.get<Guest | null>("/guests/lookup/global", {
      params: { passportSeries: series, passportNumber: number },
    });
    return response as unknown as Guest | null;
  },

  pullToBranch: async (id: string) => {
    const response = await api.post<Guest>(`/guests/${id}/pull`);
    return response;
  },
};
