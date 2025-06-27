import { BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';

import './App.css';
import HomeComponent from './components/Home';
import ProjectsList from './components/ProjectsList';
import ProjectDetail from './components/ProjectDetail';
import MainLayout from './components/MainLayout';
import HomeSections from './components/HomeSections';

function App() {
  return (
    <Router>
    <Routes>
      <Route path="/" element={<MainLayout />}>  
  
        <Route index element={<HomeSections />} />
        <Route path="projects/all" element={<ProjectsList />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
       
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  </Router>
  );
}

export default App;
