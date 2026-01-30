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
  onMapClick: (lat: number, lng: number) => void;
  onSelectHotel: (hotel: NearbyHotel) => void;
  onRelocate: () => void;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
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
  if (loading && hotels.length === 0) {
    return (
      <div className="tg-loading">
        <Spin size="large" />
        <p>Looking for hotels...</p>
      </div>
    );
  }

  return (
    <div className="tg-discovery-container">
      <div className="tg-header">
        <h2>Nearby Hotels</h2>
        <p>
          {hotels.length > 0
            ? `Found ${hotels.length} places for you`
            : "Searching your area..."}
        </p>
      </div>

      <div className="tg-map-mini-wrapper">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          dragging={true}
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
        </MapContainer>
        <Button
          className="tg-relocate-fab"
          icon={<AimOutlined />}
          loading={relocating}
          onClick={onRelocate}
        />
      </div>

      <div className="tg-hotel-feed">
        {hotels.map((hotel) => (
          <div
            key={hotel.id}
            className="tg-hotel-item"
            onClick={() => onSelectHotel(hotel)}
          >
            {hotel.logoUrl && (
              <img
                src={hotel.logoUrl}
                alt={hotel.name}
                className="tg-hotel-item-image"
              />
            )}
            <div className="tg-hotel-item-content">
              <div className="tg-hotel-item-top">
                <h3 className="tg-hotel-item-title">{hotel.name}</h3>
                {hotel.startingPrice && (
                  <span className="tg-hotel-item-price">
                    {hotel.currency} {hotel.startingPrice.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="tg-hotel-item-sub">
                📍 {hotel.distance.toFixed(1)} km ·{" "}
                {hotel.address?.split(",")[0]}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
