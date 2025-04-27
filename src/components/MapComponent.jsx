import React, { useEffect, useState } from "react";
import Chatbot from "./Chatbot/Chatbot";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Circle,
  DirectionsRenderer,
  InfoWindow,
} from "@react-google-maps/api";
import { toLatLon } from "utm";
import "./MapComponent.scss";

const RADIUS = 700; // meters for neighborhood circles
const MAX_DIST_KM = 1.0; // threshold distance from route

// Haversine formula in km
function haversine(c1, c2) {
  const R = 6371,
    toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(c2.lat - c1.lat),
    dLon = toRad(c2.lng - c1.lng),
    a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(c1.lat)) *
        Math.cos(toRad(c2.lat)) *
        Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function summarizeCrime(lat, lng, radiusKm = 1) {
  // Filter crimes within radius
  const crimesInRadius = crimes.filter((c) => {
    if (!c.latitude || !c.longitude) return false;
    const dist = haversine(lat, lng, c.latitude, c.longitude);
    return dist <= radiusKm;
  });

  const total = crimesInRadius.length;
  if (total === 0) {
    return `In the past year within ${radiusKm} km of (${lat.toFixed(4)},${lng.toFixed(4)}), no crimes were reported.`;
  }

  // Count types
  const typeCounts = {};
  crimesInRadius.forEach((c) => {
    typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
  });

  // Sort types by count
  const sortedTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Build summary string
  const typeSummary = sortedTypes
    .map(([type, count]) => `${type} (${Math.round((count / total) * 100)}%)`)
    .join(" and ");

  return `In the past year within ${radiusKm} km of (${lat.toFixed(4)},${lng.toFixed(4)}), there have been ${total} crimes, most commonly ${typeSummary}.`;
}

export default function MapComponent() {

  const [points, setPoints] = useState([]);

  const [neighborhoods, setNeighborhoods] = useState([]);

  const [filteredPoints, setFilteredPoints] = useState([]);
  const [filteredNeighborhoods, setFilteredNeighborhoods] = useState([]);


  const [destination, setDestination] = useState("");
  const [startLocation, setStartLocation] = useState("");
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [directionsResponse, setDirectionsResponse] = useState(null);

  const [showCircles, setShowCircles] = useState(false);

  const [selectedCrime, setSelectedCrime] = useState(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["visualization", "places"],
  });

  const center = { lat: 49.2827, lng: -123.1207 };

  useEffect(() => {
    (async () => {
      const res = await fetch("http://localhost:5000/api/crimes");
      const data = await res.json();

      // Raw points
      const pts = data.map((c) => {
        const { latitude: lat, longitude: lng } = toLatLon(+c.X, +c.Y, 10, "N");
        return {
          lat,
          lng,
          type: c.TYPE,
          neighbourhood: c.NEIGHBOURHOOD,
          date: `${c.YEAR}-${c.MONTH}-${c.DAY}`,
          time: `${c.HOUR}:${c.MINUTE}`,
        };
      });
      setPoints(pts);
      setFilteredPoints(pts);

      const agg = {};
      pts.forEach((p) => {
        const nb = p.neighbourhood || "Unknown";
        if (!agg[nb]) agg[nb] = { count: 0, types: {}, points: [] };
        agg[nb].count++;
        agg[nb].points.push({ lat: p.lat, lng: p.lng });
        agg[nb].types[p.type] = (agg[nb].types[p.type] || 0) + 1;
      });

      const nbs = Object.entries(agg).map(
        ([name, { count, types, points }]) => ({
          name,
          crimeCount: count,
          crimeTypes: types,
          center: {
            lat: points.reduce((s, p) => s + p.lat, 0) / points.length,
            lng: points.reduce((s, p) => s + p.lng, 0) / points.length,
          },
        })
      );
      setNeighborhoods(nbs);
      setFilteredNeighborhoods(nbs);
    })();
  }, []);

  function findSafestRoute(routes, neighborhoods) {
    console.log("🔵 Checking safest route...");
  
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      const path = route.overview_path;
  
      const passesHighRisk = neighborhoods.some((hotspot) => {
        return (
          hotspot.crimeCount > 600 &&
          path.some(
            (pt) =>
              haversine({ lat: pt.lat(), lng: pt.lng() }, hotspot.center) <=
              RADIUS / 1000 // meters -> km
          )
        );
      });
  
      if (!passesHighRisk) {
        console.log(`✅ Route ${i + 1} is safe: ${route.summary || "Unnamed Route"}`);
        return route;
      } else {
        console.log(`⚠️ Route ${i + 1} passes through a high-risk hotspot.`);
      }
    }
  
    console.log("❌ No completely safe route found. Defaulting to the first route.");
    window.alert("⚠️ Warning: No completely safe route available. Proceed carefully!");
    return routes[0]; // fallback
  }
  
  // Helper to request directions & filter both lists
  const requestDirections = (origin, dest) => {
    const svc = new window.google.maps.DirectionsService();
    svc.route(
      { 
        origin, 
        destination: dest, 
        travelMode: "WALKING",
        provideRouteAlternatives: true,
      },
      (res, status) => {
        if (status === "OK") {
          setDirectionsResponse(res);
          // const path = res.routes[0].overview_path;

          const routes = res.routes; // all possible routes
          console.log("🔵 Alternative Routes:", routes);

          const scoredRoutes = routes.map(route => {
            const path = route.overview_path;
            const hotspotCount = neighborhoods.filter(hotspot =>
              hotspot.crimeCount > 600 &&
              path.some(pt => haversine({ lat: pt.lat(), lng: pt.lng() }, hotspot.center) <= (RADIUS/1000))
            ).length;
            
            return {
              route,
              hotspotCount,
              distanceMeters: route.legs[0].distance.value,
            };
          });
          
          // Prefer safer (less hotspot), but allow longer distance
          const bestRoute = scoredRoutes.sort((a, b) => {
            if (a.hotspotCount !== b.hotspotCount) {
              return a.hotspotCount - b.hotspotCount; // safer first
            }
            return a.distanceMeters - b.distanceMeters; // then shorter
          })[0].route;

          const safestRoute = findSafestRoute(routes, neighborhoods);

          // setDirectionsResponse({ routes: [safestRoute] }); // 👈 use ONLY the safest one
          const path = bestRoute.overview_path;

          const fp = points.filter((p) =>
            path.some(
              (pt) =>
                haversine(
                  { lat: p.lat, lng: p.lng },
                  { lat: pt.lat(), lng: pt.lng() }
                ) <= MAX_DIST_KM
            )
          );
          setFilteredPoints(fp);

          const fn = neighborhoods.filter((n) =>
            path.some(
              (pt) =>
                haversine(n.center, { lat: pt.lat(), lng: pt.lng() }) <=
                MAX_DIST_KM
            )
          );
          setFilteredNeighborhoods(fn);
        } else {
          console.error("Directions error:", status);
          alert("Could not find directions. Please check addresses!");
        }
      }
    );
  };

  const handleGetDirections = () => {
    if (!destination) return;
    let origin = startLocation;
    if (useCurrentLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          requestDirections(loc, destination);
        },
        () => alert("Failed to get your current location.")
      );
    } else {
      requestDirections(origin, destination);
    }
  };

  const getMarkerColor = (type) => {
    switch (type) {
      case "Mischief":
        return "orange";
      case "Other Theft":
        return "blue";
      case "Offence Against a Person":
        return "yellow";
      case "Homicide":
        return "purple";
      default:
        return "red";
    }
  };

  if (!isLoaded) return <div>Loading Map...</div>;

  // Decide which list to render
  const showList = showCircles ? filteredNeighborhoods : filteredPoints;

  return (
    <div className="map-wrapper">
      <div className="map-controls">
        {/* Start input */}
        <div className="map-controls__starting">
          <input
            type="text"
            value={startLocation}
            onChange={(e) => setStartLocation(e.target.value)}
            placeholder="Enter starting location..."
            className="map-controls__starting-input"
          />
          <p
            className="map-controls__starting-currentLoc"
            onClick={() => setUseCurrentLocation((u) => !u)}
          >
            {useCurrentLocation
              ? "Using ✓ Your Location"
              : "Use my current location"}
          </p>
        </div>

        {/* Destination */}
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Enter destination..."
          className="map-input"
        />
        <button onClick={handleGetDirections} className="map-button">
          Get Directions
        </button>
        {/* Toggle pins vs circles */}
        <label className="map-toggle">
          <input
            type="checkbox"
            checked={showCircles}
            onChange={() => setShowCircles((s) => !s)}
          />
          <span>Show Neighborhood Circles</span>
        </label>
      </div>

      <GoogleMap
        key={showCircles ? "circles" : "pins"} // <-- This forces a remount on toggle!
        mapContainerClassName="map-container"
        center={center}
        zoom={13}
        options={{
          draggable: true,
          zoomControl: true,
          scrollwheel: true,
          streetViewControl: true,
          fullscreenControl: false,
          mapTypeControl: true,
        }}
      >
        {showCircles
          ? showList.map((n) => (
              <Circle
                key={n.name} // Use a unique, stable key!
                center={n.center}
                radius={RADIUS}
                options={{
                  fillColor:
                    n.crimeCount < 200
                      ? "#00FF00"
                      : n.crimeCount < 600
                      ? "#FFFF00"
                      : "#FF0000",
                  fillOpacity: 0.35,
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                }}
                onClick={() => setSelectedNeighborhood(n)}
              />
            ))
          : showList.map((crime, idx) => (
              <Marker
                key={idx}
                position={{ lat: crime.lat, lng: crime.lng }}
                icon={{
                  url: `http://maps.google.com/mapfiles/ms/icons/${getMarkerColor(
                    crime.type
                  )}-dot.png`,
                }}
                onClick={() => setSelectedCrime(crime)}
              />
            ))}

        {selectedCrime && !showCircles && (
          <InfoWindow
            position={{ lat: selectedCrime.lat, lng: selectedCrime.lng }}
            onCloseClick={() => setSelectedCrime(null)}
          >
            <div className="map-infowindow">
              <h4 className="map-infowindow__crime">{selectedCrime.type}</h4>
              <p className="map-infowindow__info">
                <strong>Neighbourhood:</strong> {selectedCrime.neighbourhood}
              </p>
              <p className="map-infowindow__info">
                <strong>Date:</strong> {selectedCrime.date}
              </p>
              <p className="map-infowindow__info">
                <strong>Time:</strong> {selectedCrime.time}
              </p>
            </div>
          </InfoWindow>
        )}

        {selectedNeighborhood && showCircles && (
          <InfoWindow
            position={selectedNeighborhood.center}
            onCloseClick={() => setSelectedNeighborhood(null)}
          >
            <div className="info-window-content">
              <h3 className="neighborhood-name">{selectedNeighborhood.name}</h3>
              <p className="crime-total">
                Total Crimes: <strong>{selectedNeighborhood.crimeCount}</strong>
              </p>
              <h4 className="crime-type-title">Crime Types:</h4>
              <ul className="crime-list">
                {Object.entries(selectedNeighborhood.crimeTypes).map(
                  ([t, c], idx) => (
                    <li key={idx} className="crime-item">
                      <span className="crime-type">{t}:</span>{" "}
                      <span className="crime-count">{c}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          </InfoWindow>
        )}

        {directionsResponse && (
          <DirectionsRenderer directions={directionsResponse} />
        )}
      </GoogleMap>
      <Chatbot mapCenter={center} />
    </div>
  );
}
