import type {
  NearbyHotel,
  AvailabilityResponse,
  RoomTypeAvailability,
} from "@/shared/api/public-booking-api";
import dayjs from "dayjs";

export type BookingStep =
  | "map"
  | "hotel"
  | "dates"
  | "rooms"
  | "guest"
  | "confirm"
  | "success";

export interface BookingState {
  step: BookingStep;
  loading: boolean;
  userLocation: { lat: number; lng: number } | null;
  hotels: NearbyHotel[];
  selectedHotel: NearbyHotel | null;
  checkIn: dayjs.Dayjs | null;
  checkOut: dayjs.Dayjs | null;
  availability: AvailabilityResponse | null;
  selectedRoom: RoomTypeAvailability | null;
  bookingResult: BookingResult | null;
}

export interface BookingResult {
  confirmationNumber: string;
  hotel: string;
  room: string;
  nights: number;
  currency: string;
  totalAmount: number;
}

export interface GuestFormValues {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  gender?: "MALE" | "FEMALE";
  citizenship?: string;
  passportSeries?: string;
  passportNumber?: string;
  dateOfBirth?: dayjs.Dayjs;
}
