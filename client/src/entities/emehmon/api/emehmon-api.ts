import { baseApi } from "@/shared/api/base-api";

export interface EmehmonLog {
  id: string;
  bookingId: string;
  guestId: string;
  status: EmehmonStatus;
  requestJson: any;
  responseJson?: any;
  errorMessage?: string;
  regSlipNumber?: string;
  regSlipUrl?: string;
  qrCodeData?: string;
  qrCodeUrl?: string;
  registeredAt?: string;
  expiresAt?: string;
  retryCount: number;
  createdAt: string;
  guest?: {
    firstName: string;
    lastName: string;
    passportSeries: string;
    passportNumber: string;
    citizenship: string;
  };
  booking?: {
    id: string;
    checkIn: string;
    checkOut: string;
  };
}

export type EmehmonStatus =
  | "PENDING"
  | "SUBMITTED"
  | "SUCCESS"
  | "FAILED"
  | "RETRY";

export const emehmonApi = {
  registerGuest: (bookingId: string) =>
    baseApi
      .post<EmehmonLog>(`/emehmon/register/${bookingId}`)
      .then((res) => res as unknown as EmehmonLog),

  getLogsByBooking: (bookingId: string) =>
    baseApi
      .get<EmehmonLog[]>(`/emehmon/booking/${bookingId}`)
      .then((res) => res as unknown as EmehmonLog[]),
};
