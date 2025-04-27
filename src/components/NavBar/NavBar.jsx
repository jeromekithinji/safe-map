import React from "react";
import "./NavBar.scss";

const NavBar = () => {
  return (
    <div className="navbar">
      <div className="navbar__content">
        <div className="navbar__content-texts">
          <p className="navbar__content-title">SafeMap</p>
          <p className="navbar__content-subtitle">
            Explore crime hotspots and safety insights across the city.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NavBar;
