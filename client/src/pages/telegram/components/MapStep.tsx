import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { Button, Card, Tag, Spin } from "antd";
import L from "leaflet";
import type { NearbyHotel } from "@/shared/api/public-booking-api";
import { useEffect } from "react";

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
    click: (e) => onLocationSelect(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

// User location marker icon
const userMarkerIcon = L.divIcon({
  className: "user-marker",
  html: '<div style="background:#1677ff;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Hotel marker icon
const createHotelMarkerIcon = (hotel: NearbyHotel) =>
  L.divIcon({
    className: "hotel-marker",
    html: `<div style="background:${hotel.isFeatured ? "#faad14" : "#52c41a"};color:white;padding:4px 8px;border-radius:12px;font-size:12px;font-weight:bold;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${hotel.currency || ""} ${hotel.startingPrice?.toLocaleString() || "?"}</div>`,
    iconSize: [80, 24],
    iconAnchor: [40, 12],
  });

export function MapStep({
  mapCenter,
  userLocation,
  hotels,
  loading,
  relocating,
  onMapClick,
  onSelectHotel,
  onRelocate,
}: MapStepProps) {
  if (loading && hotels.length === 0) {
    return (
      <div className="tg-loading">
        <Spin size="large" />
        <p>Finding hotels near you...</p>
      </div>
    );
  }

  return (
    <div className="tg-map-container">
      <div className="tg-map-header">
        <div className="tg-map-header-row">
          <div>
            <h2>🏨 Find Hotels Near You</h2>
            <p>
              {hotels.length > 0
                ? `${hotels.length} hotels found`
                : "Tap on the map to search"}
            </p>
          </div>
          <Button
            type="primary"
            size="small"
            loading={relocating}
            onClick={onRelocate}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.5)",
            }}
          >
            📍 My Location
          </Button>
        </div>
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
          <MapClickHandler onLocationSelect={onMapClick} />

          {/* User location marker */}
          {userLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userMarkerIcon}
            >
              <Popup>📍 You are here</Popup>
            </Marker>
          )}

          {/* Hotel markers */}
          {hotels.map(
            (hotel) =>
              hotel.latitude &&
              hotel.longitude && (
                <Marker
                  key={hotel.id}
                  position={[hotel.latitude, hotel.longitude]}
                  icon={createHotelMarkerIcon(hotel)}
                >
                  <Popup>
                    <div style={{ minWidth: 150 }}>
                      <strong>{hotel.name}</strong>
                      {hotel.starRating && (
                        <div>{"⭐".repeat(hotel.starRating)}</div>
                      )}
                      <p
                        style={{ margin: "4px 0", fontSize: 12, color: "#666" }}
                      >
                        {hotel.address}
                      </p>
                      {hotel.startingPrice && (
                        <p
                          style={{
                            margin: "4px 0",
                            color: "#1677ff",
                            fontWeight: 500,
                          }}
                        >
                          From {hotel.currency}{" "}
                          {hotel.startingPrice.toLocaleString()}/night
                        </p>
                      )}
                      <Button
                        type="primary"
                        size="small"
                        block
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectHotel(hotel);
                        }}
                        style={{ marginTop: 8 }}
                      >
                        Book Now
                      </Button>
                    </div>
                  </Popup>
                </Marker>
              ),
          )}
        </MapContainer>
      </div>

      {/* Hotels list below map */}
      {hotels.length > 0 && (
        <div className="tg-map-hotels">
          <p className="tg-map-hotels-hint">
            👇 Scroll to see all hotels or tap on map
          </p>
          {hotels.slice(0, 5).map((hotel) => (
            <Card
              key={hotel.id}
              className="tg-map-hotel-card"
              size="small"
              hoverable
              onClick={() => onSelectHotel(hotel)}
            >
              <div className="tg-map-hotel-info">
                <div>
                  <strong>{hotel.name}</strong>
                  {hotel.isFeatured && (
                    <Tag color="gold" style={{ marginLeft: 4 }}>
                      Featured
                    </Tag>
                  )}
                  <p style={{ margin: 0, fontSize: 12, color: "#666" }}>
                    📍 {hotel.distance.toFixed(1)} km away
                  </p>
                </div>
                {hotel.startingPrice && (
                  <div className="tg-map-hotel-price">
                    {hotel.currency} {hotel.startingPrice.toLocaleString()}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
