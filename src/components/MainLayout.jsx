import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import LeftNavigation from './LeftNav';

const MainLayout = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="left-nav">
        <div className="overlay"></div>
        <LeftNavigation
          onClickBio={() => navigate("/#bio")}
          onClickProjects={() => navigate("/#projects")}
          onClickExperience={() => navigate("/#experience")}
          onClickSkills={() => navigate("/#skills")}
        />
      </div>
      <div className="right-content">
      
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;