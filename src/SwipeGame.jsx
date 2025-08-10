import { useEffect, useState } from 'react';
import { onGameStart, onSwipe as trackSwipe } from './analytics.js';
import TinderCard from 'react-tinder-card';
import config from '../docs/noemi-survey-config.json';
import { supabase } from './supabaseClient.js';
import './SwipeGame.css';

const CHOICE_MAP = {
  right: 'like',
  left: 'dislike',
  up: 'love',
  down: 'not_sure',
};

const ICON_MAP = {
  right: '👍',
  left: '👎',
  up: '❤️',
  down: '❓',
};

/**
 * Swipe-based mini-game for rating cards.
 * @param {{ participantId: string }} props
 * @returns {JSX.Element}
 */
export default function SwipeGame({ participantId }) {
  const [deck, setDeck] = useState(null);
  const [initialDeck, setInitialDeck] = useState([]);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    // Fire a game start event when the component mounts
    onGameStart(participantId);

    fetch('/designs/index.json')
      .then((res) => res.json())
      .then((data) => {
        const subset = data.slice(0, 20);
        setDeck(subset);
        setInitialDeck(subset);
      })
      .catch((err) => {
        console.error('Failed to load designs', err);
        setDeck([]);
      });
  }, []);

  /**
   * Handle swipe direction and record choice.
   * @param {string} direction
   * @returns {Promise<void>}
   */
  const handleSwipe = async (direction) => {
    const choice = CHOICE_MAP[direction];
    if (!choice || !deck?.length) return;

    const current = deck[0];

    // Show quick emoji feedback
    setFeedback({ icon: ICON_MAP[direction], key: Date.now() });
    setTimeout(() => setFeedback(null), 1000);

    // Rotate current card to back if "down" (unsure), otherwise remove it
    setDeck((prev) => {
      const [first, ...rest] = prev;
      return direction === 'down' ? [...rest, first] : rest;
    });

    // Persist swipe
    try {
      if (supabase) {
        await supabase.from('swipes').insert({
          participant_id: participantId,
          card_id: current.id,
          choice,
        });
      } else {
        await fetch('https://lzzgroksxrqkwyvykmka.supabase.co/rest/v1/swipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ participant_id: participantId, card_id: current.id, choice }),
        });
      }

      // Emit analytics event for the swipe
      trackSwipe(participantId, current.id, choice);
    } catch (err) {
      console.error(err);
    }
  };

  if (deck === null) {
    return <p>Loading designs…</p>;
  }

  if (!deck.length) {
    return (
      <div className="swipe-game">
        <p className="sg-subtitle">Thanks for swiping!</p>
        <button
          type="button"
          onClick={() => setDeck(initialDeck)}
          className="lux-button-primary"
        >
          Play Again
        </button>
      </div>
    );
  }

  const current = deck[0];

  return (
    <div className="swipe-game">
      <h2 className="sg-title">{config.swipe_ritual.title}</h2>
      <p className="sg-subtitle">{config.swipe_ritual.subtitle}</p>

      <div className="swipe-container">
        <TinderCard key={current.id} onSwipe={handleSwipe}>
          <div className="card">
            <img src={
              current.image_url} 
              alt={`Design ${current.id}`} 
              loading="lazy" 
              onError={(e) => {
                e.currentTarget.src = '/vite.svg';
              }}/>
          </div>
        </TinderCard>

        <span className="swipe-label left">Dislike</span>
        <span className="swipe-label right">Like</span>
        <span className="swipe-label up">Love</span>
        <span className="swipe-label down">Unsure</span>

        {feedback && (
          <div key={feedback.key} className="swipe-feedback" aria-live="polite">
            {feedback.icon}
          </div>
        )}
      </div>
    </div>
  );
}
