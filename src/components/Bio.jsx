import React, { useState, useEffect } from 'react';
import '../styles/Bio.css';

const Bio = () => {
  const [bioData, setBioData] = useState('');

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/kshitijsharma2204/portfolio/master/public/bio.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => setBioData(data.bio))
      .catch(err => {
        console.error('Failed to load bio.json:', err);
      });
  }, []);

  return (
    <div>
      <h4 className="section-title">About Me</h4>
      {/* Note: no children inside this div! */}
      <div
        className="bio-text"
        dangerouslySetInnerHTML={{ __html: bioData }}
      />
    </div>
  );
};

export default Bio;
