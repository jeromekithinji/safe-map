import React, { useEffect, useState } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { toLatLon } from "utm";
import "./MapComponent.scss";
import { FaLocationArrow } from "react-icons/fa"; // FontAwesome location arrow

const MapComponent = () => {
  const [points, setPoints] = useState([]);
  const [destination, setDestination] = useState(""); // ⬅️ Destination typed by user
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [startLocation, setStartLocation] = useState(""); // New for Start
  const [useCurrentLocation, setUseCurrentLocation] = useState(false); // Checkbox toggle

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["visualization", "places"],
  });

  const requestDirections = (origin, destination) => {
    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirectionsResponse(result);
        } else {
          console.error(`error fetching directions ${result}`);
          alert("Could not find directions. Please check addresses!");
        }
      }
    );
  };

  const handleDestinationChange = (e) => {
    setDestination(e.target.value);
  };

  const handleGetDirections = async () => {
    if (!destination) return;

    let origin = startLocation; // Default: whatever the user typed

    if (useCurrentLocation) {
      // Get user's real-time geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            origin = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            // After getting location, actually request directions
            requestDirections(origin, destination);
          },
          (error) => {
            console.error("Error getting location:", error);
            alert("Failed to get your current location.");
          }
        );
      } else {
        alert("Geolocation is not supported by your browser.");
      }
    } else {
      // No need to fetch GPS, use typed address
      requestDirections(origin, destination);
    }
  };

  useEffect(() => {
    const fetchCrimes = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/crimes");
        const data = await response.json();
        console.log("Fetched crime data:", data);

        const convertedPoints = data.map((crime) => {
          const { latitude, longitude } = toLatLon(
            parseFloat(crime.X),
            parseFloat(crime.Y),
            10, // UTM Zone 10
            "N" // Northern Hemisphere
          );

          return {
            lat: latitude,
            lng: longitude,
            type: crime.TYPE,
            neighbourhood: crime.NEIGHBOURHOOD,
            date: `${crime.YEAR}-${crime.MONTH}-${crime.DAY}`, // ✅ backticks here
          };
        });

        setPoints(convertedPoints);
      } catch (error) {
        console.error("Error fetching crime data:", error);
      }
    };

    fetchCrimes();
  }, []);

  if (!isLoaded) return <div>Loading Map...</div>;

  const center = {
    lat: 49.2827,
    lng: -123.1207,
  };

  const getMarkerColor = (type) => {
    if (type === "Mischief") return "orange";
    if (type === "Other Theft") return "green";
    if (type === "Offence Against a Person") return "yellow";
    if (type === "Homicide") return "purple";
    return "pink";
  };

  return (
    <div className="map-wrapper">
      {/* Input box */}
      <div className="map-controls">
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
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const userLocation = {
                      lat: position.coords.latitude,
                      lng: position.coords.longitude,
                    };
                    setUseCurrentLocation(true);
                    setStartLocation("Current Location");
                    console.log("Current location set:", userLocation);
                  },
                  (error) => {
                    console.error("Error fetching location:", error);
                    alert("Failed to get your current location.");
                  }
                );
              } else {
                alert("Geolocation is not supported by your browser.");
              }
            }}
          >
            Use my current location
          </p>
        </div>

        <input
          type="text"
          value={destination}
          onChange={handleDestinationChange}
          placeholder="Enter destination..."
          className="map-input"
        />
        <button onClick={handleGetDirections} className="map-button">
          Get Directions
        </button>
      </div>

      {/* Map */}
      <GoogleMap
        mapContainerClassName="map-container"
        center={center}
        zoom={13}
        options={{
          draggable: true,
          zoomControl: true,
          scrollwheel: true,
          disableDoubleClickZoom: false,
          streetViewControl: true,
          fullscreenControl: false,
          mapTypeControl: true,
        }}
      >
        {/* Crime Markers */}
        {points.map((crime, idx) => (
          <Marker
            key={idx}
            position={{ lat: crime.lat, lng: crime.lng }}
            icon={{
              url: `http://maps.google.com/mapfiles/ms/icons/${getMarkerColor(
                crime.type
              )}-dot.png`,
            }}
            title={`${crime.type} at ${crime.neighbourhood}`}
          />
        ))}

        {/* Directions */}
        {directionsResponse && (
          <DirectionsRenderer directions={directionsResponse} />
        )}
      </GoogleMap>
    </div>
  );
};

export default MapComponent;
