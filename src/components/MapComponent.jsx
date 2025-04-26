import React, { useEffect, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { toLatLon } from 'utm';  // Correct import

const MapComponent = () => {
  const [points, setPoints] = useState([]);
  const [destination, setDestination] = useState("");  // ⬅️ Destination typed by user
  const [directionsResponse, setDirectionsResponse] = useState(null);
  
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["visualization", "places"],
  });

  const handleDestinationChange = (e) => {
    setDestination(e.target.value);
  };

  const handleGetDirections = async () => {
    if (!destination) return;

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: center, // You can make this dynamic based on user location
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING, // or WALKING, BICYCLING, TRANSIT
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirectionsResponse(result);
        } else {
          console.error(`error fetching directions ${result}`);
        }
      }
    );
  };

  useEffect(() => {
    const fetchCrimes = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/crimes');
        const data = await response.json();
        console.log("Fetched crime data:", data);

        const convertedPoints = data.map((crime) => {
          const { latitude, longitude } = toLatLon(
            parseFloat(crime.X),
            parseFloat(crime.Y),
            10,  // UTM Zone 10
            'N'  // Northern Hemisphere
          );

          return {
            lat: latitude,
            lng: longitude,
            type: crime.TYPE,
            neighbourhood: crime.NEIGHBOURHOOD,
            date: `${crime.YEAR}-${crime.MONTH}-${crime.DAY}`,  // ✅ backticks here
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

  const containerStyle = {
    width: "100%",
    height: "400px",
  };

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
    <div style={{ position: "relative" }}>
      {/* Input box over the map */}
      <div style={{
        position: "absolute",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        backgroundColor: "white",
        padding: "10px 20px",
        borderRadius: "8px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
      }}>
        <input
          type="text"
          value={destination}
          onChange={handleDestinationChange}
          placeholder="Enter destination..."
          style={{ padding: "8px", width: "300px", marginRight: "10px" }}
        />
        <button onClick={handleGetDirections} style={{ padding: "8px 15px" }}>
          Get Directions
        </button>
      </div>

      {/* Map itself */}
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={13}>
        {/* Markers for crimes */}
        {points.map((crime, idx) => (
          <Marker
          key={idx}
          position={{ lat: crime.lat, lng: crime.lng }}
          icon={{
            url: `http://maps.google.com/mapfiles/ms/icons/${getMarkerColor(
              crime.type
            )}-dot.png`,  // ✅ backticks here
          }}
          title={`${crime.type} at ${crime.neighbourhood}`}  // ✅ backticks here
        />
        ))}

        {/* Render the route if directions are found */}
        {directionsResponse && (
          <DirectionsRenderer directions={directionsResponse} />
        )}
      </GoogleMap>
    </div>
  );
};

export default MapComponent;
