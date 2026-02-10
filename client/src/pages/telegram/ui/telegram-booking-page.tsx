import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { Input, Empty, Tag, Modal, Button, Skeleton } from "antd";
import {
  SearchOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  UnorderedListOutlined,
  StarFilled,
  CalendarOutlined,
  ExclamationCircleOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
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
import { BottomNav } from "../components/BottomNav";
import { publicBookingApi } from "@/shared/api/public-booking-api";
import type { GuestFormValues } from "../types";
import type { NearbyHotel } from "@/shared/api/public-booking-api";

export const TelegramBookingPage = () => {
  const [searchParams] = useSearchParams();
  const [guestInfo, setGuestInfo] = useState<GuestFormValues | null>(null);

  const {
    // State
    activeTab,
    step,
    loading,
    relocating,
    searchQuery,
    userLocation,
    hotels,
    trendingHotels,
    myBookings,
    selectedHotel,
    selectedBooking,
    checkIn,
    checkOut,
    availability,
    selectedRoom,
    bookingResult,
    nights,
    totalPrice,
    mapCenter,
    user,

    // Actions
    setActiveTab,
    handleSearch,
    setCheckIn,
    setCheckOut,
    loadHotelById,
    selectHotel,
    selectBooking,
    clearSelectedBooking,
    cancelBooking,
    goToDates,
    checkAvailability,
    selectRoom,
    submitGuestInfo,
    confirmBooking,
    relocate,
    haptic,
    loadMore,
    hasMore,
    loadingMore,
    totalHotels,
    closeApp,
    reset,
  } = useBookingFlow();

  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { threshold: 1.0 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasMore, loadingMore, loading]);

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

  const [activeCategory, setActiveCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const categories = ["All", "Nearby", "Trending", "Luxury", "Budget"];

  const openInMaps = (lat: number, lng: number) => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      "_blank",
    );
    haptic("light");
  };

  const showCancelConfirm = (bookingId: string) => {
    Modal.confirm({
      title: "Cancel Booking?",
      icon: <ExclamationCircleOutlined />,
      content:
        "Are you sure you want to cancel this reservation? This action cannot be undone.",
      okText: "Yes, Cancel",
      okType: "danger",
      cancelText: "No",
      onOk() {
        cancelBooking(bookingId);
      },
    });
  };

  const handleLogout = () => {
    haptic("medium");
    Modal.confirm({
      title: "Exit Application?",
      icon: <LogoutOutlined style={{ color: "var(--tg-primary)" }} />,
      content: "Are you sure you want to exit the Travel Portal?",
      okText: "Log Out",
      okType: "danger",
      cancelText: "Cancel",
      onOk() {
        haptic("light");
        reset();
        closeApp();
      },
      centered: true,
      className: "tg-modal",
    });
  };

  const renderExploreTab = () => {
    if (step === "map") {
      return (
        <div className="tg-discovery-container">
          {/* Sticky Premium Header */}
          <div className="tg-sticky-header">
            <div className="tg-header-top">
              <h2>Find Your Stay</h2>
              <div
                style={{
                  background: "var(--tg-secondary-bg)",
                  padding: "6px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <EnvironmentOutlined style={{ color: "var(--tg-primary)" }} />
                <span>Tashkent</span>
              </div>
            </div>

            <div className="tg-search-wrapper">
              <Input
                placeholder="Search hotel or city..."
                prefix={<SearchOutlined style={{ color: "var(--tg-hint)" }} />}
                className="tg-search-input"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
              />
            </div>

            <div className="tg-categories-scroll">
              {categories.map((cat) => (
                <div
                  key={cat}
                  className={`tg-category-chip ${activeCategory === cat ? "active" : ""}`}
                  onClick={() => {
                    setActiveCategory(cat);
                    haptic("light");
                  }}
                >
                  {cat}
                </div>
              ))}
            </div>
          </div>

          <div className="tg-feed-container">
            {/* Trending Section (Only if All/Trending and No Search) */}
            {(activeCategory === "All" || activeCategory === "Trending") &&
              trendingHotels.length > 0 &&
              !searchQuery && (
                <div
                  className="tg-trending-section"
                  style={{ padding: "0 0 24px" }}
                >
                  <div className="tg-section-header">
                    <h3>Trending</h3>
                  </div>
                  <div className="tg-trending-scroll">
                    {loading
                      ? [1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="tg-trending-card"
                            style={{ minWidth: 140 }}
                          >
                            <Skeleton.Button
                              active
                              style={{
                                width: 140,
                                height: 100,
                                borderRadius: 12,
                              }}
                            />
                            <div style={{ padding: 10 }}>
                              <Skeleton active paragraph={{ rows: 1 }} />
                            </div>
                          </div>
                        ))
                      : trendingHotels.map((hotel: NearbyHotel) => (
                          <div
                            key={hotel.id}
                            className="tg-trending-card"
                            onClick={() => selectHotel(hotel)}
                          >
                            <img
                              src={publicBookingApi.resolveImageUrl(
                                hotel.logoUrl,
                              )}
                              alt={hotel.name}
                              className="tg-trending-image"
                            />
                            <div
                              className="tg-trending-content"
                              style={{ padding: 10 }}
                            >
                              <h4
                                className="tg-trending-title"
                                style={{ fontSize: 13 }}
                              >
                                {hotel.name}
                              </h4>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  marginTop: 4,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: "var(--tg-hint)",
                                    fontWeight: 600,
                                  }}
                                >
                                  UZS{" "}
                                  {Number(hotel.startingPrice).toLocaleString()}
                                </span>
                                {hotel.starRating && (
                                  <span
                                    style={{ fontSize: 11, fontWeight: 700 }}
                                  >
                                    <StarFilled style={{ color: "#faad14" }} />{" "}
                                    {hotel.starRating}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                  </div>
                </div>
              )}

            {/* Main Feed Header */}
            <div className="tg-section-header">
              <h3>{viewMode === "map" ? "Global View" : "Nearby Hotels"}</h3>
              <span
                style={{
                  fontSize: 13,
                  color: "var(--tg-hint)",
                  fontWeight: 600,
                }}
              >
                {totalHotels} results
              </span>
            </div>

            {viewMode === "map" ? (
              <div
                className="tg-map-wrapper"
                style={{
                  height: "calc(100vh - 270px)",
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                <MapStep
                  mapCenter={mapCenter}
                  userLocation={userLocation}
                  hotels={hotels}
                  loading={loading}
                  relocating={relocating}
                  onSelectHotel={selectHotel}
                  onRelocate={relocate}
                />
              </div>
            ) : (
              <>
                <div className="tg-hotel-list" style={{ minHeight: "400px" }}>
                  {loading && hotels.length === 0
                    ? [1, 2, 3].map((i) => (
                        <div key={i} className="tg-hotel-card">
                          <Skeleton.Button
                            active
                            style={{
                              width: "100%",
                              height: 200,
                              borderRadius: 0,
                            }}
                          />
                          <div className="tg-hotel-details">
                            <Skeleton active paragraph={{ rows: 2 }} />
                          </div>
                        </div>
                      ))
                    : hotels.map((hotel: NearbyHotel) => (
                        <div
                          key={hotel.id}
                          className="tg-hotel-card"
                          onClick={() => selectHotel(hotel)}
                        >
                          <div className="tg-hotel-image-container">
                            <img
                              src={publicBookingApi.resolveImageUrl(
                                hotel.logoUrl,
                              )}
                              alt={hotel.name}
                              className="tg-hotel-image"
                            />
                            <div className="tg-hotel-badge">
                              {hotel.isFeatured ? "HOT" : "PROMO"}
                            </div>
                            <div className="tg-hotel-rating">
                              <StarFilled style={{ color: "#faad14" }} />
                              <span>{hotel.starRating || 4.5}</span>
                            </div>
                          </div>
                          <div className="tg-hotel-details">
                            <div className="tg-hotel-row">
                              <h4 className="tg-hotel-name">{hotel.name}</h4>
                              <div className="tg-hotel-price-tag">
                                <span className="tg-price-amount">
                                  {Number(hotel.startingPrice).toLocaleString()}
                                </span>
                                <span className="tg-price-unit">
                                  UZS / night
                                </span>
                              </div>
                            </div>
                            <div className="tg-hotel-meta">
                              <span>
                                <EnvironmentOutlined />{" "}
                                {hotel.address?.split(",")[0]}
                              </span>
                              <span>•</span>
                              <span>
                                {hotel.distance
                                  ? `${hotel.distance.toFixed(1)} km`
                                  : "< 1 km"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                </div>

                {/* Infinite Scroll Trigger */}
                <div
                  ref={observerTarget}
                  style={{
                    height: 80,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 10,
                  }}
                >
                  {loadingMore && (
                    <div className="tg-loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  )}
                  {!hasMore && hotels.length > 0 && (
                    <span
                      style={{
                        color: "var(--tg-hint)",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      ✨ You've seen everything
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Floating Toggle FAB */}
          <button
            className={`tg-view-toggle-fab ${viewMode === "map" ? "list" : "map"}`}
            onClick={() => {
              setViewMode((v) => (v === "list" ? "map" : "list"));
              haptic("medium");
            }}
          >
            {viewMode === "map" ? (
              <UnorderedListOutlined />
            ) : (
              <GlobalOutlined />
            )}
            <span>{viewMode === "map" ? "Show List" : "Show Map"}</span>
          </button>
        </div>
      );
    }

    if (step === "hotel" && selectedHotel) {
      return <HotelDetailStep hotel={selectedHotel} onBookNow={goToDates} />;
    }

    if (step === "dates") {
      return (
        <DatesStep
          checkIn={checkIn}
          checkOut={checkOut}
          loading={loading}
          onCheckInChange={setCheckIn}
          onCheckOutChange={setCheckOut}
          onCheckAvailability={checkAvailability}
        />
      );
    }

    if (step === "rooms") {
      return (
        <RoomsStep
          availability={availability}
          loading={loading}
          onSelectRoom={selectRoom}
        />
      );
    }

    if (step === "guest") {
      return (
        <GuestStep
          initialValues={{
            firstName: user?.first_name || "",
            lastName: user?.last_name || "",
            telegramUsername: user?.username || "",
          }}
          onSubmit={handleGuestSubmit}
        />
      );
    }

    if (
      step === "confirm" &&
      selectedHotel &&
      selectedRoom &&
      checkIn &&
      checkOut &&
      availability
    ) {
      return (
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
      );
    }

    if (step === "success" && bookingResult) {
      return <SuccessStep result={bookingResult} />;
    }

    return null;
  };

  const renderBookingsTab = () => {
    return (
      <div className="tg-step-content">
        <h2 className="tg-section-title">My Stays</h2>
        {myBookings.length === 0 ? (
          <Empty
            description="No reservations found"
            style={{ marginTop: 60 }}
          />
        ) : (
          <div className="tg-hotel-list" style={{ padding: 0 }}>
            {loading
              ? [1, 2].map((i) => (
                  <div key={i} className="tg-hotel-card">
                    <div className="tg-hotel-details" style={{ padding: 16 }}>
                      <Skeleton active paragraph={{ rows: 3 }} />
                    </div>
                  </div>
                ))
              : myBookings.map((b: any) => (
                  <div
                    key={b.id}
                    className="tg-hotel-card"
                    onClick={() => selectBooking(b)}
                  >
                    <div className="tg-hotel-details" style={{ padding: 16 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 12,
                        }}
                      >
                        <Tag color="blue" style={{ borderRadius: 6 }}>
                          {b.confirmationNumber}
                        </Tag>
                        <Tag
                          color={
                            b.status === "CONFIRMED"
                              ? "green"
                              : b.status === "CANCELLED"
                                ? "red"
                                : "default"
                          }
                          style={{ borderRadius: 6 }}
                        >
                          {b.status}
                        </Tag>
                      </div>
                      <h3 className="tg-hotel-name" style={{ fontSize: 18 }}>
                        {b.hotelName}
                      </h3>
                      <div className="tg-hotel-meta" style={{ marginTop: 8 }}>
                        <span>
                          <CalendarOutlined />{" "}
                          {dayjs(b.checkIn).format("MMM D")} -{" "}
                          {dayjs(b.checkOut).format("MMM D, YYYY")}
                        </span>
                      </div>
                      <div
                        style={{
                          marginTop: 16,
                          paddingTop: 16,
                          borderTop: "1px solid var(--tg-secondary-bg)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 500 }}>
                          {b.roomName} • {b.roomNumber}
                        </span>
                        <span
                          className="tg-price-amount"
                          style={{ fontSize: 16 }}
                        >
                          {b.currency} {Number(b.totalAmount).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        )}

        {/* Booking Details Modal */}
        <Modal
          open={!!selectedBooking}
          onCancel={clearSelectedBooking}
          footer={null}
          closeIcon={null}
          centered
          width="90%"
          styles={{
            body: { padding: 0 },
          }}
        >
          {selectedBooking && (
            <div style={{ padding: 24 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
                  Booking Details
                </h3>
                <Tag
                  color={
                    selectedBooking.status === "CONFIRMED"
                      ? "green"
                      : selectedBooking.status === "CANCELLED"
                        ? "red"
                        : "default"
                  }
                  style={{ borderRadius: 6, margin: 0 }}
                >
                  {selectedBooking.status}
                </Tag>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    color: "var(--tg-hint)",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  HOTEL
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, marginTop: 4 }}>
                  {selectedBooking.hotelName}
                </div>
                <div
                  style={{
                    color: "var(--tg-hint)",
                    fontSize: 13,
                    marginTop: 2,
                  }}
                >
                  {selectedBooking.address}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <div>
                  <div
                    style={{
                      color: "var(--tg-hint)",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    CHECK-IN
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>
                    {dayjs(selectedBooking.checkIn).format("MMM D, YYYY")}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      color: "var(--tg-hint)",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    CHECK-OUT
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>
                    {dayjs(selectedBooking.checkOut).format("MMM D, YYYY")}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    color: "var(--tg-hint)",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  ROOM
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>
                  {selectedBooking.roomName} • {selectedBooking.roomNumber}
                </div>
              </div>

              <div
                style={{
                  background: "var(--tg-secondary-bg)",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 32,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 600 }}>Total Paid</span>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "var(--tg-primary)",
                  }}
                >
                  {selectedBooking.currency}{" "}
                  {Number(selectedBooking.totalAmount).toLocaleString()}
                </span>
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {selectedBooking.latitude && selectedBooking.longitude && (
                  <Button
                    type="primary"
                    icon={<EnvironmentOutlined />}
                    size="large"
                    block
                    style={{ borderRadius: 10, height: 48, fontWeight: 700 }}
                    onClick={() =>
                      openInMaps(
                        selectedBooking.latitude,
                        selectedBooking.longitude,
                      )
                    }
                  >
                    Open in Maps
                  </Button>
                )}
                {selectedBooking.status === "CONFIRMED" && (
                  <Button
                    danger
                    size="large"
                    block
                    style={{ borderRadius: 10, height: 48, fontWeight: 700 }}
                    onClick={() => showCancelConfirm(selectedBooking.id)}
                    loading={loading}
                  >
                    Cancel Booking
                  </Button>
                )}
                <Button
                  size="large"
                  block
                  style={{ borderRadius: 10, height: 48, fontWeight: 700 }}
                  onClick={clearSelectedBooking}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  };

  const renderProfileTab = () => {
    return (
      <div className="tg-step-content">
        <h2 className="tg-section-title">Profile</h2>
        <div className="tg-hotel-card" style={{ padding: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, var(--tg-primary), #40a9ff)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 800,
                boxShadow: "0 4px 10px rgba(24, 144, 255, 0.3)",
              }}
            >
              {user?.first_name?.[0] || "U"}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
                {user?.first_name} {user?.last_name}
              </h3>
              <p
                style={{ margin: 4, color: "var(--tg-hint)", fontWeight: 600 }}
              >
                @{user?.username || "user"}
              </p>
            </div>
          </div>

          <div
            style={{
              background: "var(--tg-secondary-bg)",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 10,
                  color: "var(--tg-hint)",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  fontWeight: 700,
                }}
              >
                Telegram ID
              </label>
              <div style={{ fontWeight: 700, fontSize: 15, marginTop: 2 }}>
                {user?.id}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <label
                  style={{
                    fontSize: 10,
                    color: "var(--tg-hint)",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    fontWeight: 700,
                  }}
                >
                  Language
                </label>
                <div style={{ fontWeight: 700, fontSize: 15, marginTop: 2 }}>
                  {user?.language_code?.toUpperCase() || "EN"}
                </div>
              </div>
              <div>
                <label
                  style={{
                    fontSize: 10,
                    color: "var(--tg-hint)",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    fontWeight: 700,
                  }}
                >
                  Region
                </label>
                <div style={{ fontWeight: 700, fontSize: 15, marginTop: 2 }}>
                  Uzbekistan
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "0 16px", marginTop: 12 }}>
          <Button
            danger
            block
            size="large"
            icon={<LogoutOutlined />}
            style={{
              height: 54,
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 16,
              background: "rgba(255, 77, 79, 0.05)",
              border: "1px solid rgba(255, 77, 79, 0.2)",
            }}
            onClick={handleLogout}
          >
            Log Out
          </Button>
        </div>

        <p
          style={{
            textAlign: "center",
            color: "var(--tg-hint)",
            fontSize: 12,
            marginTop: 40,
            fontWeight: 600,
          }}
        >
          TRAVEL PORTAL v2.0.0 • Premium Edition
        </p>
      </div>
    );
  };

  return (
    <div className="tg-app">
      {activeTab === "explore" && renderExploreTab()}
      {activeTab === "bookings" && renderBookingsTab()}
      {activeTab === "profile" && renderProfileTab()}

      {(step === "map" || activeTab !== "explore") && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            haptic("light");
          }}
        />
      )}
    </div>
  );
};

export default TelegramBookingPage;
