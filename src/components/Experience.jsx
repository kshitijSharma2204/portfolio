import '../styles/Experience.css';
import React, { useState, useEffect, useRef } from 'react';

const Experience = () => {
    const [experienceData, setExperienceData] = useState([]);
    const [activeIndex, setActiveIndex] = useState(null);
    const timelineRef = useRef(null);

      useEffect(() => {
    fetch('/experience.json')
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

    useEffect(() => {
    if (experienceData.length === 0) return;

    const options = {
      root: null,            // viewport
      rootMargin: '0px',
      threshold: 0.5,        // 50% visibility triggers
    };

    const observerCallback = (entries) => {
      const visibleEntries = entries.filter((e) => e.isIntersecting);
      if (visibleEntries.length === 0) return;

      visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      const mostVisible = visibleEntries[0];
      const newIndex = parseInt(mostVisible.target.dataset.index, 10);
      setActiveIndex(newIndex);
    };

    const observer = new IntersectionObserver(observerCallback, options);

    const items = timelineRef.current.querySelectorAll('.timeline-item');
    items.forEach((item) => observer.observe(item));

    return () => {
      items.forEach((item) => observer.unobserve(item));
      observer.disconnect();
    };
  }, [experienceData]);

  if (experienceData.length === 0) {
    return <p>Loading experience…</p>;
  }

  return (
    <div className="experience-section">
      <h2 className="section-title">Experience</h2>
      <div className="timeline" ref={timelineRef}>
        {experienceData.map((item, idx) => (
          <div
            key={idx}
            className={`timeline-item ${activeIndex === idx ? 'active' : ''}`}
            data-index={idx}
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