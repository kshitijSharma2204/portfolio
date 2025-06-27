import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/ProjectDetail.css';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/projects.json`)
      .then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then(data => {
        const found = data.projects.find(p => p.id === id);
        setProject(found);
      })
      .catch(console.error);
  }, [id]);

  if (!project) return <p>Loading…</p>;

  return (
    <div className="project-detail">
      <button onClick={() => navigate(-1)}>← Back</button>
      <h2>{project.title}</h2>
      <br />
      <p>{project.longDescription || project.description}</p>

      <div className="gallery">
        {project.images?.map((imgUrl, idx) => (
          <img
            key={idx}
            src={`${process.env.PUBLIC_URL}${imgUrl}`} 
            alt={`${project.title} screenshot ${idx + 1}`}
            className="gallery-image"
          />
        ))}
      </div>
    </div>
  );
};

export default ProjectDetail;
