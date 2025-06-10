import React from 'react';
import '../styles/Bio.css'; // optional, if you want to style the button

const Bio = () => {
  return (
    <div>
        <h4 className="section-title">About Me</h4>
      <span>
        Robotics software engineer with an M.S. in Robotics Engineering from WPI and over six years’ experience
        developing autonomous systems using C++ and ROS.
        <br />
        At Path Robotics, refactored legacy code for multi-arm welding cells; at Berkshire Grey, built Python
        automation tools improving warehouse throughput.
        <br />
        Skilled in motion planning, perception pipelines, and deploying scalable, reliable robotic solutions.
      </span>
    </div>
  );
};

export default Bio;
