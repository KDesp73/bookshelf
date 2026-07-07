"use client";

import "leaflet/dist/leaflet.css";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import type { StoreListItem } from "@/types/store";

interface StoreMapProps {
  stores: StoreListItem[];
}

const defaultIcon = L.divIcon({
  className: "",
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#b45309" stroke="#fff" stroke-width="1.5" width="28" height="36"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  tooltipAnchor: [0, -38],
});

export function StoreMap({ stores }: StoreMapProps) {
  const router = useRouter();
  const withCoords = stores.filter(
    (s) => s.storeLatitude != null && s.storeLongitude != null,
  );

  if (withCoords.length === 0) return null;

  const avgLat =
    withCoords.reduce((sum, s) => sum + s.storeLatitude!, 0) / withCoords.length;
  const avgLng =
    withCoords.reduce((sum, s) => sum + s.storeLongitude!, 0) / withCoords.length;

  return (
    <div className="h-[400px] w-full overflow-hidden rounded-xl border border-stone-200 dark:border-stone-700">
      <MapContainer
        center={[avgLat, avgLng]}
        zoom={6}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {withCoords.map((store) => (
          <Marker
            key={store._id}
            position={[store.storeLatitude!, store.storeLongitude!]}
            icon={defaultIcon}
            eventHandlers={{
              click: () => router.push(`/u/${store.username}`),
            }}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              <div className="text-sm font-medium text-amber-950">
                <p className="font-semibold">{store.storeName}</p>
                {store.storeCity ? (
                  <p className="text-xs text-stone-500">{store.storeCity}</p>
                ) : null}
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
