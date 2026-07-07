"use client";

import { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const pinIcon = L.divIcon({
  className: "",
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#b45309" stroke="#fff" stroke-width="1.5" width="28" height="36"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
  iconSize: [28, 36],
  iconAnchor: [14, 36],
});

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  onChange: (lat: number, lng: number) => void;
}

function ClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const [lat, setLat] = useState(latitude);
  const [lng, setLng] = useState(longitude);
  const [error, setError] = useState<string | null>(null);

  const handleMapClick = useCallback(
    (newLat: number, newLng: number) => {
      setLat(newLat);
      setLng(newLng);
      setError(null);
      onChange(newLat, newLng);
    },
    [onChange],
  );

  const handleInputChange = (field: "lat" | "lng", value: string) => {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return;
    if (field === "lat") {
      setLat(parsed);
      onChange(parsed, lng ?? 0);
    } else {
      setLng(parsed);
      onChange(lat ?? 0, parsed);
    }
    setError(null);
  };

  const center: [number, number] =
    lat != null && lng != null ? [lat, lng] : [48.8566, 2.3522];

  return (
    <div className="space-y-3">
      <Label>Location (optional)</Label>
      <p className="text-xs text-stone-500">
        Click on the map or enter coordinates to place your store pin.
      </p>

      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="storeLatitude">Latitude</Label>
          <Input
            id="storeLatitude"
            name="storeLatitude"
            type="number"
            step="any"
            placeholder="48.8566"
            value={lat ?? ""}
            onChange={(e) => handleInputChange("lat", e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="storeLongitude">Longitude</Label>
          <Input
            id="storeLongitude"
            name="storeLongitude"
            type="number"
            step="any"
            placeholder="2.3522"
            value={lng ?? ""}
            onChange={(e) => handleInputChange("lng", e.target.value)}
          />
        </div>
      </div>

      <div className="h-[250px] w-full overflow-hidden rounded-lg border border-stone-200 dark:border-stone-700">
        <MapContainer
          center={center}
          zoom={lat != null && lng != null ? 10 : 3}
          className="h-full w-full"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onClick={handleMapClick} />
          {lat != null && lng != null ? (
            <Marker
              position={[lat, lng]}
              icon={pinIcon}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const pos = e.target.getLatLng();
                  handleMapClick(pos.lat, pos.lng);
                },
              }}
            />
          ) : null}
        </MapContainer>
      </div>
    </div>
  );
}
