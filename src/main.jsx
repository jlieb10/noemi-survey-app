import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './components/App.jsx';
import Survey from './components/Survey.jsx';
import SwipeGame from './components/SwipeGame.jsx';
import { DEFAULT_PARTICIPANT_IDS } from './constants.js';
import './scripts/opalescentBackground.js';

// Route component for standalone survey
const SurveyRoute = () => (
  <div className="lux-container">
    <header className="app-header" role="banner">
      <img src="/logo.png" alt="NOEMI logo" className="app-logo" />
    </header>
    <main role="main">
      <Survey onComplete={(id) => {
        console.log('Survey completed with ID:', id);
        // In standalone mode, just log the completion
        alert(`Survey completed! Participant ID: ${id}`);
      }} />
    </main>
  </div>
);

// Route component for standalone design game
const DesignRoute = () => (
  <div className="lux-container">
    <header className="app-header" role="banner">
      <img src="/logo.png" alt="NOEMI logo" className="app-logo" />
    </header>
    <main role="main">
      <SwipeGame participantId={DEFAULT_PARTICIPANT_IDS.GUEST} />
    </main>
  </div>
);

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
