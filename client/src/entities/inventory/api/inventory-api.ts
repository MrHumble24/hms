import { baseApi as api } from "@/shared/api/base-api";

export type InventoryCategory =
  | "MINIBAR"
  | "HOUSEKEEPING"
  | "MAINTENANCE"
  | "KITCHEN"
  | "OTHER";
export type StockUpdateReason =
  | "USED_IN_ROOM"
  | "MINIBAR_REFILL"
  | "DAMAGED_OR_LOST"
  | "RESTOCKED"
  | "CORRECTION"
  | "OTHER";

export interface StockLog {
  id: string;
  itemId: string;
  staffId: string;
  staff: { fullName: string };
  change: number;
  reason: StockUpdateReason;
  note?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  unit: string;
  quantity: number;
  minThreshold: number;
  purchasePrice?: number;
  sellPrice?: number;
  category: InventoryCategory;
  lastRestocked: string;
  updatedAt: string;
  lastUpdatedBy?: {
    fullName: string;
    role: string;
  };
  stockLogs?: StockLog[];
}

export interface UpdateStockDto {
  change: number;
  reason: StockUpdateReason;
  note?: string;
}

export const inventoryApi = {
  findAll: async (params?: {
    skip?: number;
    take?: number;
    search?: string;
    category?: string;
  }) => {
    const response = await api.get<{ data: InventoryItem[]; total: number }>(
      "/inventory",
      { params },
    );
    return response as unknown as { data: InventoryItem[]; total: number };
  },

  findOne: async (id: string) => {
    const response = await api.get<InventoryItem>(`/inventory/${id}`);
    return response;
  },

  getLowStock: async () => {
    const response = await api.get<InventoryItem[]>("/inventory/low-stock");
    return response;
  },

  create: async (data: any) => {
    const response = await api.post<InventoryItem>("/inventory", data);
    return response;
  },

  update: async (id: string, data: any) => {
    const response = await api.patch<InventoryItem>(`/inventory/${id}`, data);
    return response;
  },

  updateStock: async (id: string, data: UpdateStockDto) => {
    const response = await api.patch<InventoryItem>(
      `/inventory/${id}/stock`,
      data,
    );
    return response;
  },

  remove: async (id: string) => {
    await api.delete(`/inventory/${id}`);
  },
};
