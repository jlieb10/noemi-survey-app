import { useState } from 'react';
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
  const [deck, setDeck] = useState(config.swipe_ritual?.deck || []);
  const [feedback, setFeedback] = useState(null);

  /**
   * Handle swipe direction and record choice.
   * @param {string} direction
   * @returns {Promise<void>}
   */
  const handleSwipe = async (direction) => {
    const choice = CHOICE_MAP[direction];
    if (!choice || !deck.length) return;

    const current = deck[0];

    // Show quick emoji feedback
    setFeedback({ icon: ICON_MAP[direction], key: Date.now() });
    setTimeout(() => setFeedback(null), 500);

    // Rotate current card to back if "down" (unsure), otherwise remove it
    setDeck((prev) => {
      const [first, ...rest] = prev;
      return direction === 'down' ? [...rest, first] : rest;
    });

    // Persist swipe
    try {
      if (!supabase) throw new Error('Supabase not configured');
      await supabase.from('swipes').insert({
        participant_id: participantId,
        card_id: current.id,
        choice,
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (!deck.length) {
    return <p>Thanks for swiping! You’ve completed the ritual.</p>;
  }

  const current = deck[0];

  return (
    <div className="swipe-game">
      <h2 className="sg-title">{config.swipe_ritual.title}</h2>
      <p className="sg-subtitle">{config.swipe_ritual.subtitle}</p>

      <div className="swipe-container">
        <TinderCard key={current.id} onSwipe={handleSwipe}>
          <div className="card">
            <img
              src={`${config.survey.meta.assets_base}${current.image}`}
              alt={current.label}
              loading="lazy"
            />
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