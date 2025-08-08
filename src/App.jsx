import { useState } from 'react';
import Survey from './Survey.jsx';
import SwipeGame from './SwipeGame.jsx';

/**
 * The main application component. It controls whether the survey or the
 * swipe game is displayed. When the survey completes it stores the
 * participant ID in localStorage and passes it to the swipe game.
 */
export default function App() {
  // Track whether the user has completed the survey or not. Default to
  // "game" if a participant ID already exists in local storage so returning
  // visitors resume where they left off.
  const storedId = typeof window !== 'undefined' ? localStorage.getItem('participant_id') : null;
  const [step, setStep] = useState(storedId ? 'game' : 'survey');
  const [participantId, setParticipantId] = useState(storedId);

  /**
   * Called when the survey component finishes successfully. Stores the
   * participant ID and advances the UI to the swipe game.
   *
   * @param {string} id The Supabase-generated participant ID
   */
  const handleComplete = (id) => {
    setParticipantId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('participant_id', id);
    }
    setStep('game');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      {step === 'survey' && <Survey onComplete={handleComplete} />}
      {step === 'game' && participantId && <SwipeGame participantId={participantId} />}
    </div>
  );
}