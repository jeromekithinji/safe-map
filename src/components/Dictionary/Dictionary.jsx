import React, { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import "./Dictionary.scss";

const Dictionary = () => {
  const [open, setOpen] = useState(true);

  return (
    <div
      className={`dictionary ${
        open ? "dictionary--open" : "dictionary--closed"
      }`}
    >
      <div className="dictionary__header" onClick={() => setOpen(!open)}>
        <h4 className="dictionary__title">Map Dictionary</h4>
        {open ? (
          <FaChevronUp className="dictionary__icon" />
        ) : (
          <FaChevronDown className="dictionary__icon" />
        )}
      </div>

      {open && (
        <div className="dictionary__content">
          {/* Contents Here */}
          <h5 className="dictionary__subtitle">Crime Hotspots</h5>
          <ul className="dictionary__list">
            <li>
              <span
                className="color-dot"
                style={{ backgroundColor: "#00FF00" }}
              ></span>{" "}
              Safe (&lt;200 crimes)
            </li>
            <li>
              <span
                className="color-dot"
                style={{ backgroundColor: "#FFFF00" }}
              ></span>{" "}
              Moderate (200-600 crimes)
            </li>
            <li>
              <span
                className="color-dot"
                style={{ backgroundColor: "#FF0000" }}
              ></span>{" "}
              High Risk (&gt;600 crimes)
            </li>
          </ul>

          <h5 className="dictionary__subtitle">Crime Types</h5>
          <ul className="dictionary__list">
            <li>
              <span
                className="color-dot"
                style={{ backgroundColor: "orange" }}
              ></span>{" "}
              Mischief
            </li>
            <li>
              <span
                className="color-dot"
                style={{ backgroundColor: "#6a94fc" }}
              ></span>{" "}
              Other Theft
            </li>
            <li>
              <span
                className="color-dot"
                style={{ backgroundColor: "yellow" }}
              ></span>{" "}
              Offence Against Person
            </li>
            <li>
              <span
                className="color-dot"
                style={{ backgroundColor: "purple" }}
              ></span>{" "}
              Homicide
            </li>
          </ul>

          <h5 className="dictionary__subtitle">Crime Definitions</h5>
          <ul className="dictionary__list">
            <li>
              <p>
                <strong>Homicide: </strong>
              </p>
              <p>
                A person causes the death of another person, directly or
                indirectly.
              </p>
            </li>
            <li>
              <p>
                <strong>Mischief: </strong>
              </p>
              <p>Willful destruction, damage, or defacement of property.</p>
            </li>
            <li>
              <p>
                <strong>Offence Against a Person: </strong>
              </p>
              <p>Attack causing harm, possibly with a weapon.</p>
            </li>
            <li>
              <p>
                <strong>Other Theft: </strong>
              </p>
              <p>Theft of purses, electronics, bicycles, etc.</p>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dictionary;
