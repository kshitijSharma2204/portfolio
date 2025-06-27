import '../styles/Experience.css';
import React, { useState, useEffect, useRef } from 'react';

const Experience = () => {
  const [experienceData, setExperienceData] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/experience.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setExperienceData(data.experienceData);
      })
      .catch((err) => {
        console.error('Failed to load experience.json:', err);
      });
  }, []);

  if (experienceData.length === 0) {
    return <p>Loading experience…</p>;
  }

  return (
    <div className="experience-section">
      <h2 className="section-title">Experience</h2>
      <div className="timeline">
        {experienceData.map((item, idx) => (
          <div
            key={idx}
            className={`timeline-item ${activeIndex === idx ? 'active' : ''}`}
            onMouseEnter={() => setActiveIndex(idx)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <div className="timeline-dot" />
            <div className="timeline-content">
              <span className="timeline-date">{item.date}</span>
              <h3 className="timeline-role">{item.role}</h3>
              <h4 className="timeline-company">{item.company}</h4>
              <ul className="timeline-desc">
                {item.description.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Experience;
