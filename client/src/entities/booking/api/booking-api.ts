import { baseApi as api } from "@/shared/api/base-api";
import { PaymentMethod } from "@/entities/finance/api/finance-api";

export const BookingStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CHECKED_IN: "CHECKED_IN",
  CHECKED_OUT: "CHECKED_OUT",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const BookingSource = {
  WALK_IN: "WALK_IN",
  PHONE: "PHONE",
  BOOKING_COM: "BOOKING_COM",
  EXPEDIA: "EXPEDIA",
  WEBSITE: "WEBSITE",
} as const;

export type BookingSource = (typeof BookingSource)[keyof typeof BookingSource];

export const RoomStatus = {
  CLEAN: "CLEAN",
  DIRTY: "DIRTY",
  INSPECTED: "INSPECTED",
  MAINTENANCE: "MAINTENANCE",
} as const;

export type RoomStatus = (typeof RoomStatus)[keyof typeof RoomStatus];

export interface RoomStay {
  id: string;
  roomId?: string;
  room?: any;
  startDate: string;
  endDate: string;
  dailyRate: number;
  adultsCount: number;
  childrenCount: number;
}

export interface Booking {
  id: string;
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
  primaryGuestId: string;
  primaryGuest?: any;
  roomStays: RoomStay[];
  source: BookingSource;
  ratePlanId?: string;
  companyId?: string;
  totalPrice?: number;
  createdAt: string;
  updatedAt: string;
  folios?: any[];
}

export interface CreateRoomStayDto {
  roomId?: string;
  startDate: string;
  endDate: string;
  adultsCount?: number;
  childrenCount?: number;
}

export interface CreateBookingDto {
  checkIn: string;
  checkOut: string;
  primaryGuestId: string;
  ratePlanId?: string;
  companyId?: string;
  source?: BookingSource;
  roomStays: CreateRoomStayDto[];
}

export interface UpdateBookingDto {
  status?: BookingStatus;
  ratePlanId?: string;
  companyId?: string;
  checkIn?: string;
  checkOut?: string;
}

export interface AdditionalChargeDto {
  description: string;
  amount: number;
  quantity: number;
}

export interface CheckoutDto {
  paymentAmount?: number;
  paymentMethod?: PaymentMethod;
  transactionRef?: string;
  notes?: string;
  roomStatus?: RoomStatus;
  additionalCharges?: AdditionalChargeDto[];
}

export interface CheckoutResponse {
  booking: Booking;
  message: string;
  receipt: {
    bookingId: string;
    guestName: string;
    roomNumber: string;
    checkIn: string;
    checkOut: string;
    totalCharges: number;
    totalPayments: number;
    balance: number;
    folioItems?: any[];
    payments?: any[];
    checkoutNotes?: string;
  };
}

export const bookingApi = {
  getAll: async (params?: {
    skip?: number;
    take?: number;
    search?: string;
    status?: string;
  }) => {
    const response = await api.get<{ data: Booking[]; total: number }>(
      "/bookings",
      { params },
    );
    return response as unknown as { data: Booking[]; total: number };
  },

  getOne: async (id: string) => {
    const response = await api.get<Booking>(`/bookings/${id}`);
    return response as unknown as Booking;
  },

  create: async (data: CreateBookingDto) => {
    const response = await api.post<Booking>("/bookings", data);
    return response as unknown as Booking;
  },

  update: async (id: string, data: UpdateBookingDto) => {
    const response = await api.patch<Booking>(`/bookings/${id}`, data);
    return response as unknown as Booking;
  },

  remove: async (id: string) => {
    const response = await api.delete(`/bookings/${id}`);
    return response as unknown as any;
  },

  checkout: async (id: string, data: CheckoutDto) => {
    const response = await api.post<CheckoutResponse>(
      `/bookings/${id}/checkout`,
      data,
    );
    return response as unknown as CheckoutResponse;
  },
};
