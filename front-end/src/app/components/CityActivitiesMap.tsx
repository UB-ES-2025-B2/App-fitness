"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";

const completedIcon = L.divIcon({
  className: "activity-marker completed-marker",
  html: "✅",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

const pendingIcon = L.divIcon({
  className: "activity-marker pending-marker",
  html: "📍",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});



type CityActivityForMap = {
  id: number;
  name: string;
  description?: string | null;
  lat?: number | null;
  lng?: number | null;
  completed: boolean;
  distance_km?: number | null;
  difficulty?: string | null;
  type?: string | null;
};

type Props = {
  activities: CityActivityForMap[];
};

function getActivityIcon(act: CityActivityForMap) {
  // Emoji según tipo
  let emoji = "📍";
  const type = act.type?.toLowerCase() ?? "";

  if (type.includes("mont")) emoji = "🏔️";
  else if (type.includes("fút") || type.includes("fut")) emoji = "⚽";
  else if (type.includes("bás") || type.includes("bas")) emoji = "🏀";

  // Si está completada → marcamos con un borde verde o un check
  const completed = act.completed;

  return L.divIcon({
    className: completed ? "map-marker completed" : "map-marker",
    html: `
      <div class="emoji-wrapper">
        <span class="emoji">${emoji}</span>
        ${completed ? "<span class='check'>✔️</span>" : ""}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
}


export default function CityActivitiesMap({ activities }: Props) {
  // Solo actividades con coordenadas
 function hasCoordinates(
    a: CityActivityForMap
  ): a is CityActivityForMap & { lat: number; lng: number } {
    return typeof a.lat === "number" && typeof a.lng === "number";
  }

  const points = activities.filter(hasCoordinates);


  if (points.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-900/70 border border-slate-700/80 p-4 text-xs text-slate-300">
        Aún no hay actividades con ubicación asignada en el mapa.
      </div>
    );
  }

  

  const center: LatLngExpression = useMemo(() => {
    // Tomamos el primer punto como centro
    return [points[0].lat, points[0].lng] as LatLngExpression;
  }, [points]);

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900/70 shadow-md">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/70">
        <div className="flex items-center gap-2">
          <span className="text-lg">📍</span>
          <h2 className="text-sm font-semibold text-slate-100">
            Actividades en el mapa
          </h2>
        </div>
        <p className="text-[11px] text-slate-400">
          {points.length} con ubicación
        </p>
      </div>

      <div className="h-72">
        <MapContainer
          center={center}
          zoom={12}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {points.map((act) => (
            <Marker key={act.id} position={[act.lat, act.lng]} icon={getActivityIcon(act)}>
              <Popup>
                <div className="text-xs">
                  <p className="font-semibold mb-1">{act.name}</p>
                  {act.description && (
                    <p className="mb-1 text-[11px] text-slate-700">
                      {act.description}
                    </p>
                  )}
                  <p className="text-[11px]">
                    {act.distance_km != null
                      ? `${act.distance_km.toFixed(1)} km`
                      : "Distancia variable"}
                    {act.difficulty ? ` · ${act.difficulty}` : ""}
                  </p>
                  <p className="mt-1 text-[11px]">
                    Estado:{" "}
                    <span
                      className={
                        act.completed ? "text-emerald-600" : "text-amber-600"
                      }
                    >
                      {act.completed ? "Completada" : "Pendiente"}
                    </span>
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
