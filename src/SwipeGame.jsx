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
 * Render the swipe game interface.
 * @param {{participantId: string}} props Component props.
 * @returns {JSX.Element}
 */
export default function SwipeGame({ participantId }) {
  const [deck, setDeck] = useState(config.swipe_ritual?.deck || []);
  const [feedback, setFeedback] = useState(null);

  const handleSwipe = async (direction) => {
    const choice = CHOICE_MAP[direction];
    if (!choice || !deck.length) return;
    const current = deck[0];
    setFeedback({ icon: ICON_MAP[direction], key: Date.now() });
    setTimeout(() => setFeedback(null), 500);
    setDeck((prev) => {
      const [, ...rest] = prev;
      return direction === 'down' ? [...rest, current] : rest;
    });
    try {
      await supabase.from('swipes').insert({
        participant_id: participantId,
        card_id: current.id,
        choice,
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (!deck.length) return <p>Thanks for swiping! You’ve completed the ritual.</p>;
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
            />
          </div>
        </TinderCard>
        <span className="swipe-label left">Dislike</span>
        <span className="swipe-label right">Like</span>
        <span className="swipe-label up">Love</span>
        <span className="swipe-label down">Unsure</span>
        {feedback && (
          <div key={feedback.key} className="swipe-feedback">
            {feedback.icon}
          </div>
        )}
      </div>
    </div>
  );
}

