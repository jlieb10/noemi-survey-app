import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './components/App.jsx';
import SurveyRoute from './components/SurveyRoute.jsx';
import DesignRoute from './components/DesignRoute.jsx';
import './scripts/opalescentBackground.js';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/survey" element={<SurveyRoute />} />
        <Route path="/designr" element={<DesignRoute />} />
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
