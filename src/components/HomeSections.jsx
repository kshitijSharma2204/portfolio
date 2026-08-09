import React from 'react';
import Bio from './Bio';
import Experience from './Experience';
import Skills from './Skills';
import ProjectsList from './ProjectsList';

const HomeSections = () => {
  return (
    <>
     <section id="bio"><Bio/></section>
    <section id="projects"><ProjectsList/></section>
    <section id="skills"><Skills/></section>
    <section id="experience"><Experience/></section>
    </>
  );
};

export default HomeSections;