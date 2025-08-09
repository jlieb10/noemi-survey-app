import { useState } from 'react';
import Survey from './Survey.jsx';
import SwipeGame from './SwipeGame.jsx';
import config from '../docs/noemi-survey-config.json';

/**
 * Root component orchestrating survey and game flow.
 * Use `?dev=true` in the URL to always show the survey.
 */
export default function App() {
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const devMode = urlParams?.get('dev') === 'true';
  const storedId = typeof window !== 'undefined' && !devMode ? localStorage.getItem('participant_id') : null;
  const [step, setStep] = useState(storedId ? 'game' : 'welcome');
  const [participantId, setParticipantId] = useState(storedId);

  const handleComplete = (id) => {
    setParticipantId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('participant_id', id);
    }
    setStep('game');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      {step === 'welcome' && (
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', marginBottom: '0.5rem' }}>
            {config.survey.meta.title}
          </h1>
          <p style={{ fontStyle: 'italic', marginBottom: '1rem' }}>{config.survey.meta.subtitle}</p>
          <button
            type="button"
            onClick={() => setStep('survey')}
            style={{
              padding: '0.75rem',
              fontSize: '1rem',
              backgroundColor: '#1e1e1e',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {config.survey.meta.start_cta}
          </button>
        </div>
      )}
      {step === 'survey' && <Survey onComplete={handleComplete} />}
      {step === 'game' && participantId && <SwipeGame participantId={participantId} />}
    </div>
  );
}
