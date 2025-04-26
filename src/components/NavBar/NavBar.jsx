import React from "react";
import "./NavBar.scss";

const NavBar = () => {
  return (
    <div className="navbar">
      <div className="navbar__content">
        <h1 className="navbar__content-title">SafeMap</h1>
        <p className="navbar__content-subtitle">
          Explore crime hotspots and safety insights across the city.
        </p>
      </div>
    </div>
  );
};

export default NavBar;
