import { useState, useEffect } from 'react';
import TinderCard from 'react-tinder-card';
import { supabase } from './supabaseClient.js';

// Mapping of swipe directions to labels. Feel free to adjust labels
// according to the branding of your survey (e.g. "fuck" → "love").
const CHOICE_MAP = {
  right: 'fuck',
  up: 'marry',
  left: 'kill',
  down: 'not_sure',
};

/**
 * A Tinder-like swipe interface for collecting qualitative feedback on
 * label designs. It fetches the list of designs from the public
 * directory and records each swipe to Supabase.
 */
export default function SwipeGame({ participantId }) {
  const [designs, setDesigns] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Try to load designs from Supabase first. This ensures the
        // IDs used for swipes correspond to real rows in the database.
        if (supabase) {
          const { data, error } = await supabase.from('designs').select('*').limit(200);
          if (!error && data && data.length > 0) {
            setDesigns(shuffle(data));
            setLoading(false);
            return;
          }
        }
        // Fallback to local JSON if Supabase is unavailable or empty.
        const res = await fetch('/designs/index.json', { cache: 'no-store' });
        const json = await res.json();
        // Ensure locally loaded designs are presented in random order
        setDesigns(shuffle(json));
      } catch (err) {
        console.error(err);
        setError('Failed to load designs');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Shuffle helper
  function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  /**
   * Called when the user swipes a card. Inserts a record in the
   * `swipes` table associating the participant with their choice.
   *
   * @param {string} direction The swipe direction (right, up, left, down)
   * @param {string} designId The UUID of the design record
   */
  const handleSwipe = async (direction, designId) => {
    const choice = CHOICE_MAP[direction];
    if (!choice) return;
    // Optimistically advance to the next card
    setIndex((prev) => prev + 1);
    try {
      await supabase.from('swipes').insert({
        participant_id: participantId,
        design_id: designId,
        choice,
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p>Loading designs…</p>;
  if (error) return <p>{error}</p>;
  if (index >= designs.length) return <p>Thanks for swiping! You’ve completed the session.</p>;

  // Show one design at a time to keep the interface simple. Additional
  // designs will be rendered once the current card has been swiped.
  const current = designs[index];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ fontFamily: 'Georgia, serif' }}>Choose your favourites</h2>
      <div style={{ width: '320px', height: '320px' }}>
        <TinderCard
          key={current.id}
          onSwipe={(dir) => handleSwipe(dir, current.id)}
          preventSwipe={[]}
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
              src={current.image_url}
              alt="label design"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </TinderCard>
      </div>
      <p style={{ marginTop: '1rem', fontStyle: 'italic', fontSize: '0.9rem' }}>
        Swipe right for FUCK · up for MARRY · left for KILL · down for NOT SURE
      </p>
    </div>
  );
}
