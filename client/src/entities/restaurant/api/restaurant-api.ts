import { baseApi } from "@/shared/api/base-api";
import type {
  RestaurantCategory,
  RestaurantMenuItem,
  RestaurantOrder,
  CreateCategoryDto,
  CreateMenuItemDto,
  CreateOrderDto,
  GuestOrderDto,
  RestaurantOrderStatus,
} from "../model/types";

export const restaurantApi = {
  // Categories
  getCategories: async () => {
    const response = await baseApi.get<RestaurantCategory[]>(
      "/restaurant/categories",
    );
    return response as unknown as RestaurantCategory[];
  },
  createCategory: async (dto: CreateCategoryDto) => {
    const response = await baseApi.post<RestaurantCategory>(
      "/restaurant/categories",
      dto,
    );
    return response as unknown as RestaurantCategory;
  },
  updateCategory: async (id: string, dto: Partial<CreateCategoryDto>) => {
    const response = await baseApi.patch<RestaurantCategory>(
      `/restaurant/categories/${id}`,
      dto,
    );
    return response as unknown as RestaurantCategory;
  },
  deleteCategory: async (id: string) => {
    await baseApi.delete(`/restaurant/categories/${id}`);
  },

  // Menu Items
  getMenuItems: async (params?: {
    skip?: number;
    take?: number;
    search?: string;
    categoryId?: string;
    isSimpleItem?: boolean;
  }) => {
    const response = await baseApi.get<{
      data: RestaurantMenuItem[];
      total: number;
    }>("/restaurant/menu-items", { params });
    return response as unknown as { data: RestaurantMenuItem[]; total: number };
  },
  getMenuItem: async (id: string) => {
    const response = await baseApi.get<RestaurantMenuItem>(
      `/restaurant/menu-items/${id}`,
    );
    return response as unknown as RestaurantMenuItem;
  },
  createMenuItem: async (dto: CreateMenuItemDto) => {
    const response = await baseApi.post<RestaurantMenuItem>(
      "/restaurant/menu-items",
      dto,
    );
    return response as unknown as RestaurantMenuItem;
  },
  updateMenuItem: async (id: string, dto: Partial<CreateMenuItemDto>) => {
    const response = await baseApi.patch<RestaurantMenuItem>(
      `/restaurant/menu-items/${id}`,
      dto,
    );
    return response as unknown as RestaurantMenuItem;
  },
  deleteMenuItem: async (id: string) => {
    await baseApi.delete(`/restaurant/menu-items/${id}`);
  },

  // Orders
  getOrders: async (params?: {
    skip?: number;
    take?: number;
    search?: string;
    status?: string;
  }) => {
    const response = await baseApi.get<{
      data: RestaurantOrder[];
      total: number;
    }>("/restaurant/orders", { params });
    return response as unknown as { data: RestaurantOrder[]; total: number };
  },
  createOrder: async (dto: CreateOrderDto) => {
    const response = await baseApi.post<RestaurantOrder>(
      "/restaurant/orders",
      dto,
    );
    return response as unknown as RestaurantOrder;
  },
  updateOrderStatus: async (id: string, status: RestaurantOrderStatus) => {
    const response = await baseApi.patch<RestaurantOrder>(
      `/restaurant/orders/${id}/status`,
      { status },
    );
    return response as unknown as RestaurantOrder;
  },

  // Public Guest Endpoints
  getPublicCategories: async () => {
    const response = await baseApi.get<RestaurantCategory[]>(
      "/restaurant/public/categories",
    );
    return response as unknown as RestaurantCategory[];
  },
  getPublicMenuItems: async (params?: {
    skip?: number;
    take?: number;
    search?: string;
    categoryId?: string;
  }) => {
    const response = await baseApi.get<{
      data: RestaurantMenuItem[];
      total: number;
    }>("/restaurant/public/menu-items", { params });
    return response as unknown as { data: RestaurantMenuItem[]; total: number };
  },
  createGuestOrder: async (dto: GuestOrderDto) => {
    const response = await baseApi.post<RestaurantOrder>(
      "/restaurant/public/orders",
      dto,
    );
    return response as unknown as RestaurantOrder;
  },
  getRoomOrders: async (roomId: string) => {
    const response = await baseApi.get<RestaurantOrder[]>(
      `/restaurant/public/orders/room/${roomId}`,
    );
    return response as unknown as RestaurantOrder[];
  },
};
