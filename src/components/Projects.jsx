// Projects.jsx
import React, { useRef, useEffect, useState } from 'react';
import '../styles/Projects.css'; // Ensure this file contains the carousel styles

const Projects = () => {
  const [projectList, setProjectList] = useState([]);
  const containerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // 1) Load JSON from public/Projects.json on mount
  useEffect(() => {
    fetch('/projects.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setProjectList(data.projects);
      })
      .catch((err) => {
        console.error('Failed to load Projects.json:', err);
      });
  }, []);

  // 2) After projectList is populated, or on resize, determine arrow visibility
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

  // 3) Scroll helpers
  const scrollNext = () => {
    const container = containerRef.current;
    if (container) {
      container.scrollBy({
        left: container.clientWidth,
        behavior: 'smooth',
      });
    }
  };
  const scrollPrev = () => {
    const container = containerRef.current;
    if (container) {
      container.scrollBy({
        left: -container.clientWidth,
        behavior: 'smooth',
      });
    }
  };

  // 4) Navigate to detail page (replace with React Router if needed)
  const goToDetail = (projectId) => {
    window.location.href = `/projects/${projectId}`;
  };

  // 5) Loading state
  if (projectList.length === 0) {
    return <p>Loading projects…</p>;
  }

  return (
    <div className="projects-wrapper">
        <h4  className="section-title">Projects</h4>
      {/* Left arrow */}
      {canScrollLeft && (
        <button className="carousel-arrow left-arrow" onClick={scrollPrev}>
          ‹
        </button>
      )}

      {/* Scrollable container */}
      <div className="carousel-container" ref={containerRef}>
        {projectList.map((proj) => (
          <div
            key={proj.id}
            className="carousel-card"
            onClick={() => goToDetail(proj.id)}
          >
            <img
              src={proj.image}
              alt={proj.title}
              className="carousel-thumbnail"
            />
            <h3 className="carousel-title">{proj.title}</h3>
            <p className="carousel-description">{proj.description}</p>
            <p className="carousel-cta">&#10132; See Details</p>
          </div>
        ))}
      </div>

      {/* Right arrow */}
      {canScrollRight && (
        <button className="carousel-arrow right-arrow" onClick={scrollNext}>
          ›
        </button>
      )}
    </div>
  );
};

export default Projects;
