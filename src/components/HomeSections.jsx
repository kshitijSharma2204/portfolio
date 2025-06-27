import React, { useRef } from 'react';
import Bio from './Bio';
import Experience from './Experience';
import ProjectsCarousel from './Projects';
import Skills from './Skills';

const HomeSections = () => {
  const bioRef = useRef(null);
  const projectsRef = useRef(null);
  const experienceRef = useRef(null);
  const skillsRef = useRef(null);

  const scrollTo = (ref) => {
    if (ref.current) ref.current.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
     <section id="bio"><Bio/></section>
    <section id="projects"><ProjectsCarousel/></section>
    <section id="skills"><Skills/></section>
    <section id="experience"><Experience/></section>
    </>
  );
};

export default HomeSections;