import { useState } from 'react';
import TinderCard from 'react-tinder-card';
import config from '../docs/noemi-survey-config.json';
import { supabase } from './supabaseClient.js';

const CHOICE_MAP = {
  right: 'yes',
  left: 'no',
};

export default function SwipeGame({ participantId }) {
  const deck = config.swipe_ritual?.deck || [];
  const [index, setIndex] = useState(0);

  const handleSwipe = async (direction, cardId) => {
    const choice = CHOICE_MAP[direction];
    if (!choice) return;
    setIndex((prev) => prev + 1);
    try {
      await supabase.from('swipes').insert({
        participant_id: participantId,
        card_id: cardId,
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
      <div style={{ width: '320px', height: '320px' }}>
        <TinderCard
          key={current.id}
          onSwipe={(dir) => handleSwipe(dir, current.id)}
          preventSwipe={['up', 'down']}
        >
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
      </div>
      <p style={{ marginTop: '1rem', fontStyle: 'italic', fontSize: '0.9rem' }}>
        Swipe right for YES · left for NO
      </p>
    </div>
  );
}
