import { useCallback, useEffect } from 'react';
import { onGameStart, onSwipe as trackSwipe } from '../services/analytics.js';
import TinderCard from 'react-tinder-card';
import config from '../../docs/noemi-survey-config.json';
import { supabase } from '../services/supabaseClient.js';
import {
  CHOICE_MAP,
  ICON_MAP,
  KEY_MAP,
  FEEDBACK_TIMING,
  SWIPE_DIRECTIONS,
  ASSET_PATHS,
} from '../constants.js';
import { useDeck, useTutorial, useSwipeFeedback } from '../hooks/useSwipeGame.js';
import DesignCanvas from '../DesignCanvas.jsx';
import './SwipeGame.css';

/**
 * Interactive swipe-based game component for rating design cards.
 * 
 * Features:
 * - Tutorial animation showing swipe directions
 * - Keyboard controls (arrow keys) and touch/mouse swipe support
 * - Visual feedback for swipe actions
 * - Automatic data persistence to Supabase
 * 
 * Swipe directions map to:
 * - Right: Like
 * - Left: Dislike
 * - Up: Love
 * - Down: Unsure
 * 
 * @param {Object} props - Component props
 * @param {string} props.participantId - Unique participant identifier
 * @returns {JSX.Element} SwipeGame component
 */
export default function SwipeGame({ participantId }) {
  const { deck, setDeck, loadDesigns, resetDeck, total } = useDeck();
  const { showTutorial, tutorialDir, setShowTutorial } = useTutorial(deck !== null);
  const { feedbacks, addFeedback } = useSwipeFeedback();
  const current = deck?.[0];

  useEffect(() => {
    // Fire a game start event whenever the participant ID changes
    onGameStart(participantId);
    loadDesigns();
  }, [participantId, loadDesigns]);

  // Preload next images for instant transitions
  useEffect(() => {
    if (!deck?.length) return;
    
    const preloadCount = Math.min(10, deck.length - 1);
    const imagesToPreload = deck.slice(1, preloadCount + 1);
    const preloadedImages = [];
    
    imagesToPreload.forEach((card, index) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      // Add error handling for failed loads
      img.onerror = () => {
        console.warn(`Failed to preload image ${index + 1}:`, card.image_url);
      };
      
      // Optional: Add load success logging for debugging
      img.onload = () => {
        // Image successfully cached by browser
      };
      
      img.src = card.image_url;
      preloadedImages.push(img);
    });
    
    // Cleanup function to help with memory management
    return () => {
      preloadedImages.forEach(img => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [deck]);

  /**
   * Persist a swipe choice.
   * @param {string} cardId
   * @param {string} choice
   * @returns {Promise<void>}
   */
  const saveSwipe = useCallback(async (cardId, choice) => {
    try {
      if (supabase) {
        if (import.meta.env.DEV) console.debug('Saving swipe:', { participantId, cardId, choice });
        const { error } = await supabase.from('swipes').insert({
          participant_id: participantId,
          card_id: cardId,
          choice,
        });
        if (error) {
          console.error('Supabase swipe insert error:', error);
          throw error;
        }
        if (import.meta.env.DEV) console.debug('Swipe saved successfully');
        trackSwipe(participantId, cardId, choice);
      } else {
        console.warn('Supabase client not available. Swipe data not persisted.');
      }
    } catch (err) {
      console.error('Failed to save swipe:', err);
    }
  }, [participantId]);

  /**
   * Handle swipe direction and record choice.
   * @param {string} direction
   * @returns {Promise<void>}
   */
  const handleSwipe = useCallback(async (direction) => {
    const choice = CHOICE_MAP[direction];
    if (!choice || !deck?.length) return;

    const current = deck[0];

    // Show quick emoji feedback
    addFeedback(ICON_MAP[direction], FEEDBACK_TIMING.DISPLAY_DURATION_MS);

    setDeck((prev) => {
      const [first, ...rest] = prev;
      const newDeck = direction === SWIPE_DIRECTIONS.DOWN ? [...rest, first] : rest;
      
      // Progressive preloading: When deck gets smaller, preload more images
      if (newDeck.length > 0 && newDeck.length <= 5) {
        // When we're down to 5 or fewer cards, preload remaining images
        const imagesToPreload = newDeck.slice(1);
        imagesToPreload.forEach((card) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onerror = () => {
            console.warn('Failed to preload remaining image:', card.image_url);
          };
          img.src = card.image_url;
        });
      }
      
      return newDeck;
    });

    await saveSwipe(current.id, choice);
  }, [deck, saveSwipe, addFeedback, setDeck]);

  /**
   * Bind arrow key presses to swipe directions.
   * @param {KeyboardEvent} e
   */
  const handleKeyDown = useCallback(
    (e) => {
      const direction = KEY_MAP[e.key];
      if (direction) {
        e.preventDefault();
        handleSwipe(direction);
      }
    },
    [handleSwipe],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (deck === null) {
    return <p>Loading designs…</p>;
  }

  if (!deck.length) {
    return (
      <div className="swipe-game">
        <p className="sg-subtitle">Thanks for swiping!</p>
        <button
          type="button"
          onClick={() => {
            resetDeck();
            setShowTutorial(true);
          }}
          className="lux-button-primary"
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="swipe-game">
      <h2 className="sg-title">{config.design_feedback?.title || 'Design Exploration'}</h2>
      {total > 0 && (
        <progress className="sg-progress" value={total - deck.length} max={total} aria-label="Swipe progress" />
      )}

      <div className="swipe-container">
        {showTutorial ? (
          <div
            className={`card tutorial${
              tutorialDir ? ` hint-${tutorialDir}` : ''
            }`}
          >
            <DesignCanvas 
              src={current.image_url} 
              alt={`Design ${current.id}`} 
              fallbackSrc={ASSET_PATHS.FALLBACK_IMAGE}
            />
          </div>
        ) : (
          <TinderCard key={current.id} onSwipe={handleSwipe}>
            <div className="card">
              <DesignCanvas 
                src={current.image_url} 
                alt={`Design ${current.id}`} 
                fallbackSrc={ASSET_PATHS.FALLBACK_IMAGE}
              />
            </div>
          </TinderCard>
        )}

        <span className={`swipe-label left${tutorialDir === SWIPE_DIRECTIONS.LEFT ? ' active' : ''}`}>
          Dislike
        </span>
        <span className={`swipe-label right${tutorialDir === SWIPE_DIRECTIONS.RIGHT ? ' active' : ''}`}>
          Like
        </span>
        <span className={`swipe-label up${tutorialDir === SWIPE_DIRECTIONS.UP ? ' active' : ''}`}>
          Love
        </span>
        <span className={`swipe-label down${tutorialDir === SWIPE_DIRECTIONS.DOWN ? ' active' : ''}`}>
          Unsure
        </span>

        {feedbacks.map((fb) => (
          <div key={fb.id} className="swipe-feedback" aria-live="polite">
            {fb.icon}
          </div>
        ))}
      </div>
    </div>
  );
}