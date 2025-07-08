import React from 'react';
import { useState, useEffect } from 'react';
import '../styles/Bio.css'; 

const Bio = () => {

  const [BioData, setBioData] = useState("");

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/kshitijsharma2204/portfolio/master/public/bio.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setBioData(data.bio);
      })
      .catch((err) => {
        console.error('Failed to load experience.json:', err);
      });
  }, []);

  return (
    <div>
        <h4 className="section-title">About Me</h4>
        <div
      className="bio-text">
          {BioData.split('<br/><br/>').map((para, i) => (
        <p key={i}>{para}</p>
      ))}
      </div>
    </div>
  );
};

export default Bio;
