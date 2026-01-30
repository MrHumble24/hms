import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import dayjs from "dayjs";
import { useTelegram } from "@/shared/hooks/use-telegram";
import { publicBookingApi } from "@/shared/api/public-booking-api";
import type {
  NearbyHotel,
  AvailabilityResponse,
  RoomTypeAvailability,
} from "@/shared/api/public-booking-api";
import type { BookingStep, BookingResult, GuestFormValues } from "../types";

const DEFAULT_LOCATION = { lat: 41.2995, lng: 69.2401 }; // Tashkent

export function useBookingFlow() {
  const { haptic, showBackButton, hideBackButton, user } = useTelegram();

  // State
  const [step, setStep] = useState<BookingStep>("map");
  const [loading, setLoading] = useState(false);
  const [relocating, setRelocating] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [hotels, setHotels] = useState<NearbyHotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<NearbyHotel | null>(null);
  const [checkIn, setCheckIn] = useState<dayjs.Dayjs | null>(null);
  const [checkOut, setCheckOut] = useState<dayjs.Dayjs | null>(null);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(
    null,
  );
  const [selectedRoom, setSelectedRoom] = useState<RoomTypeAvailability | null>(
    null,
  );
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(
    null,
  );

  // Computed values
  const nights = checkIn && checkOut ? checkOut.diff(checkIn, "day") : 0;
  const totalPrice = selectedRoom ? Number(selectedRoom.basePrice) * nights : 0;
  const mapCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng];

  // Initialize location and load hotels
  useEffect(() => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          loadNearbyHotels(loc.lat, loc.lng);
        },
        () => {
          setUserLocation(DEFAULT_LOCATION);
          loadNearbyHotels(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng);
        },
        { timeout: 10000, enableHighAccuracy: true },
      );
    } else {
      setUserLocation(DEFAULT_LOCATION);
      loadNearbyHotels(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng);
    }
  }, []);

  // Back button handling
  useEffect(() => {
    if (step !== "map" && step !== "success") {
      showBackButton(() => goBack());
    } else {
      hideBackButton();
    }
  }, [step]);

  // Load nearby hotels
  const loadNearbyHotels = useCallback(async (lat: number, lng: number) => {
    try {
      const data = await publicBookingApi.findNearbyHotels(lat, lng);
      setHotels(data);
    } catch (err) {
      console.error("Failed to find hotels", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load hotel by ID
  const loadHotelById = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await publicBookingApi.getHotelDetails(id);
      setSelectedHotel(data);
      setStep("hotel");
    } catch (err) {
      message.error("Failed to load hotel");
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle map click
  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      setUserLocation({ lat, lng });
      haptic("light");
      loadNearbyHotels(lat, lng);
    },
    [haptic, loadNearbyHotels],
  );

  // Select hotel
  const selectHotel = useCallback(
    (hotel: NearbyHotel) => {
      setSelectedHotel(hotel);
      setStep("hotel");
      haptic("selection");
    },
    [haptic],
  );

  // Proceed to dates
  const goToDates = useCallback(() => {
    setStep("dates");
    haptic("medium");
  }, [haptic]);

  // Check availability
  const checkAvailability = useCallback(async () => {
    if (!selectedHotel || !checkIn || !checkOut) return;
    setLoading(true);
    haptic("medium");
    try {
      const data = await publicBookingApi.checkAvailability(
        selectedHotel.id,
        checkIn.format("YYYY-MM-DD"),
        checkOut.format("YYYY-MM-DD"),
      );
      setAvailability(data);
      setStep("rooms");
    } catch (err: any) {
      message.error(
        err.response?.data?.message || "Failed to check availability",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedHotel, checkIn, checkOut, haptic]);

  // Select room
  const selectRoom = useCallback(
    (room: RoomTypeAvailability) => {
      setSelectedRoom(room);
      setStep("guest");
      haptic("selection");
    },
    [haptic],
  );

  // Submit guest info
  const submitGuestInfo = useCallback(() => {
    setStep("confirm");
    haptic("medium");
  }, [haptic]);

  // Confirm booking
  const confirmBooking = useCallback(
    async (guestInfo: GuestFormValues) => {
      if (!selectedHotel || !selectedRoom || !checkIn || !checkOut) return;
      setLoading(true);
      haptic("medium");

      try {
        const result = await publicBookingApi.createBooking({
          branchId: selectedHotel.id,
          roomTypeId: selectedRoom.id,
          checkIn: checkIn.format("YYYY-MM-DD"),
          checkOut: checkOut.format("YYYY-MM-DD"),
          firstName: guestInfo.firstName,
          lastName: guestInfo.lastName,
          phone: guestInfo.phone,
          email: guestInfo.email,
          citizenship: guestInfo.citizenship || "N/A",
          passportSeries: guestInfo.passportSeries || "XX",
          passportNumber: guestInfo.passportNumber || "0000000",
          dateOfBirth:
            guestInfo.dateOfBirth?.format("YYYY-MM-DD") || "1990-01-01",
          gender: guestInfo.gender || "MALE",
          telegramUserId: user?.id?.toString(),
        });

        setBookingResult(result);
        haptic("success");
        setStep("success");
      } catch (err: any) {
        haptic("error");
        message.error(err.response?.data?.message || "Booking failed");
      } finally {
        setLoading(false);
      }
    },
    [selectedHotel, selectedRoom, checkIn, checkOut, user, haptic],
  );

  // Go back
  const goBack = useCallback(() => {
    haptic("light");
    const backMap: Record<BookingStep, BookingStep> = {
      map: "map",
      hotel: hotels.length > 0 ? "map" : "map",
      dates: "hotel",
      rooms: "dates",
      guest: "rooms",
      confirm: "guest",
      success: "map",
    };
    setStep(backMap[step]);
  }, [step, hotels.length, haptic]);

  // Relocate user - re-detect GPS location
  const relocate = useCallback(() => {
    if (!navigator.geolocation) {
      message.error("Geolocation not supported");
      return;
    }
    setRelocating(true);
    haptic("medium");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        loadNearbyHotels(loc.lat, loc.lng);
        setRelocating(false);
        message.success("Location updated!");
      },
      (err) => {
        setRelocating(false);
        message.error("Failed to get location. Please try again.");
        console.error("Geolocation error:", err);
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  }, [haptic, loadNearbyHotels]);

  // Reset flow
  const reset = useCallback(() => {
    setStep("map");
    setSelectedHotel(null);
    setCheckIn(null);
    setCheckOut(null);
    setAvailability(null);
    setSelectedRoom(null);
    setBookingResult(null);
  }, []);

  return {
    // State
    step,
    loading,
    relocating,
    userLocation,
    hotels,
    selectedHotel,
    checkIn,
    checkOut,
    availability,
    selectedRoom,
    bookingResult,
    nights,
    totalPrice,
    mapCenter,
    user,

    // Setters
    setCheckIn,
    setCheckOut,

    // Actions
    loadHotelById,
    handleMapClick,
    selectHotel,
    goToDates,
    checkAvailability,
    selectRoom,
    submitGuestInfo,
    confirmBooking,
    goBack,
    relocate,
    reset,
  };
}
