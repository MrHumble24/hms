import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { Button, Spin } from "antd";
import L from "leaflet";
import type { NearbyHotel } from "@/shared/api/public-booking-api";
import { useEffect } from "react";
import { AimOutlined } from "@ant-design/icons";

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

interface MapStepProps {
  mapCenter: [number, number];
  userLocation: { lat: number; lng: number } | null;
  hotels: NearbyHotel[];
  loading: boolean;
  relocating: boolean;
  onSelectHotel: (hotel: NearbyHotel) => void;
  onRelocate: () => void;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

const userMarkerIcon = L.divIcon({
  className: "user-marker",
  html: '<div style="background:#2481cc;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 0 4px rgba(36,129,204,0.2)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export function MapStep({
  mapCenter,
  userLocation,
  hotels,
  loading,
  relocating,
  onSelectHotel,
  onRelocate,
}: MapStepProps) {
  const createHotelMarker = (hotel: NearbyHotel) => {
    const priceText = Number(hotel.startingPrice).toLocaleString();
    return L.divIcon({
      className: "hotel-marker-label",
      html: `<div class="tg-map-price-tag">UZS ${priceText}</div>`,
      iconSize: [80, 24],
      iconAnchor: [40, 12],
    });
  };

  if (loading && hotels.length === 0) {
    return (
      <div
        className="tg-loading"
        style={{
          height: "300px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" />
        <p style={{ marginTop: 12, color: "var(--tg-hint)" }}>Loading map...</p>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        dragging={true}
        trackResize={true}
        touchZoom={true}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapUpdater center={mapCenter} />

        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userMarkerIcon}
          />
        )}

        {hotels.map((hotel) => (
          <Marker
            key={hotel.id}
            position={[
              Number(hotel.latitude || 0),
              Number(hotel.longitude || 0),
            ]}
            icon={createHotelMarker(hotel)}
            eventHandlers={{
              click: () => onSelectHotel(hotel),
            }}
          />
        ))}
      </MapContainer>

      <Button
        className="tg-relocate-fab"
        icon={<AimOutlined />}
        loading={relocating}
        onClick={onRelocate}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 1000,
          width: 44,
          height: 44,
          borderRadius: "50%",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          border: "none",
        }}
      />
    </div>
  );
}
