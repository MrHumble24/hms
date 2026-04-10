import { baseApi as api } from "@/shared/api/base-api";

export interface RoomType {
  id: string;
  name: string;
  basePrice: number;
  description?: string;
  amenities?: string[];
  images?: string[];
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface Booking {
  id: string;
  checkIn: string;
  checkOut: string;
  status: "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT";
  guest: Guest;
}

export interface HousekeepingTask {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  assignee?: {
    fullName: string;
  };
}

export interface MaintenanceTicket {
  id: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  description: string;
}

export interface RoomDashboardItem {
  id: string;
  number: string;
  floor: number;
  status: "CLEAN" | "DIRTY" | "INSPECTED" | "MAINTENANCE";
  type: RoomType;
  bookings: Booking[];
  tasks: HousekeepingTask[];
  maintenance: MaintenanceTicket[];
  images?: string[];
  isGalleryInherited?: boolean;
}

export interface RoomsDashboardResponse {
  data: RoomDashboardItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateRoomTypeDto {
  name: string;
  basePrice: number;
  description?: string;
  amenities?: string[];
  images?: string[];
}

export interface CreateRoomDto {
  number: string;
  floor: number;
  capacity: number;
  typeId: string;
  images?: string[];
  isGalleryInherited?: boolean;
}

export const roomApi = {
  // --- Dashboard (paginated; filters applied on server) ---
  getDashboard: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    floor?: number | "all";
  }) => {
    const query: Record<string, string | number> = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 24,
    };
    const s = params?.search?.trim();
    if (s) query.search = s;
    if (params?.status && params.status !== "all") query.status = params.status;
    if (params?.floor !== undefined && params?.floor !== "all")
      query.floor = params.floor;

    const response = await api.get<RoomsDashboardResponse>(
      "/rooms/dashboard",
      { params: query },
    );
    return response as unknown as RoomsDashboardResponse;
  },

  // --- Room Types ---
  getAllRoomTypes: async () => {
    const response = await api.get<RoomType[]>("/rooms/types");
    return response as unknown as RoomType[];
  },

  getOneRoomType: async (id: string) => {
    const response = await api.get<RoomType>(`/rooms/types/${id}`);
    return response as unknown as RoomType;
  },

  createRoomType: async (data: CreateRoomTypeDto) => {
    const response = await api.post<RoomType>("/rooms/types", data);
    return response as unknown as RoomType;
  },

  updateRoomType: async (id: string, data: Partial<CreateRoomTypeDto>) => {
    const response = await api.patch<RoomType>(`/rooms/types/${id}`, data);
    return response as unknown as RoomType;
  },

  removeRoomType: async (id: string) => {
    const response = await api.delete(`/rooms/types/${id}`);
    return response;
  },

  // --- Rooms ---
  getAllRooms: async (params?: {
    skip?: number;
    take?: number;
    search?: string;
    typeId?: string;
    status?: string;
  }) => {
    const response = await api.get<{
      data: RoomDashboardItem[];
      total: number;
    }>("/rooms", { params });
    return response as unknown as { data: RoomDashboardItem[]; total: number };
  },

  getOneRoom: async (id: string) => {
    const response = await api.get<RoomDashboardItem>(`/rooms/${id}`);
    return response as unknown as RoomDashboardItem;
  },

  createRoom: async (data: CreateRoomDto) => {
    const response = await api.post<RoomDashboardItem>("/rooms", data);
    return response as unknown as RoomDashboardItem;
  },

  updateRoom: async (
    id: string,
    data: Partial<CreateRoomDto> & { status?: string },
  ) => {
    const response = await api.patch<RoomDashboardItem>(`/rooms/${id}`, data);
    return response as unknown as RoomDashboardItem;
  },

  removeRoom: async (id: string) => {
    const response = await api.delete(`/rooms/${id}`);
    return response;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/rooms/${id}`, { status });
    return response;
  },

  bulkQrDownload: async (roomIds?: string[]) => {
    // We use a POST request to send the roomIds and baseUrl
    // And we expect a blob response
    const response = await api.post(
      "/rooms/qr-codes/bulk",
      {
        roomIds,
        baseUrl: window.location.origin,
      },
      {
        responseType: "blob",
      },
    );
    return response as unknown as Blob;
  },
};
