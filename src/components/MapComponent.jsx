import React, { useEffect, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { toLatLon } from 'utm';  // Correct import

const MapComponent = () => {
  const [points, setPoints] = useState([]);
  
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["visualization"],
  });

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
    if (type === "Theft") return "green";
    return "blue";
  };

  return (
    <div>
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={13}>
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
      </GoogleMap>
    </div>
  );
};

export default MapComponent;
