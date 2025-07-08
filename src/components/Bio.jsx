import React from 'react';
import '../styles/Bio.css'; // optional, if you want to style the button

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
      <span>
         ${BioData}
      </span>
    </div>
  );
};

export default Bio;
