import {
  publicBookingApi,
  type AvailabilityResponse,
  type NearbyHotel,
  type RoomTypeAvailability,
} from "@/shared/api/public-booking-api";
import { useTelegram } from "@/shared/hooks/use-telegram";
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  SearchOutlined,
  StarFilled,
} from "@ant-design/icons";
import { DatePicker, message, Spin } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./telegram-app.css";

type Step = "discover" | "dates" | "rooms" | "guest" | "confirm" | "success";

interface GuestInfo {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  citizenship: string;
  passportSeries: string;
  passportNumber: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "";
}

export const TelegramBookingPage = () => {
  const [searchParams] = useSearchParams();
  const {
    haptic,
    showBackButton,
    hideBackButton,
    user,
    getStartParam,
    requestLocation,
  } = useTelegram();

  // State
  const [step, setStep] = useState<Step>("discover");
  const [loading, setLoading] = useState(false);
  const [hotels, setHotels] = useState<NearbyHotel[]>([]);
  const [hotel, setHotel] = useState<NearbyHotel | null>(null);
  const [checkIn, setCheckIn] = useState<dayjs.Dayjs | null>(null);
  const [checkOut, setCheckOut] = useState<dayjs.Dayjs | null>(null);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(
    null,
  );
  const [selectedRoom, setSelectedRoom] = useState<RoomTypeAvailability | null>(
    null,
  );
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
    phone: "",
    email: "",
    citizenship: "",
    passportSeries: "",
    passportNumber: "",
    dateOfBirth: "",
    gender: "",
  });
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [locationRequested, setLocationRequested] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get hotel ID from URL or Telegram start_param
  const hotelId = searchParams.get("hotel") || getStartParam();
  const urlLat = searchParams.get("lat");
  const urlLng = searchParams.get("lng");

  // Load hotel details if ID provided
  useEffect(() => {
    if (hotelId) {
      loadHotel(hotelId);
    } else if (urlLat && urlLng) {
      // If coordinates provided, search nearby
      loadNearbyHotels(parseFloat(urlLat), parseFloat(urlLng));
    }
  }, [hotelId, urlLat, urlLng]);

  // Back button handling
  useEffect(() => {
    if (step !== "discover" && step !== "success") {
      showBackButton(() => goBack());
    } else {
      hideBackButton();
    }
  }, [step]);

  const loadHotel = async (id: string) => {
    setLoading(true);
    try {
      const data = await publicBookingApi.getHotelDetails(id);
      setHotel(data);
      setStep("dates");
    } catch (err) {
      message.error("Failed to load hotel details");
    } finally {
      setLoading(false);
    }
  };

  const loadNearbyHotels = async (lat: number, lng: number) => {
    setLoading(true);
    setLocationError(null);
    setUserLocation({ lat, lng });
    try {
      const data = await publicBookingApi.findNearbyHotels(lat, lng);
      setHotels(data);
    } catch (err) {
      message.error("Failed to find nearby hotels");
    } finally {
      setLoading(false);
      setLocationRequested(false);
    }
  };

  const handleRequestLocation = () => {
    setLocationRequested(true);
    setLocationError(null);
    haptic("medium");

    requestLocation(
      (lat, lng) => {
        loadNearbyHotels(lat, lng);
      },
      (error) => {
        setLocationError(error);
        setLocationRequested(false);
      },
    );
  };

  const selectHotel = (selectedHotel: NearbyHotel) => {
    haptic("selection");
    setHotel(selectedHotel);
    setStep("dates");
  };

  const checkRoomAvailability = async () => {
    if (!hotel || !checkIn || !checkOut) return;

    setLoading(true);
    haptic("medium");

    try {
      const data = await publicBookingApi.checkAvailability(
        hotel.id,
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
  };

  const handleRoomSelect = (room: RoomTypeAvailability) => {
    setSelectedRoom(room);
    haptic("selection");
    setStep("guest");
  };

  const handleGuestInfoChange = (field: keyof GuestInfo, value: string) => {
    setGuestInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfirm = () => {
    const required: (keyof GuestInfo)[] = [
      "firstName",
      "lastName",
      "phone",
      "citizenship",
      "passportSeries",
      "passportNumber",
      "dateOfBirth",
      "gender",
    ];
    const missing = required.filter((f) => !guestInfo[f]);

    if (missing.length > 0) {
      haptic("error");
      message.error("Please fill in all required fields");
      return;
    }

    haptic("medium");
    setStep("confirm");
  };

  const handleBooking = async () => {
    if (!hotel || !selectedRoom || !checkIn || !checkOut) return;

    setLoading(true);
    haptic("medium");

    try {
      const result = await publicBookingApi.createBooking({
        branchId: hotel.id,
        roomTypeId: selectedRoom.id,
        checkIn: checkIn.format("YYYY-MM-DD"),
        checkOut: checkOut.format("YYYY-MM-DD"),
        firstName: guestInfo.firstName,
        lastName: guestInfo.lastName,
        phone: guestInfo.phone,
        email: guestInfo.email || undefined,
        citizenship: guestInfo.citizenship,
        passportSeries: guestInfo.passportSeries,
        passportNumber: guestInfo.passportNumber,
        dateOfBirth: guestInfo.dateOfBirth,
        gender: guestInfo.gender as "MALE" | "FEMALE",
        telegramUserId: user?.id?.toString(),
      });

      setBookingResult(result);
      haptic("success");
      setStep("success");
    } catch (err: any) {
      haptic("error");
      message.error(
        err.response?.data?.message || "Booking failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    haptic("light");
    if (step === "dates" && hotels.length > 0) {
      setHotel(null);
      setStep("discover");
    } else {
      const steps: Step[] = ["discover", "dates", "rooms", "guest", "confirm"];
      const currentIndex = steps.indexOf(step);
      if (currentIndex > 0) {
        setStep(steps[currentIndex - 1]);
      }
    }
  };

  const nights = checkIn && checkOut ? checkOut.diff(checkIn, "day") : 0;
  const totalPrice = selectedRoom ? Number(selectedRoom.basePrice) * nights : 0;

  // ==================== RENDER ====================

  // Loading state
  if (loading && !hotel && hotels.length === 0) {
    return (
      <div className="tg-app">
        <div className="tg-loading">
          <div className="tg-spinner" />
          <p>Searching for hotels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tg-app">
      {/* Step: Discover Hotels */}
      {step === "discover" && !hotel && (
        <>
          <div className="tg-header">
            <div className="tg-header-content">
              <h1 className="tg-header-title">🏨 HMS Booking</h1>
              <p className="tg-header-subtitle">Find your perfect stay</p>
            </div>
          </div>

          {hotels.length === 0 ? (
            <div className="tg-section" style={{ paddingTop: 40 }}>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>📍</div>
                <h2
                  style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}
                >
                  Find Hotels Near You
                </h2>
                <p style={{ color: "#666", fontSize: 14, margin: "0 0 24px" }}>
                  Share your location to discover the best hotels nearby
                </p>
              </div>

              <button
                className="tg-button"
                onClick={handleRequestLocation}
                disabled={locationRequested && !userLocation}
              >
                {locationRequested && !userLocation ? (
                  <>
                    <Spin size="small" style={{ marginRight: 8 }} />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <EnvironmentOutlined /> Share My Location
                  </>
                )}
              </button>

              {locationError && (
                <div
                  style={{
                    textAlign: "center",
                    marginTop: 16,
                    color: "#ff4d4f",
                    fontSize: 13,
                  }}
                >
                  {locationError}
                </div>
              )}

              <div style={{ textAlign: "center", marginTop: 24 }}>
                <p style={{ color: "#999", fontSize: 12 }}>
                  Or select a hotel from the bot menu
                </p>
              </div>
            </div>
          ) : (
            <div className="tg-section">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <SearchOutlined style={{ color: "#1677ff" }} />
                <span style={{ fontSize: 14, color: "#666" }}>
                  Found {hotels.length} hotels near you
                </span>
              </div>

              {hotels.map((h) => (
                <div
                  key={h.id}
                  className="tg-card"
                  onClick={() => selectHotel(h)}
                  style={{ cursor: "pointer" }}
                >
                  {h.logoUrl && (
                    <img
                      src={h.logoUrl}
                      alt={h.name}
                      className="tg-card-image"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <div className="tg-card-body">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div>
                        <h3 className="tg-card-title">
                          {h.isFeatured && (
                            <StarFilled
                              style={{ color: "#ffc107", marginRight: 6 }}
                            />
                          )}
                          {h.name}
                        </h3>
                        <p className="tg-card-subtitle">
                          <EnvironmentOutlined />{" "}
                          {h.address || "Address available at hotel"}
                        </p>
                      </div>
                      {h.starRating && (
                        <span className="tg-badge tg-badge-promoted">
                          ⭐ {h.starRating}
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        marginTop: 12,
                      }}
                    >
                      <span className="tg-badge tg-badge-distance">
                        📏 {h.distance.toFixed(1)} km
                      </span>
                      {h.startingPrice && (
                        <span className="tg-badge tg-badge-price">
                          💰 From {h.currency} {h.startingPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Step: Date Selection */}
      {step === "dates" && hotel && (
        <>
          <div className="tg-gallery">
            <img
              src={
                hotel.logoUrl ||
                "https://via.placeholder.com/400x280?text=Hotel"
              }
              alt={hotel.name}
              className="tg-gallery-image"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://via.placeholder.com/400x280?text=Hotel";
              }}
            />
            <div className="tg-gallery-overlay">
              <h1 className="tg-gallery-title">
                {hotel.isFeatured && "⭐ "}
                {hotel.name}
              </h1>
              <p className="tg-gallery-address">
                <EnvironmentOutlined /> {hotel.address}
              </p>
            </div>
          </div>

          <div className="tg-section">
            <h2 className="tg-section-title">Select Your Dates</h2>

            <div className="tg-date-card">
              <div className="tg-date-label">CHECK-IN</div>
              <DatePicker
                value={checkIn}
                onChange={setCheckIn}
                format="MMMM D, YYYY"
                style={{ width: "100%", padding: "12px" }}
                size="large"
                disabledDate={(current) =>
                  current && current < dayjs().startOf("day")
                }
                placeholder="Select check-in date"
              />
            </div>

            <div className="tg-date-card">
              <div className="tg-date-label">CHECK-OUT</div>
              <DatePicker
                value={checkOut}
                onChange={setCheckOut}
                format="MMMM D, YYYY"
                style={{ width: "100%", padding: "12px" }}
                size="large"
                disabledDate={(current) =>
                  current && current <= (checkIn || dayjs())
                }
                placeholder="Select check-out date"
              />
            </div>

            {nights > 0 && (
              <div
                style={{ textAlign: "center", padding: "16px", color: "#666" }}
              >
                <ClockCircleOutlined /> {nights} night{nights > 1 ? "s" : ""}
              </div>
            )}

            <button
              className="tg-button"
              onClick={checkRoomAvailability}
              disabled={!checkIn || !checkOut || loading}
            >
              {loading ? "Checking..." : "Check Availability"}
            </button>
          </div>
        </>
      )}

      {/* Step: Room Selection */}
      {step === "rooms" && availability && (
        <>
          <div className="tg-header">
            <div className="tg-header-content">
              <h1 className="tg-header-title">Select a Room</h1>
              <p className="tg-header-subtitle">
                {availability.checkIn} → {availability.checkOut} ·{" "}
                {availability.nights} nights
              </p>
            </div>
          </div>

          {availability.roomTypes.length === 0 ? (
            <div className="tg-loading">
              <p>😔 No rooms available for these dates</p>
              <button
                className="tg-button tg-button-secondary"
                onClick={() => setStep("dates")}
              >
                Try Different Dates
              </button>
            </div>
          ) : (
            <div className="tg-section">
              {availability.roomTypes.map((room) => (
                <div
                  key={room.id}
                  className={`tg-room-card ${selectedRoom?.id === room.id ? "selected" : ""}`}
                  onClick={() => handleRoomSelect(room)}
                >
                  <div className="tg-room-header">
                    <div>
                      <h3 className="tg-room-name">{room.name}</h3>
                      <div className="tg-room-availability">
                        ✓ {room.availableRooms} room
                        {room.availableRooms > 1 ? "s" : ""} left
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="tg-room-price">
                        {availability.branch.currency}{" "}
                        {Number(room.basePrice).toLocaleString()}
                      </div>
                      <div className="tg-room-price-label">per night</div>
                    </div>
                  </div>
                  {room.description && (
                    <p
                      style={{ fontSize: 13, color: "#666", margin: "8px 0 0" }}
                    >
                      {room.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Step: Guest Information */}
      {step === "guest" && (
        <>
          <div className="tg-header">
            <div className="tg-header-content">
              <h1 className="tg-header-title">Guest Information</h1>
              <p className="tg-header-subtitle">Please fill in your details</p>
            </div>
          </div>

          <div className="tg-form">
            <div className="tg-form-row">
              <div className="tg-form-group">
                <label className="tg-form-label">First Name *</label>
                <input
                  className="tg-form-input"
                  value={guestInfo.firstName}
                  onChange={(e) =>
                    handleGuestInfoChange("firstName", e.target.value)
                  }
                  placeholder="John"
                />
              </div>
              <div className="tg-form-group">
                <label className="tg-form-label">Last Name *</label>
                <input
                  className="tg-form-input"
                  value={guestInfo.lastName}
                  onChange={(e) =>
                    handleGuestInfoChange("lastName", e.target.value)
                  }
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="tg-form-group">
              <label className="tg-form-label">Phone Number *</label>
              <input
                className="tg-form-input"
                type="tel"
                value={guestInfo.phone}
                onChange={(e) => handleGuestInfoChange("phone", e.target.value)}
                placeholder="+998 90 123 45 67"
              />
            </div>

            <div className="tg-form-group">
              <label className="tg-form-label">Email (Optional)</label>
              <input
                className="tg-form-input"
                type="email"
                value={guestInfo.email}
                onChange={(e) => handleGuestInfoChange("email", e.target.value)}
                placeholder="john@example.com"
              />
            </div>

            <div className="tg-form-group">
              <label className="tg-form-label">Citizenship *</label>
              <input
                className="tg-form-input"
                value={guestInfo.citizenship}
                onChange={(e) =>
                  handleGuestInfoChange("citizenship", e.target.value)
                }
                placeholder="Uzbekistan"
              />
            </div>

            <div className="tg-form-row">
              <div className="tg-form-group">
                <label className="tg-form-label">Passport Series *</label>
                <input
                  className="tg-form-input"
                  value={guestInfo.passportSeries}
                  onChange={(e) =>
                    handleGuestInfoChange(
                      "passportSeries",
                      e.target.value.toUpperCase(),
                    )
                  }
                  placeholder="AA"
                  maxLength={2}
                />
              </div>
              <div className="tg-form-group">
                <label className="tg-form-label">Passport Number *</label>
                <input
                  className="tg-form-input"
                  value={guestInfo.passportNumber}
                  onChange={(e) =>
                    handleGuestInfoChange("passportNumber", e.target.value)
                  }
                  placeholder="1234567"
                />
              </div>
            </div>

            <div className="tg-form-group">
              <label className="tg-form-label">Date of Birth *</label>
              <input
                className="tg-form-input"
                type="date"
                value={guestInfo.dateOfBirth}
                onChange={(e) =>
                  handleGuestInfoChange("dateOfBirth", e.target.value)
                }
              />
            </div>

            <div className="tg-form-group">
              <label className="tg-form-label">Gender *</label>
              <div className="tg-gender-selector">
                <div
                  className={`tg-gender-option ${guestInfo.gender === "MALE" ? "selected" : ""}`}
                  onClick={() => handleGuestInfoChange("gender", "MALE")}
                >
                  <span className="tg-gender-icon">👨</span>
                  <span className="tg-gender-label">Male</span>
                </div>
                <div
                  className={`tg-gender-option ${guestInfo.gender === "FEMALE" ? "selected" : ""}`}
                  onClick={() => handleGuestInfoChange("gender", "FEMALE")}
                >
                  <span className="tg-gender-icon">👩</span>
                  <span className="tg-gender-label">Female</span>
                </div>
              </div>
            </div>

            <button className="tg-button" onClick={handleConfirm}>
              Continue to Summary
            </button>
          </div>
        </>
      )}

      {/* Step: Confirmation */}
      {step === "confirm" && hotel && selectedRoom && (
        <>
          <div className="tg-header">
            <div className="tg-header-content">
              <h1 className="tg-header-title">Confirm Booking</h1>
              <p className="tg-header-subtitle">Review your reservation</p>
            </div>
          </div>

          <div className="tg-summary">
            <div className="tg-summary-row">
              <span className="tg-summary-label">🏨 Hotel</span>
              <span className="tg-summary-value">{hotel.name}</span>
            </div>
            <div className="tg-summary-row">
              <span className="tg-summary-label">🛏️ Room</span>
              <span className="tg-summary-value">{selectedRoom.name}</span>
            </div>
            <div className="tg-summary-row">
              <span className="tg-summary-label">📅 Check-in</span>
              <span className="tg-summary-value">
                {checkIn?.format("MMM D, YYYY")}
              </span>
            </div>
            <div className="tg-summary-row">
              <span className="tg-summary-label">📅 Check-out</span>
              <span className="tg-summary-value">
                {checkOut?.format("MMM D, YYYY")}
              </span>
            </div>
            <div className="tg-summary-row">
              <span className="tg-summary-label">🌙 Nights</span>
              <span className="tg-summary-value">{nights}</span>
            </div>
            <div className="tg-summary-row">
              <span className="tg-summary-label">👤 Guest</span>
              <span className="tg-summary-value">
                {guestInfo.firstName} {guestInfo.lastName}
              </span>
            </div>
            <div className="tg-summary-row">
              <span className="tg-summary-label">💰 Total</span>
              <span className="tg-summary-total">
                {availability?.branch.currency} {totalPrice.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="tg-section">
            <button
              className="tg-button"
              onClick={handleBooking}
              disabled={loading}
            >
              {loading ? "Processing..." : "✓ Confirm Booking"}
            </button>
          </div>
        </>
      )}

      {/* Step: Success */}
      {step === "success" && bookingResult && (
        <div className="tg-success">
          <div className="tg-success-icon">✓</div>
          <h1 className="tg-success-title">Booking Confirmed!</h1>
          <p className="tg-success-subtitle">
            Your reservation has been successfully made
          </p>

          <div className="tg-confirmation-number">
            {bookingResult.confirmationNumber}
          </div>

          <div className="tg-summary">
            <div className="tg-summary-row">
              <span className="tg-summary-label">🏨 Hotel</span>
              <span className="tg-summary-value">{bookingResult.hotel}</span>
            </div>
            <div className="tg-summary-row">
              <span className="tg-summary-label">🛏️ Room</span>
              <span className="tg-summary-value">{bookingResult.room}</span>
            </div>
            <div className="tg-summary-row">
              <span className="tg-summary-label">🌙 Duration</span>
              <span className="tg-summary-value">
                {bookingResult.nights} nights
              </span>
            </div>
            <div className="tg-summary-row">
              <span className="tg-summary-label">💰 Total</span>
              <span className="tg-summary-total">
                {bookingResult.currency}{" "}
                {bookingResult.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          <p style={{ fontSize: 13, color: "#666", marginTop: 24 }}>
            Please present this confirmation number at the hotel reception.
          </p>
        </div>
      )}

      <div className="tg-bottom-padding" />
    </div>
  );
};

export default TelegramBookingPage;
