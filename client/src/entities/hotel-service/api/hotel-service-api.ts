import { baseApi } from "@/shared/api/base-api";

export type ServiceCategory =
  | "CONCIERGE"
  | "LAUNDRY"
  | "SPA"
  | "TRANSPORT"
  | "FOOD_BEVERAGE"
  | "CLEANING"
  | "OTHER";

export type ServiceRequestStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface HotelService {
  id: string;
  name: string;
  description?: string;
  category: ServiceCategory;
  basePrice: number;
  currency: string;
  isActive: boolean;
}

export interface HotelServiceRequest {
  id: string;
  serviceId: string;
  service: HotelService;
  bookingId: string;
  booking: {
    id: string;
    primaryGuest: {
      fullName: string;
    };
    roomStays?: Array<{
      room?: {
        number: string;
      };
    }>;
  };
  status: ServiceRequestStatus;
  quantity: number;
  totalAmount: number;
  notes?: string;
  scheduledFor?: string;
  createdAt: string;
}

export interface CreateHotelServiceDto {
  name: string;
  description?: string;
  category: ServiceCategory;
  basePrice: number;
  currency?: string;
}

export interface UpdateHotelServiceDto {
  name?: string;
  description?: string;
  category?: ServiceCategory;
  basePrice?: number;
  currency?: string;
  isActive?: boolean;
}

export interface CreateServiceRequestDto {
  serviceId: string;
  bookingId: string;
  quantity?: number;
  notes?: string;
  scheduledFor?: string;
}

export interface UpdateServiceRequestDto {
  status?: ServiceRequestStatus;
  notes?: string;
}

export const hotelServiceApi = {
  // Catalog
  getCatalog: () =>
    baseApi
      .get<HotelService[]>("/hotel-services/catalog")
      .then((res) => res as unknown as HotelService[]),

  createService: (data: CreateHotelServiceDto) =>
    baseApi
      .post<HotelService>("/hotel-services/catalog", data)
      .then((res) => res as unknown as HotelService),

  updateService: (id: string, data: UpdateHotelServiceDto) =>
    baseApi
      .patch<HotelService>(`/hotel-services/catalog/${id}`, data)
      .then((res) => res as unknown as HotelService),

  // Requests
  getRequests: () =>
    baseApi
      .get<HotelServiceRequest[]>("/hotel-services/requests")
      .then((res) => res as unknown as HotelServiceRequest[]),

  createRequest: (data: CreateServiceRequestDto) =>
    baseApi
      .post<HotelServiceRequest>("/hotel-services/requests", data)
      .then((res) => res as unknown as HotelServiceRequest),

  updateRequestStatus: (id: string, data: UpdateServiceRequestDto) =>
    baseApi
      .patch<HotelServiceRequest>(`/hotel-services/requests/${id}`, data)
      .then((res) => res as unknown as HotelServiceRequest),
};
