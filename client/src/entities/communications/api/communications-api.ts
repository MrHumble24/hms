import { baseApi } from "@/shared/api/base-api";

export interface Communication {
  id: string;
  guestId: string;
  bookingId?: string;
  type: CommunicationType;
  channel: CommunicationChannel;
  subject?: string;
  content: string;
  status: CommunicationStatus;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  createdAt: string;
  guest?: {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
  };
  booking?: {
    id: string;
    checkIn: string;
    checkOut: string;
  };
}

export type CommunicationType =
  | "BOOKING_CONFIRMATION"
  | "PRE_ARRIVAL"
  | "WELCOME"
  | "CHECKOUT_REMINDER"
  | "POST_STAY_SURVEY"
  | "MARKETING";

export type CommunicationChannel = "EMAIL" | "SMS" | "WHATSAPP" | "TELEGRAM";

export type CommunicationStatus =
  | "PENDING"
  | "SENT"
  | "DELIVERED"
  | "OPENED"
  | "FAILED"
  | "BOUNCED";

export interface CreateCommunicationDto {
  guestId: string;
  bookingId?: string;
  type: CommunicationType;
  channel: CommunicationChannel;
  subject?: string;
  content: string;
}

export const communicationsApi = {
  getAll: (params?: {
    guestId?: string;
    bookingId?: string;
    type?: CommunicationType;
    status?: CommunicationStatus;
  }) =>
    baseApi
      .get<Communication[]>("/communications", { params })
      .then((res) => res as unknown as Communication[]),

  getOne: (id: string) =>
    baseApi
      .get<Communication>(`/communications/${id}`)
      .then((res) => res as unknown as Communication),

  getByGuest: (guestId: string) =>
    baseApi
      .get<Communication[]>(`/communications/guest/${guestId}`)
      .then((res) => res as unknown as Communication[]),

  getByBooking: (bookingId: string) =>
    baseApi
      .get<Communication[]>(`/communications/booking/${bookingId}`)
      .then((res) => res as unknown as Communication[]),

  create: (data: CreateCommunicationDto) =>
    baseApi
      .post<Communication>("/communications", data)
      .then((res) => res as unknown as Communication),

  updateStatus: (id: string, status: CommunicationStatus) =>
    baseApi
      .patch<Communication>(`/communications/${id}/status`, { status })
      .then((res) => res as unknown as Communication),

  sendBookingConfirmation: (bookingId: string) =>
    baseApi
      .post<Communication>(`/communications/booking/${bookingId}/confirmation`)
      .then((res) => res as unknown as Communication),
};
