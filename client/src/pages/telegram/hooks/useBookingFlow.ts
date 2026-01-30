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
import type { TabType } from "../components/BottomNav";

const DEFAULT_LOCATION = { lat: 41.2995, lng: 69.2401 }; // Tashkent

export function useBookingFlow() {
  const { haptic, showBackButton, hideBackButton, user, requestLocation } =
    useTelegram();

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>("explore");
  const [step, setStep] = useState<BookingStep>("map");

  // Data State
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [relocating, setRelocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [hotels, setHotels] = useState<NearbyHotel[]>([]);
  const [trendingHotels, setTrendingHotels] = useState<NearbyHotel[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [totalHotels, setTotalHotels] = useState(0);

  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

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

  // Load nearby hotels (with optional search)
  const loadNearbyHotels = useCallback(
    async (lat?: number, lng?: number, search?: string, p: number = 1) => {
      if (p === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const response = await publicBookingApi.findNearbyHotels(
          lat,
          lng,
          50,
          search,
          p,
          10,
        );

        if (p === 1) {
          setHotels(response.data);
        } else {
          setHotels((prev) => [...prev, ...response.data]);
        }

        setTotalHotels(response.total);
        setHasMore(response.hasMore);
        setPage(p);
      } catch (err) {
        console.error("Failed to find hotels", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  // Load more hotels
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const lat = userLocation?.lat || DEFAULT_LOCATION.lat;
    const lng = userLocation?.lng || DEFAULT_LOCATION.lng;
    loadNearbyHotels(lat, lng, searchQuery, page + 1);
  }, [loadingMore, hasMore, userLocation, searchQuery, page, loadNearbyHotels]);

  // Load trending hotels
  const loadTrendingData = useCallback(async () => {
    try {
      const data = await publicBookingApi.findTrendingHotels();
      setTrendingHotels(data);
    } catch (err) {
      console.error("Failed to load trending hotels", err);
    }
  }, []);

  // Load user bookings
  const loadUserBookings = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await publicBookingApi.getMyBookings(user.id.toString());
      setMyBookings(data);
    } catch (err) {
      console.error("Failed to load user bookings", err);
    }
  }, [user]);

  // Handle Search
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (!userLocation) return;
      loadNearbyHotels(userLocation.lat, userLocation.lng, query, 1);
    },
    [userLocation, loadNearbyHotels],
  );

  // Initial load
  useEffect(() => {
    setLoading(true);
    requestLocation(
      (lat: number, lng: number) => {
        const loc = { lat, lng };
        setUserLocation(loc);
        loadNearbyHotels(lat, lng);
      },
      () => {
        setUserLocation(DEFAULT_LOCATION);
        loadNearbyHotels(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng);
      },
    );
    loadTrendingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect: Load bookings when tab switches
  useEffect(() => {
    if (activeTab === "bookings") {
      loadUserBookings();
    }
  }, [activeTab, loadUserBookings]);

  // Back button handling
  useEffect(() => {
    if (activeTab === "explore" && step !== "map" && step !== "success") {
      showBackButton(() => goBack());
    } else {
      hideBackButton();
    }
  }, [step, activeTab, showBackButton, hideBackButton]);

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
      hotel: "map",
      dates: "hotel",
      rooms: "dates",
      guest: "rooms",
      confirm: "guest",
      success: "map",
    };
    setStep(backMap[step]);
  }, [step, haptic]);

  // Relocate user - re-detect GPS location
  const relocate = useCallback(() => {
    setRelocating(true);
    haptic("medium");
    requestLocation(
      (lat: number, lng: number) => {
        const loc = { lat, lng };
        setUserLocation(loc);
        loadNearbyHotels(lat, lng);
        setRelocating(false);
        message.success("Location updated!");
      },
      (err: string) => {
        setRelocating(false);
        message.error(err);
      },
    );
  }, [haptic, loadNearbyHotels, requestLocation]);

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
    activeTab,
    step,
    loading,
    loadingMore,
    relocating,
    searchQuery,
    userLocation,
    hotels,
    trendingHotels,
    myBookings,
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
    hasMore,
    totalHotels,

    // Actions
    setActiveTab,
    handleSearch,
    setCheckIn,
    setCheckOut,
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
    haptic,
    loadMore,
  };
}
