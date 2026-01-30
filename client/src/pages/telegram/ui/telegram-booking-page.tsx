import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import {
  Button,
  Card,
  DatePicker,
  Input,
  message,
  Spin,
  Rate,
  Tag,
  Empty,
  Form,
  Select,
  Divider,
} from "antd";
import {
  EnvironmentOutlined,
  PhoneOutlined,
  CalendarOutlined,
  UserOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTelegram } from "@/shared/hooks/use-telegram";
import {
  publicBookingApi,
  type NearbyHotel,
  type AvailabilityResponse,
  type RoomTypeAvailability,
} from "@/shared/api/public-booking-api";
import "./telegram-app.css";

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

type Step =
  | "map"
  | "hotels"
  | "hotel"
  | "dates"
  | "rooms"
  | "guest"
  | "confirm"
  | "success";

// Component to update map view
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

// Component to handle map click
function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export const TelegramBookingPage = () => {
  const [searchParams] = useSearchParams();
  const { haptic, showBackButton, hideBackButton, user } = useTelegram();
  const [form] = Form.useForm();

  // State
  const [step, setStep] = useState<Step>("map");
  const [loading, setLoading] = useState(false);
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
  const [bookingResult, setBookingResult] = useState<any>(null);

  // Default location (Tashkent)
  const defaultLocation = { lat: 41.2995, lng: 69.2401 };
  const mapCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [defaultLocation.lat, defaultLocation.lng];

  // Check URL params for hotel ID
  const hotelId = searchParams.get("hotel");

  useEffect(() => {
    if (hotelId) {
      loadHotelById(hotelId);
    }
  }, [hotelId]);

  // Back button handling
  useEffect(() => {
    if (step !== "map" && step !== "success") {
      showBackButton(() => goBack());
    } else {
      hideBackButton();
    }
  }, [step]);

  // Get user location on mount
  useEffect(() => {
    if (!userLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          // Use default location if geolocation fails
          setUserLocation(defaultLocation);
        },
      );
    }
  }, []);

  const loadHotelById = async (id: string) => {
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
  };

  const searchHotels = async (lat: number, lng: number) => {
    setLoading(true);
    setUserLocation({ lat, lng });
    haptic("medium");
    try {
      const data = await publicBookingApi.findNearbyHotels(lat, lng);
      setHotels(data);
      setStep("hotels");
    } catch (err) {
      message.error("Failed to find hotels");
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setUserLocation({ lat, lng });
    haptic("light");
  };

  const handleSearchHere = () => {
    if (userLocation) {
      searchHotels(userLocation.lat, userLocation.lng);
    }
  };

  const handleSelectHotel = (hotel: NearbyHotel) => {
    setSelectedHotel(hotel);
    setStep("hotel");
    haptic("selection");
  };

  const handleBookNow = () => {
    setStep("dates");
    haptic("medium");
  };

  const checkAvailability = async () => {
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
  };

  const handleSelectRoom = (room: RoomTypeAvailability) => {
    setSelectedRoom(room);
    setStep("guest");
    haptic("selection");
  };

  const handleGuestSubmit = () => {
    setStep("confirm");
    haptic("medium");
  };

  const handleConfirmBooking = async () => {
    if (!selectedHotel || !selectedRoom || !checkIn || !checkOut) return;

    const values = form.getFieldsValue();
    setLoading(true);
    haptic("medium");

    try {
      const result = await publicBookingApi.createBooking({
        branchId: selectedHotel.id,
        roomTypeId: selectedRoom.id,
        checkIn: checkIn.format("YYYY-MM-DD"),
        checkOut: checkOut.format("YYYY-MM-DD"),
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        email: values.email || undefined,
        citizenship: values.citizenship || "N/A",
        passportSeries: values.passportSeries || "XX",
        passportNumber: values.passportNumber || "0000000",
        dateOfBirth: values.dateOfBirth?.format("YYYY-MM-DD") || "1990-01-01",
        gender: values.gender || "MALE",
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
  };

  const goBack = () => {
    haptic("light");
    const backMap: Record<Step, Step> = {
      hotels: "map",
      hotel: hotels.length > 0 ? "hotels" : "map",
      dates: "hotel",
      rooms: "dates",
      guest: "rooms",
      confirm: "guest",
      success: "map",
      map: "map",
    };
    setStep(backMap[step]);
  };

  const nights = checkIn && checkOut ? checkOut.diff(checkIn, "day") : 0;
  const totalPrice = selectedRoom ? Number(selectedRoom.basePrice) * nights : 0;

  // Loading screen
  if (loading && step === "map") {
    return (
      <div className="tg-loading">
        <Spin size="large" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="tg-app">
      {/* Step 1: Map */}
      {step === "map" && (
        <div className="tg-map-container">
          <div className="tg-map-header">
            <h2>🏨 Find Hotels Near You</h2>
            <p>Tap on the map or use your location</p>
          </div>

          <div className="tg-map-wrapper">
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapUpdater center={mapCenter} />
              <MapClickHandler onLocationSelect={handleMapClick} />
              {userLocation && (
                <Marker position={[userLocation.lat, userLocation.lng]}>
                  <Popup>📍 Search here</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>

          <div className="tg-map-actions">
            <Button
              type="primary"
              size="large"
              block
              icon={<EnvironmentOutlined />}
              onClick={handleSearchHere}
              loading={loading}
              disabled={!userLocation}
            >
              Search Hotels Here
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Hotels List */}
      {step === "hotels" && (
        <div className="tg-hotels-list">
          <div className="tg-section-header">
            <h2>🏨 Hotels Near You</h2>
            <p>{hotels.length} hotels found</p>
          </div>

          {hotels.length === 0 ? (
            <Empty description="No hotels found nearby" />
          ) : (
            hotels.map((hotel) => (
              <Card
                key={hotel.id}
                className="tg-hotel-card"
                hoverable
                onClick={() => handleSelectHotel(hotel)}
                cover={
                  hotel.logoUrl ? (
                    <img src={hotel.logoUrl} alt={hotel.name} />
                  ) : null
                }
              >
                <div className="tg-hotel-info">
                  <div className="tg-hotel-header">
                    <h3>{hotel.name}</h3>
                    {hotel.starRating && (
                      <Rate disabled defaultValue={hotel.starRating} />
                    )}
                  </div>
                  {hotel.isFeatured && <Tag color="gold">Featured</Tag>}
                  <p>
                    <EnvironmentOutlined /> {hotel.distance.toFixed(1)} km away
                  </p>
                  {hotel.address && (
                    <p className="tg-hotel-address">{hotel.address}</p>
                  )}
                  {hotel.startingPrice && (
                    <p className="tg-hotel-price">
                      From{" "}
                      <strong>
                        {hotel.currency} {hotel.startingPrice.toLocaleString()}
                      </strong>
                      /night
                    </p>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Step 3: Hotel Detail */}
      {step === "hotel" && selectedHotel && (
        <div className="tg-hotel-detail">
          {selectedHotel.logoUrl && (
            <img
              src={selectedHotel.logoUrl}
              alt={selectedHotel.name}
              className="tg-hotel-cover"
            />
          )}
          <div className="tg-hotel-content">
            <h2>{selectedHotel.name}</h2>
            {selectedHotel.starRating && (
              <Rate disabled defaultValue={selectedHotel.starRating} />
            )}

            <div className="tg-hotel-meta">
              <p>
                <EnvironmentOutlined /> {selectedHotel.address}
              </p>
              {selectedHotel.phone && (
                <p>
                  <PhoneOutlined /> {selectedHotel.phone}
                </p>
              )}
            </div>

            {selectedHotel.startingPrice && (
              <div className="tg-price-badge">
                From{" "}
                <strong>
                  {selectedHotel.currency}{" "}
                  {selectedHotel.startingPrice.toLocaleString()}
                </strong>
                /night
              </div>
            )}

            <Button type="primary" size="large" block onClick={handleBookNow}>
              Book Now
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Date Selection */}
      {step === "dates" && (
        <div className="tg-dates-section">
          <div className="tg-section-header">
            <CalendarOutlined style={{ fontSize: 32 }} />
            <h2>Select Dates</h2>
            <p>When would you like to stay?</p>
          </div>

          <div className="tg-date-inputs">
            <div className="tg-date-field">
              <label>Check-in</label>
              <DatePicker
                value={checkIn}
                onChange={setCheckIn}
                format="DD MMM YYYY"
                size="large"
                style={{ width: "100%" }}
                disabledDate={(d) => d && d < dayjs().startOf("day")}
              />
            </div>
            <div className="tg-date-field">
              <label>Check-out</label>
              <DatePicker
                value={checkOut}
                onChange={setCheckOut}
                format="DD MMM YYYY"
                size="large"
                style={{ width: "100%" }}
                disabledDate={(d) => d && d <= (checkIn || dayjs())}
              />
            </div>
          </div>

          {nights > 0 && (
            <div className="tg-nights-info">
              🌙 {nights} night{nights > 1 ? "s" : ""}
            </div>
          )}

          <Button
            type="primary"
            size="large"
            block
            onClick={checkAvailability}
            disabled={!checkIn || !checkOut}
            loading={loading}
          >
            Check Availability
          </Button>
        </div>
      )}

      {/* Step 5: Room Selection */}
      {step === "rooms" && availability && (
        <div className="tg-rooms-section">
          <div className="tg-section-header">
            <h2>Select Room</h2>
            <p>
              {availability.nights} nights · {availability.checkIn} →{" "}
              {availability.checkOut}
            </p>
          </div>

          {availability.roomTypes.length === 0 ? (
            <Empty description="No rooms available for these dates" />
          ) : (
            availability.roomTypes.map((room) => (
              <Card
                key={room.id}
                className="tg-room-card"
                hoverable
                onClick={() => handleSelectRoom(room)}
              >
                <div className="tg-room-info">
                  <h3>{room.name}</h3>
                  <Tag color="green">{room.availableRooms} left</Tag>
                  <div className="tg-room-price">
                    {availability.branch.currency}{" "}
                    {Number(room.basePrice).toLocaleString()}/night
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Step 6: Guest Information */}
      {step === "guest" && (
        <div className="tg-guest-section">
          <div className="tg-section-header">
            <UserOutlined style={{ fontSize: 32 }} />
            <h2>Guest Details</h2>
          </div>

          <Form
            form={form}
            layout="vertical"
            initialValues={{
              firstName: user?.first_name || "",
              lastName: user?.last_name || "",
            }}
          >
            <Form.Item
              name="firstName"
              label="First Name"
              rules={[{ required: true }]}
            >
              <Input size="large" />
            </Form.Item>
            <Form.Item
              name="lastName"
              label="Last Name"
              rules={[{ required: true }]}
            >
              <Input size="large" />
            </Form.Item>
            <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
              <Input size="large" placeholder="+998 90 123 45 67" />
            </Form.Item>
            <Form.Item name="email" label="Email">
              <Input size="large" type="email" />
            </Form.Item>
            <Form.Item name="gender" label="Gender">
              <Select size="large" placeholder="Select gender">
                <Select.Option value="MALE">Male</Select.Option>
                <Select.Option value="FEMALE">Female</Select.Option>
              </Select>
            </Form.Item>
          </Form>

          <Button type="primary" size="large" block onClick={handleGuestSubmit}>
            Continue
          </Button>
        </div>
      )}

      {/* Step 7: Confirmation */}
      {step === "confirm" && selectedHotel && selectedRoom && (
        <div className="tg-confirm-section">
          <div className="tg-section-header">
            <h2>Confirm Booking</h2>
          </div>

          <Card className="tg-summary-card">
            <h3>{selectedHotel.name}</h3>
            <Divider />
            <p>
              <strong>Room:</strong> {selectedRoom.name}
            </p>
            <p>
              <strong>Check-in:</strong> {checkIn?.format("DD MMM YYYY")}
            </p>
            <p>
              <strong>Check-out:</strong> {checkOut?.format("DD MMM YYYY")}
            </p>
            <p>
              <strong>Nights:</strong> {nights}
            </p>
            <Divider />
            <div className="tg-total-price">
              <span>Total</span>
              <strong>
                {availability?.branch.currency} {totalPrice.toLocaleString()}
              </strong>
            </div>
          </Card>

          <Button
            type="primary"
            size="large"
            block
            onClick={handleConfirmBooking}
            loading={loading}
          >
            Confirm Booking
          </Button>
        </div>
      )}

      {/* Step 8: Success */}
      {step === "success" && bookingResult && (
        <div className="tg-success-section">
          <CheckCircleOutlined style={{ fontSize: 64, color: "#52c41a" }} />
          <h2>Booking Confirmed!</h2>
          <div className="tg-confirmation-code">
            {bookingResult.confirmationNumber}
          </div>
          <Card className="tg-summary-card">
            <p>
              <strong>Hotel:</strong> {bookingResult.hotel}
            </p>
            <p>
              <strong>Room:</strong> {bookingResult.room}
            </p>
            <p>
              <strong>Nights:</strong> {bookingResult.nights}
            </p>
            <p>
              <strong>Total:</strong> {bookingResult.currency}{" "}
              {bookingResult.totalAmount.toLocaleString()}
            </p>
          </Card>
          <p className="tg-success-note">Show this confirmation at the hotel</p>
        </div>
      )}
    </div>
  );
};

export default TelegramBookingPage;
