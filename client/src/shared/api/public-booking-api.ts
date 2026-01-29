import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface NearbyHotel {
  id: string;
  name: string;
  address: string;
  phone: string;
  logoUrl: string | null;
  latitude: number;
  longitude: number;
  distance: number;
  currency: string;
  starRating: number | null;
  isFeatured: boolean;
  checkInTime: string;
  checkOutTime: string;
  gallery: string[];
  startingPrice: number | null;
}

export interface RoomTypeAvailability {
  id: string;
  name: string;
  description: string | null;
  amenities: string[] | null;
  images: string[] | null;
  basePrice: number;
  totalRooms: number;
  availableRooms: number;
  isAvailable: boolean;
}

export interface AvailabilityResponse {
  branch: {
    id: string;
    name: string;
    address: string;
    checkInTime: string;
    checkOutTime: string;
    currency: string;
  };
  checkIn: string;
  checkOut: string;
  nights: number;
  roomTypes: RoomTypeAvailability[];
}

export interface BookingRequest {
  branchId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  citizenship: string;
  passportSeries: string;
  passportNumber: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE";
  adultsCount?: number;
  childrenCount?: number;
  telegramUserId?: string;
}

export interface BookingResponse {
  success: boolean;
  bookingId: string;
  confirmationNumber: string;
  hotel: string;
  room: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmount: number;
  currency: string;
  guest: string;
}

const publicApi = axios.create({
  baseURL: `${API_URL}/public`,
  headers: {
    "Content-Type": "application/json",
  },
});

export const publicBookingApi = {
  // Find nearby hotels by location
  findNearbyHotels: async (
    lat: number,
    lng: number,
    radiusKm: number = 50,
  ): Promise<NearbyHotel[]> => {
    const { data } = await axios.get(`${API_URL}/public/hotels/nearby`, {
      params: { lat, lng, radiusKm },
    });
    return data;
  },

  // Check room availability for a hotel
  checkAvailability: async (
    branchId: string,
    checkIn: string,
    checkOut: string,
    guests: number = 1,
  ): Promise<AvailabilityResponse> => {
    const { data } = await publicApi.get("/availability", {
      params: { branchId, checkIn, checkOut, guests },
    });
    return data;
  },

  // Create a booking
  createBooking: async (booking: BookingRequest): Promise<BookingResponse> => {
    const { data } = await publicApi.post("/book", booking);
    return data;
  },

  // Get hotel details by ID or slug
  getHotelDetails: async (idOrSlug: string): Promise<NearbyHotel> => {
    const { data } = await axios.get(`${API_URL}/public/hotels/${idOrSlug}`);
    return data;
  },
};
