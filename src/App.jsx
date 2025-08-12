import { useState } from 'react';
import Survey from './Survey.jsx';
import SwipeGame from './SwipeGame.jsx';
import config from '../docs/noemi-survey-config.json';

/**
 * Root component orchestrating survey and game flow.
 * Use `?dev=true` in the URL to start directly at the survey.
 */
export default function App() {
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const devMode = urlParams?.get('dev') === 'true';
  const playMode = urlParams?.get('play') === 'true';
  const storedId = typeof window !== 'undefined' && !devMode ? localStorage.getItem('participant_id') : null;
  const initialStep = devMode ? 'survey' : playMode ? 'game' : storedId ? 'game' : 'welcome';
  const initialId = storedId || (playMode ? 'guest' : null);
  const [step, setStep] = useState(initialStep);
  const [participantId, setParticipantId] = useState(initialId);

  const handleComplete = (id) => {
    setParticipantId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('participant_id', id);
    }
    setStep('game');
  };

  return (
    <div className="lux-container">
      <header className="app-header">
        <img src="/logo.png" alt="NOEMI logo" className="app-logo" />
      </header>
      {step === 'welcome' && (
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h1>{config.survey.meta.title}</h1>
          <p style={{ fontStyle: 'italic' }}>{config.survey.meta.subtitle}</p>
          <button
            type="button"
            onClick={() => setStep('survey')}
            className="lux-button-primary"
          >
            {config.survey.meta.start_cta}
          </button>
          <button
            type="button"
            onClick={() => {
              setParticipantId(storedId || 'guest');
              setStep('game');
            }}
            className="lux-button-secondary"
          >
            Play Swipe Ritual
          </button>
        </div>
      )}
      {step === 'survey' && <Survey onComplete={handleComplete} />}
      {step === 'game' && participantId && <SwipeGame participantId={participantId} />}
    </div>
  );
}
