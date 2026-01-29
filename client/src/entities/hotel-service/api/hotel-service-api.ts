import { baseApi } from "@/shared/api/base-api";
import type {
  HotelService,
  HotelServiceRequest,
  CreateHotelServiceDto,
  UpdateHotelServiceDto,
  CreateServiceRequestDto,
  UpdateServiceRequestDto,
} from "../model/types";

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

  // Public
  getPublicCatalog: () =>
    baseApi
      .get<HotelService[]>("/hotel-services/public/catalog")
      .then((res) => res as unknown as HotelService[]),

  createPublicRequest: (data: CreateServiceRequestDto) =>
    baseApi
      .post<HotelServiceRequest>("/hotel-services/public/requests", data)
      .then((res) => res as unknown as HotelServiceRequest),

  getRoomRequests: (roomId: string) =>
    baseApi
      .get<
        HotelServiceRequest[]
      >(`/hotel-services/public/requests/room/${roomId}`)
      .then((res) => res as unknown as HotelServiceRequest[]),
};
