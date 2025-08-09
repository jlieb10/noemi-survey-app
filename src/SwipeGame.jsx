import { useState } from 'react';
import TinderCard from 'react-tinder-card';
import config from '../docs/noemi-survey-config.json';
import { supabase } from './supabaseClient.js';
import './SwipeGame.css';

const CHOICE_MAP = {
  right: 'like',
  left: 'dislike',
  up: 'love',
  down: 'unsure',
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
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);

  /**
   * Handle swipe direction and record choice.
   * @param {string} direction
   * @param {{ id: string }} card
   * @returns {Promise<void>}
   */
  const handleSwipe = async (direction, card) => {
    const choice = CHOICE_MAP[direction];
    if (!choice) return;
    setFeedback(ICON_MAP[direction]);
    setTimeout(() => setFeedback(null), 500);
    if (direction === 'down') {
      setDeck((prev) => [...prev, card]);
    }
    setIndex((prev) => prev + 1);
    try {
      await supabase.from('swipes').insert({
        participant_id: participantId,
        card_id: card.id,
        choice,
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (index >= deck.length) return <p>Thanks for swiping! You’ve completed the ritual.</p>;
  const current = deck[index];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ fontFamily: 'Georgia, serif' }}>{config.swipe_ritual.title}</h2>
      <p style={{ fontStyle: 'italic', marginBottom: '1rem' }}>{config.swipe_ritual.subtitle}</p>
      <div className="swipe-container">
        <TinderCard key={current.id} onSwipe={(dir) => handleSwipe(dir, current)}>
          <div
            style={{
              backgroundColor: '#fff',
              width: '100%',
              height: '100%',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <img
              src={`${config.survey.meta.assets_base}${current.image}`}
              alt={current.label}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </TinderCard>
        {feedback && <div className="swipe-feedback">{feedback}</div>}
        <div className="swipe-label label-right">Like</div>
        <div className="swipe-label label-left">Dislike</div>
        <div className="swipe-label label-up">Love</div>
        <div className="swipe-label label-down">Not Sure</div>
      </div>
    </div>
  );
}
