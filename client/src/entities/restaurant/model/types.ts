export interface LocalizedString {
  [key: string]: string;
}

export interface RestaurantCategory {
  id: string;
  name: LocalizedString;
  items?: RestaurantMenuItem[];
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantMenuItem {
  id: string;
  name: LocalizedString;
  description?: LocalizedString;
  price: number;
  imageUrl?: string;
  calories?: number;
  ingredients?: string;
  categoryId: string;
  category?: RestaurantCategory;
  createdAt: string;
  updatedAt: string;
}

export type RestaurantOrderStatus =
  | "PENDING"
  | "PREPARING"
  | "SERVED"
  | "PAID"
  | "CANCELLED";

export interface RestaurantOrderItem {
  id: string;
  menuItemId: string;
  menuItem: RestaurantMenuItem;
  quantity: number;
  price: number;
  notes?: string;
}

export interface RestaurantOrder {
  id: string;
  tableNumber?: string;
  status: RestaurantOrderStatus;
  bookingId?: string;
  booking?: any; // For simplicity now, we can Type it properly if needed
  totalAmount: number;
  items: RestaurantOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: LocalizedString;
}

export interface CreateMenuItemDto {
  name: LocalizedString;
  description?: LocalizedString;
  price: number;
  imageUrl?: string;
  calories?: number;
  ingredients?: string;
  categoryId: string;
}

export interface CreateOrderDto {
  tableNumber?: string;
  bookingId?: string;
  items: {
    menuItemId: string;
    quantity: number;
    notes?: string;
  }[];
}

export interface GuestOrderDto {
  roomId: string;
  items: {
    menuItemId: string;
    quantity: number;
    notes?: string;
  }[];
}
