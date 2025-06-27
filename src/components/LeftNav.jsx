import React from 'react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { HashLink } from 'react-router-hash-link';
import '../styles/Leftnav.css';

const LeftNavigation = ({
  isProjects = true,
  isSkills = true,
  isExperience = true,
  isBio = true,
}) => {
  const linkStyle = {
    display: 'block',
    margin: '0.75rem 0',
    padding: '0.25rem 0.5rem',
    cursor: 'pointer',
    borderRadius: '4px',
    textDecoration: 'none',
    color: '#fff',
    fontWeight: '500',
  };

  const hoverStyle = {
    backgroundColor: '#f0f0f0',
    color: '#000',
  };

  const applyHoverHandlers = (e) => {
    e.currentTarget.style.backgroundColor = hoverStyle.backgroundColor;
    e.currentTarget.style.color = hoverStyle.color;
  };

  const clearHoverHandlers = (e) => {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.color = linkStyle.color;
  };

  return (
    <div className="nav-items">
      {/* Avatar + Profile Data */}
      <div className="avatar-container">
        <img
          className="avatar"
          src={`${process.env.PUBLIC_URL}/avatar.jpg`}
          alt="Kshitij Sharma"
        />
      </div>

      <div className="profile-data">
        <h4 className="profile-name">Kshitij Sharma</h4>
        <span className="profile-role">Robotics Software Developer</span>
        <span className="profile-edu">
          Mechatronics, Robotics, and Automation Engineering
          <br />@ Worcester Polytechnic Institute
        </span>
        <hr className="divider" />

        <nav className="nav-links">
          {isProjects && (
            <HashLink
              smooth
              to="/#projects"
              style={linkStyle}
              onMouseOver={applyHoverHandlers}
              onMouseOut={clearHoverHandlers}
            >
              Projects
            </HashLink>
          )}

          {isSkills && (
            <HashLink
              smooth
              to="/#skills"
              style={linkStyle}
              onMouseOver={applyHoverHandlers}
              onMouseOut={clearHoverHandlers}
            >
              Skills
            </HashLink>
          )}

          {isExperience && (
            <HashLink
              smooth
              to="/#experience"
              style={linkStyle}
              onMouseOver={applyHoverHandlers}
              onMouseOut={clearHoverHandlers}
            >
              Experience
            </HashLink>
          )}

          {isBio && (
            <div
              style={linkStyle}
              onMouseOver={(e) => {
                e.currentTarget.style.color = hoverStyle.color;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = linkStyle.color;
              }}
            >
              <a href="/resume.pdf" download className="resume-button">
                Download Resume
              </a>
            </div>
          )}
        </nav>
      </div>

      {/* Footer Links: GitHub, LinkedIn, etc. */}
      <div className="footer-links">
        <a
          href="https://github.com/kshitijSharma2204"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-icon"
        >
          <FaGithub size={24} />
        </a>
        <a
          href="https://www.linkedin.com/in/kshitijsharma1992/"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-icon"
        >
          <FaLinkedin size={24} />
        </a>
      </div>
    </div>
  );
};

export default LeftNavigation;
