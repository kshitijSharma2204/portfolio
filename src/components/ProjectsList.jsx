import React, { useEffect, useState, useMemo } from 'react';
import '../styles/ProjectsList.css';

const ProjectsList = () => {
  // —— All hooks at the top ——
  const [projects, setProjects] = useState([]);
  const [openGroups, setOpenGroups] = useState({});

  const RAW_BASE =
    'https://raw.githubusercontent.com/kshitijSharma2204/portfolio/master/public';

  // fetch once on mount
  useEffect(() => {
    fetch(
      'https://raw.githubusercontent.com/kshitijsharma2204/portfolio/master/public/projects.json'
    )
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data) => setProjects(data.projects))
      .catch(console.error);
  }, []);

  const favoriteProjects = useMemo(
    () => projects.filter(p => p.favourite),
    [projects]
  );

  // Group your projects by `group`
  const grouped = useMemo(() => {
    return favoriteProjects.reduce((acc, proj) => {
      if (!acc[proj.group]) acc[proj.group] = [];
      acc[proj.group].push(proj);
      return acc;
    }, {});
  }, [favoriteProjects]);

    // On first time that we have groups, open all of them
    useEffect(() => {
      const allTrue = Object.keys(grouped).reduce((acc, name) => {
        acc[name] = true;
        return acc;
      }, {});
      setOpenGroups(allTrue);
    }, [grouped]);

  if (!projects.length) return <p>Loading projects…</p>;

  function toggleGroup(name) {
    setOpenGroups((g) => ({ ...g, [name]: !g[name] }));
  }
// Early return stays below all hooks


  return (
    <div>
      <div className="projects-header">
        <h4 className="section-title">Projects</h4>
      </div>
      <div className="projects-list">
        {Object.entries(grouped).map(([groupName, groupProjects]) => (
          <div key={groupName} className="group">
            <button
              className="group-header"
              onClick={() => toggleGroup(groupName)}
            >
              {groupName}
              <span className="chevron">
                {openGroups[groupName] ? '▾' : '▸'}
              </span>
            </button>

            {openGroups[groupName] && (
              <div className="group-body">
                <div className="projects-grid">
                  {groupProjects.map((proj) => (
                     <div key={proj.id} className="list-card">
                     <div className="list-image-col">
                       <img
                         src={`${RAW_BASE}${proj.image}`}
                         alt={proj.title}
                       />
                     </div>
                     <div className="list-content-col">
                       <h3>{proj.title}</h3>
                       <p>{proj.mainDescr}</p>
                       <div className="skills">
                         <h4>Skills:</h4>
                         <div className="skill-tags">
                           {proj.skills.map(skill => (
                             <span key={skill} className="skill-tag">
                               {skill}
                             </span>
                           ))}
                         </div>
                       </div>
                     </div>
                     <div className='list-button-col'>
                       <button
                         onClick={() =>
                           window.open(proj.link, '_blank')
                         }
                       >
                         ➔ Details
                       </button>
                       </div>
                   </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectsList;
