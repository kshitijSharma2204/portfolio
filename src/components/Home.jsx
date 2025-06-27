import React, { useRef } from 'react';
import LeftNavigation from './LeftNav';
import Bio from './Bio';
import Experience from './Experience';
import Projects from './Projects';
import Skills from './Skills';

const HomeComponent = () => {
  // Create refs for each section
  const bioRef = useRef(null);
  const projectsRef = useRef(null);
  const experienceRef = useRef(null);
  const skillsRef = useRef(null);
  const isProjects = true;
  const isSkills = true;
  const isExperience = true;
  const isBio = true;

  // Handler that scrolls to a given ref
  const scrollToSection = (sectionRef) => {
    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="home-container">
      <div className="left-nav">
      <div className="overlay"></div>
        <LeftNavigation
          onClickBio={() => scrollToSection(bioRef)}
          onClickProjects={() => scrollToSection(projectsRef)}
          onClickExperience={() => scrollToSection(experienceRef)}
          onClickSkills={() => scrollToSection(skillsRef)}
        />
      </div>

    
      <div className="right-content">
      {isBio && 
        <section id="bio" ref={bioRef}>
          <Bio />
        </section>
      }

        {isProjects && 
         <section id="projects" ref={projectsRef}>
         <Projects />
       </section>
        }
       
       {isSkills && 
          <section id="skills" ref={skillsRef}>
          <Skills />
        </section>
       }
  
        {isExperience && 
          <section id="experience" ref={experienceRef}>
            <Experience />
          </section>      
        }
      </div>
    </div>
  );
};

export default HomeComponent;
