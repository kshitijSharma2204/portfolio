import React, { useEffect, useState } from 'react';
import '../styles/Skills.css';

const Skills = () => {
  const [filenames, setFilenames] = useState([]);
  const RAW_BASE = 
  'https://raw.githubusercontent.com/kshitijSharma2204/portfolio/master/public';

  useEffect(() => {
    fetch(`${RAW_BASE}/assets/skills/skills-manifest.json`)
      .then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then(setFilenames)
      .catch(console.error);
  }, []);

  return (
    <div className="skills-section">
      <h2 className="section-title">Skills</h2>
      <div className="skills-grid">
        {filenames.map((name, idx) => {
          const skillName = name.replace(/\.(png|jpe?g|svg)$/, '');
          const src = `${RAW_BASE}/assets/skills/${name}`;
          return (
            <div key={idx} className="skill-card">
              <img src={src} alt={skillName} className="skill-image" />
              <span className="skill-label">
                {skillName.toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Skills;
