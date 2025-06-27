import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ProjectsList.css';

const ProjectsList = () => {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  const RAW_BASE = 
  'https://raw.githubusercontent.com/kshitijSharma2204/portfolio/master/public';

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/kshitijsharma2204/portfolio/master/public/projects.json')
      .then((res) => { if (!res.ok) throw new Error(res.statusText); return res.json(); })
      .then((data) => setProjects(data.projects))
      .catch(console.error);
  }, []);

  if (!projects.length) return <p>Loading projects…</p>;

  return (
    <div className="projects-list">
         <button onClick={() => navigate(-1)}>← Back</button>
         <h1>Projects</h1>
      {projects.map((proj) => (
        <div key={proj.id} className="list-card">
          <div className="list-image-col">
            <img   src={`${RAW_BASE}${proj.image}`} 
             alt={proj.title} />
          </div>
          <div className="list-content-col">
            <h3>{proj.title}</h3>
            <p>{proj.description}</p>
            <button
             onClick={() => window.open(proj.link, '_blank')}
             style={{ cursor: 'pointer' }}>
             ➔ Details
           </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectsList;