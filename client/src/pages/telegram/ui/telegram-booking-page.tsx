import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "./telegram-app.css";

import { useBookingFlow } from "../hooks/useBookingFlow";
import {
  MapStep,
  HotelDetailStep,
  DatesStep,
  RoomsStep,
  GuestStep,
  ConfirmStep,
  SuccessStep,
} from "../components";
import type { GuestFormValues } from "../types";

export const TelegramBookingPage = () => {
  const [searchParams] = useSearchParams();
  const [guestInfo, setGuestInfo] = useState<GuestFormValues | null>(null);

  const {
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
    relocate,
  } = useBookingFlow();

  // Check URL params for hotel ID
  const hotelId = searchParams.get("hotel");

  useEffect(() => {
    if (hotelId) {
      loadHotelById(hotelId);
    }
  }, [hotelId, loadHotelById]);

  // Handle guest form submission
  const handleGuestSubmit = (values: GuestFormValues) => {
    setGuestInfo(values);
    submitGuestInfo();
  };

  // Handle booking confirmation
  const handleConfirm = () => {
    if (guestInfo) {
      confirmBooking(guestInfo);
    }
  };

  return (
    <div className="tg-app">
      {/* Step 1: Map */}
      {step === "map" && (
        <MapStep
          mapCenter={mapCenter}
          userLocation={userLocation}
          hotels={hotels}
          loading={loading}
          relocating={relocating}
          onMapClick={handleMapClick}
          onSelectHotel={selectHotel}
          onRelocate={relocate}
        />
      )}

      {/* Step 2: Hotel Detail */}
      {step === "hotel" && selectedHotel && (
        <HotelDetailStep hotel={selectedHotel} onBookNow={goToDates} />
      )}

      {/* Step 3: Date Selection */}
      {step === "dates" && (
        <DatesStep
          checkIn={checkIn}
          checkOut={checkOut}
          loading={loading}
          onCheckInChange={setCheckIn}
          onCheckOutChange={setCheckOut}
          onCheckAvailability={checkAvailability}
        />
      )}

      {/* Step 4: Room Selection */}
      {step === "rooms" && availability && (
        <RoomsStep availability={availability} onSelectRoom={selectRoom} />
      )}

      {/* Step 5: Guest Information */}
      {step === "guest" && (
        <GuestStep
          initialValues={{
            firstName: user?.first_name || "",
            lastName: user?.last_name || "",
          }}
          onSubmit={handleGuestSubmit}
        />
      )}

      {/* Step 6: Confirmation */}
      {step === "confirm" &&
        selectedHotel &&
        selectedRoom &&
        checkIn &&
        checkOut &&
        availability && (
          <ConfirmStep
            hotel={selectedHotel}
            room={selectedRoom}
            checkIn={checkIn}
            checkOut={checkOut}
            nights={nights}
            totalPrice={totalPrice}
            currency={availability.branch.currency}
            loading={loading}
            onConfirm={handleConfirm}
          />
        )}

      {/* Step 7: Success */}
      {step === "success" && bookingResult && (
        <SuccessStep result={bookingResult} />
      )}
    </div>
  );
};

export default TelegramBookingPage;
