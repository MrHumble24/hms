import { baseApi as api } from "@/shared/api/base-api";

// Enums matching backend schema
export const FolioStatus = {
  OPEN: "OPEN",
  CLOSED: "CLOSED",
  VOID: "VOID",
} as const;

export type FolioStatus = (typeof FolioStatus)[keyof typeof FolioStatus];

export const Currency = {
  UZS: "UZS",
  USD: "USD",
  EUR: "EUR",
  RUB: "RUB",
} as const;

export type Currency = (typeof Currency)[keyof typeof Currency];

export const ChargeType = {
  ROOM_CHARGE: "ROOM_CHARGE",
  TOURIST_TAX: "TOURIST_TAX",
  MINIBAR: "MINIBAR",
  LAUNDRY: "LAUNDRY",
  DAMAGE_FEE: "DAMAGE_FEE",
  CONCIERGE: "CONCIERGE",
  SPA: "SPA",
  TRANSPORT: "TRANSPORT",
  OTHER_SERVICE: "OTHER_SERVICE",
} as const;

export type ChargeType = (typeof ChargeType)[keyof typeof ChargeType];

export const PaymentMethod = {
  CASH: "CASH",
  UZCARD: "UZCARD",
  HUMO: "HUMO",
  VISA_MASTERCARD: "VISA_MASTERCARD",
  CLICK: "CLICK",
  PAYME: "PAYME",
  BANK_TRANSFER: "BANK_TRANSFER",
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentStatus = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const FolioItemSource = {
  MANUAL: "MANUAL",
  SYSTEM: "SYSTEM",
  AUTO_POST: "AUTO_POST",
  SERVICE_MODULE: "SERVICE_MODULE",
} as const;

export type FolioItemSource =
  (typeof FolioItemSource)[keyof typeof FolioItemSource];

// Interfaces
export interface FolioItem {
  id: string;
  folioId: string;
  description: string;
  amount: number; // For compatibility
  unitPrice: number;
  totalAmount: number;
  taxRate?: number;
  taxAmount?: number;
  quantity: number;
  type: ChargeType;
  source: FolioItemSource;
  staffId?: string;
  staff?: {
    id: string;
    fullName: string;
  };
  createdAt: string;
}

export interface Payment {
  id: string;
  folioId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef?: string;
  staffId: string;
  staff?: {
    id: string;
    fullName: string;
  };
  createdAt: string;
}

export interface Folio {
  id: string;
  bookingId: string;
  status: FolioStatus;
  isPrimary: boolean;
  items?: FolioItem[];
  payments?: Payment[];
  booking?: {
    id: string;
    checkIn: string;
    checkOut: string;
    primaryGuest?: {
      id: string;
      firstName: string;
      lastName: string;
      email?: string;
    };
    room?: {
      number: string;
    };
    roomStays?: {
      room: {
        number: string;
      };
    }[];
  };
}

export interface FolioBalance {
  totalCharges: number;
  totalPayments: number;
  balance: number;
}

// DTOs
export interface CreateFolioDto {
  bookingId: string;
  isPrimary?: boolean;
}

export interface AddFolioItemDto {
  description: string;
  amount: number;
  quantity?: number;
  type: ChargeType;
  source?: FolioItemSource;
}

export interface CreatePaymentDto {
  amount: number;
  currency: Currency;
  method: PaymentMethod;
  status?: PaymentStatus;
  transactionRef?: string;
}

export interface UpdateFolioStatusDto {
  status: FolioStatus;
}

// API
export const financeApi = {
  createFolio: async (data: CreateFolioDto) => {
    const response = await api.post<Folio>("/finance/folios", data);
    return response as unknown as Folio;
  },

  getAllFolios: async (params?: {
    skip?: number;
    take?: number;
    search?: string;
    status?: string;
  }) => {
    const response = await api.get<{ data: Folio[]; total: number }>(
      "/finance/folios",
      { params },
    );
    return response as unknown as { data: Folio[]; total: number };
  },

  getFolio: async (id: string) => {
    const response = await api.get<Folio>(`/finance/folios/${id}`);
    return response as unknown as Folio;
  },

  getFolioBalance: async (id: string) => {
    const response = await api.get<FolioBalance>(
      `/finance/folios/${id}/balance`,
    );
    return response as unknown as FolioBalance;
  },

  addItem: async (folioId: string, data: AddFolioItemDto) => {
    const response = await api.post<FolioItem>(
      `/finance/folios/${folioId}/items`,
      data,
    );
    return response as unknown as FolioItem;
  },

  adjustCharge: async (folioId: string, itemId: string) => {
    const response = await api.post<FolioItem>(
      `/finance/folios/${folioId}/items/${itemId}/adjust`,
    );
    return response as unknown as FolioItem;
  },

  recordPayment: async (folioId: string, data: CreatePaymentDto) => {
    const response = await api.post<Payment>(
      `/finance/folios/${folioId}/payments`,
      data,
    );
    return response as unknown as Payment;
  },

  updateFolioStatus: async (id: string, data: UpdateFolioStatusDto) => {
    const response = await api.patch<Folio>(
      `/finance/folios/${id}/status`,
      data,
    );
    return response as unknown as Folio;
  },

  getFoliosByBooking: async (bookingId: string) => {
    const response = await api.get<Folio[]>(
      `/finance/bookings/${bookingId}/folios`,
    );
    return response as unknown as Folio[];
  },

  getRoomChargesSummary: async (id: string) => {
    const response = await api.get<{
      nights: number;
      ratePerNight: number;
      totalRoomCharges: number;
      isEstimated: boolean;
    } | null>(`/finance/folios/${id}/room-charges-summary`);
    return response as unknown as {
      nights: number;
      ratePerNight: number;
      totalRoomCharges: number;
      isEstimated: boolean;
    };
  },

  getFolioStats: async () => {
    const response = await api.get<{
      activeAccounts: number;
      totalFolios: number;
      openFolios: number;
      closedFolios: number;
    }>("/finance/stats/folios");
    return response as unknown as {
      activeAccounts: number;
      totalFolios: number;
      openFolios: number;
      closedFolios: number;
    };
  },
};
