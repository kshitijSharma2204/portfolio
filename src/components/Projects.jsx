// Projects.jsx
import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Projects.css'; // Ensure this file contains the carousel styles

const Projects = () => {
  const [projectList, setProjectList] = useState([]);
  const containerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const navigate = useNavigate();

  const RAW_BASE = 
  'https://raw.githubusercontent.com/kshitijSharma2204/portfolio/master/public';

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/kshitijsharma2204/portfolio/master/public/projects.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const favs = data.projects.filter(p => p.favourite);
        setProjectList(favs);
      })
      .catch((err) => console.error('Failed to load Projects.json:', err));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScrollButtons = () => {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft + container.clientWidth < container.scrollWidth
      );
    };

    updateScrollButtons();
    container.addEventListener('scroll', updateScrollButtons);
    window.addEventListener('resize', updateScrollButtons);

    return () => {
      container.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [projectList]);

  const scrollNext = () => {
    const container = containerRef.current;
    if (container) container.scrollBy({ left: container.clientWidth, behavior: 'smooth' });
  };

  const scrollPrev = () => {
    const container = containerRef.current;
    if (container) container.scrollBy({ left: -container.clientWidth, behavior: 'smooth' });
  };

  if (projectList.length === 0) return <p>Loading projects…</p>;

  return (
    <div className="projects-wrapper">
      <div className="projects-header">
        <h4 className="section-title">Projects</h4>
        <button className="see-all-btn" onClick={() => navigate('/projects/all')}>All Projects ➔ </button>
      </div>
      {canScrollLeft && (
        <button className="carousel-arrow left-arrow" onClick={scrollPrev}>‹</button>
      )}
      <div className="carousel-container" ref={containerRef}>
        {projectList.map((proj) => (
          <div key={proj.id} className="carousel-card" onClick={() => window.open(proj.link, '_blank')}>
            <img  src={`${RAW_BASE}${proj.image}`} alt={proj.title} className="carousel-thumbnail" />
            <h3 className="carousel-title">{proj.title}</h3>
            <p className="carousel-description">{proj.mainDescr}</p>
            <p className="carousel-cta">➔ Details</p>
          </div>
        ))}
      </div>
      {canScrollRight && (
        <button className="carousel-arrow right-arrow" onClick={scrollNext}>›</button>
      )}
    </div>
  );
};

export default Projects;
