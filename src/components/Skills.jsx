import React from 'react';
import '../styles/Skills.css'

const importAll = (r) => {
  return r.keys().map(r);
};

// This line tells Webpack: “Look in src/assets/skills for any file ending in .png, .jpg, or .svg”
const skillImages = importAll(
  require.context('../assets/skills', false, /\.(png|jpe?g|svg)$/)
);

const Skills = () => {
  return (
    <div className="skills-section">
      <h2 className="section-title">Skills</h2>
      <div className="skills-grid">
        {skillImages.map((src, idx) => {
          // src is the imported URL of the image
          // We can pull the “filename” from the module path if we want a label
          const parts = src.split('/'); // e.g. "/static/media/html.abc123.png"
          const filename = parts[parts.length - 1]; // "html.abc123.png"
          const skillName = filename.split('.')[0]; // "html" (before the first dot)

          return (
            <div key={idx} className="skill-card">
              <img
                src={src}
                alt={skillName}
                className="skill-image"
              />
              <span className="skill-label">{skillName.toUpperCase()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Skills;
