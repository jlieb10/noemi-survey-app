import { useState } from 'react';
import Survey from './Survey.jsx';
import SwipeGame from './SwipeGame.jsx';
import config from '../../docs/noemi-survey-config.json';
import {
  URL_PARAMS,
  STORAGE_KEYS,
  APP_STEPS,
  DEFAULT_PARTICIPANT_IDS,
  ASSET_PATHS,
} from '../constants.js';
import { getStorageItem, hasUrlParam, setStorageItem } from '../utils/common.js';

/**
 * Root application component that orchestrates the survey and swipe game flow.
 * 
 * Supports multiple entry modes:
 * - Normal flow: Welcome -> Survey -> Game
 * - Dev mode (?dev=true): Starts directly at survey
 * - Play mode (?play=true): Starts directly at game with guest ID
 * 
 * Manages participant state and persists the participant ID across sessions.
 * 
 * @component
 * @returns {JSX.Element} The main application interface
 */
export default function App() {
  const devMode = hasUrlParam(URL_PARAMS.DEV_MODE, 'true');
  const playMode = hasUrlParam(URL_PARAMS.PLAY_MODE, 'true');
  const storedId = !devMode ? getStorageItem(STORAGE_KEYS.PARTICIPANT_ID) : null;
  
  const initialStep = devMode ? APP_STEPS.SURVEY : playMode ? APP_STEPS.GAME : storedId ? APP_STEPS.GAME : APP_STEPS.WELCOME;
  const initialId = storedId || (playMode ? DEFAULT_PARTICIPANT_IDS.GUEST : null);
  const [step, setStep] = useState(initialStep);
  const [participantId, setParticipantId] = useState(initialId);
  const [showTerms, setShowTerms] = useState(false);

  /**
   * Handles survey completion and transitions to the game.
   * Persists the participant ID to localStorage for future sessions.
   * 
   * @param {string} id - The participant ID from the survey submission
   */
  const handleComplete = (id) => {
    setParticipantId(id);
    setStorageItem(STORAGE_KEYS.PARTICIPANT_ID, id);
    setStep(APP_STEPS.GAME);
  };

  return (
    <div className="lux-container">
      <header className="app-header">
        <img src={ASSET_PATHS.LOGO} alt="NOEMI logo" className="app-logo" />
      </header>
      {step === APP_STEPS.WELCOME && (
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h1>{config.survey.meta.title}</h1>
          <p style={{ fontStyle: 'italic' }}>{config.survey.meta.subtitle}</p>
          <button
            type="button"
            onClick={() => setStep(APP_STEPS.SURVEY)}
            className="lux-button-primary"
          >
            {config.survey.meta.start_cta}
          </button>
          <button
            type="button"
            onClick={() => {
              setParticipantId(storedId || DEFAULT_PARTICIPANT_IDS.GUEST);
              setStep(APP_STEPS.GAME);
            }}
            className="lux-button-secondary"
          >
            Play Swipe Ritual
          </button>
        </div>
      )}
      {step === APP_STEPS.SURVEY && <Survey onComplete={handleComplete} />}
      {step === APP_STEPS.GAME && participantId && <SwipeGame participantId={participantId} />}
      <div className="terms-root">
        <button
          type="button"
          className="terms-button"
          onClick={() => setShowTerms((s) => !s)}
          onMouseEnter={() => setShowTerms(true)}
          onMouseLeave={() => setShowTerms(false)}
          aria-label="View terms"
        >
          i
        </button>
        {showTerms && (
          <div className="terms-tooltip">
            By participating, you agree that all imagery, brand concepts, and creative assets shown in this
            survey are proprietary to NOEMI. No portion may be copied, shared, or reproduced. Your responses
            may be used in anonymised form for research and marketing purposes. Your data will not be sold to
            third parties.
          </div>
        )}
      </div>
    </div>
  );
}
