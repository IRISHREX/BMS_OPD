import React from "react";
import "./ToggleSwitch.css";

const ToggleSwitch = ({ label, checked, onChange }) => {
  return (
    <>
      {/* <span className="label-text">{label}</span> */}
      <label className="toggle-switch">
       <span className="label-text">{label}</span>
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span className="slider round"></span>
      </label>
    </>
  );
};

export default ToggleSwitch;
