import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = [18.5204, 73.8567];

const STATUS_COLORS = {
  reported: "#2563eb",
  "in-progress": "#d97706",
  resolved: "#059669",
  rejected: "#dc2626",
};

function MapClickHandler({ enabled, onSelect }) {
  useMapEvents({
    click(event) {
      if (enabled && onSelect) {
        onSelect({
          latitude: event.latlng.lat,
          longitude: event.latlng.lng,
        });
      }
    },
  });

  return null;
}

function MapCenter({ center }) {
  const map = useMap();

  useEffect(() => {
    if (center && Number.isFinite(center[0]) && Number.isFinite(center[1])) {
      map.setView([center[0], center[1]], Math.max(map.getZoom(), 14));
    }
  }, [map, center?.[0], center?.[1]]);

  return null;
}

export default function IssueMap({
  issues = [],
  selectionMode = false,
  selectedCoordinates = null,
  onSelectLocation,
  onViewIssue,
}) {
  const validIssues = issues.filter((issue) => {
    const coordinates = issue.location?.coordinates;

    return (
      Array.isArray(coordinates) &&
      coordinates.length === 2 &&
      coordinates.every((coordinate) => Number.isFinite(coordinate)) &&
      coordinates[0] >= -180 &&
      coordinates[0] <= 180 &&
      coordinates[1] >= -90 &&
      coordinates[1] <= 90
    );
  });

  const firstIssueCoordinates = validIssues[0]?.location?.coordinates;
  const center = selectedCoordinates
    ? [selectedCoordinates.latitude, selectedCoordinates.longitude]
    : firstIssueCoordinates
      ? [firstIssueCoordinates[1], firstIssueCoordinates[0]]
      : DEFAULT_CENTER;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
        <div>
          <h3 className="font-bold text-slate-900">
            {selectionMode ? "Select issue location" : "Civic issue map"}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {selectionMode
              ? "Click the map to select the location for this report."
              : `${validIssues.length} issue${validIssues.length === 1 ? "" : "s"} with coordinates`}
          </p>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom
        className="h-[340px] w-full sm:h-[440px]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapCenter center={center} />
        <MapClickHandler enabled={selectionMode} onSelect={onSelectLocation} />

        {validIssues.map((issue) => {
          const [longitude, latitude] = issue.location.coordinates;
          const color = STATUS_COLORS[issue.status] || "#64748b";

          return (
            <CircleMarker
              key={issue._id}
              center={[latitude, longitude]}
              radius={9}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.85,
                weight: 2,
              }}
            >
              <Popup>
                <div className="min-w-44 space-y-2">
                  <p className="font-bold">{issue.title}</p>
                  <p className="text-sm">{issue.category}</p>
                  <p className="text-sm">
                    Status: {(issue.status || "reported").replace("-", " ")}
                  </p>
                  <p className="text-sm">
                    {issue.location?.address || "Address unavailable"}
                  </p>
                  {onViewIssue && (
                    <button
                      type="button"
                      onClick={() => onViewIssue(issue._id)}
                      className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white"
                    >
                      View details
                    </button>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {selectedCoordinates && (
          <CircleMarker
            center={[
              selectedCoordinates.latitude,
              selectedCoordinates.longitude,
            ]}
            radius={10}
            pathOptions={{
              color: "#7c3aed",
              fillColor: "#8b5cf6",
              fillOpacity: 0.9,
              weight: 3,
            }}
          >
            <Popup>Selected report location</Popup>
          </CircleMarker>
        )}
      </MapContainer>

      <div className="flex flex-wrap gap-4 border-t border-slate-200 p-3 text-xs text-slate-600">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <span key={status} className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            {status.replace("-", " ")}
          </span>
        ))}
      </div>
    </div>
  );
}
