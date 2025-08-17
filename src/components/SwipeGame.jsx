import { useCallback, useEffect } from 'react';
import { onGameStart, onSwipe as trackSwipe } from '../services/analytics.js';
import TinderCard from 'react-tinder-card';
import { supabase } from '../services/supabaseClient.js';
import {
  CHOICE_MAP,
  ICON_MAP,
  KEY_MAP,
  FEEDBACK_TIMING,
  SWIPE_DIRECTIONS,
  ASSET_PATHS,
} from '../constants.js';
import {
  useDeck,
  useSwipeFeedback,
  setTutorialSeen,
  clearTutorialSeen,
} from '../hooks/useSwipeGame.js';
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
  const { feedbacks, addFeedback } = useSwipeFeedback();
  const current = deck?.[0];

  useEffect(() => {
    // Fire a game start event whenever the participant ID changes
    onGameStart(participantId);
    loadDesigns();
  }, [participantId, loadDesigns]);

  // Enhanced image preloading for instant transitions
  useEffect(() => {
    if (!deck?.length) return;
    
    const preloadCount = Math.min(8, deck.length - 1);
    const imagesToPreload = deck.slice(1, preloadCount + 1);
    const preloadedImages = [];
    const controller = new AbortController();
    
    imagesToPreload.forEach((card, index) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      // Enhanced error handling with abort support
      img.onerror = () => {
        if (!controller.signal.aborted) {
          console.warn(`Failed to preload image ${index + 1}:`, card.image_url);
        }
      };
      
      // Success callback for debugging
      img.onload = () => {
        if (import.meta.env.DEV && !controller.signal.aborted) {
          console.debug(`Preloaded image ${index + 1}/${imagesToPreload.length}`);
        }
      };

      img.src = card.image_url;
      preloadedImages.push(img);
    });
    
    // Enhanced cleanup with abort signal
    return () => {
      controller.abort();
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
  const handleSwipe = useCallback(
    async (direction) => {
      if (!deck?.length) return;
      const current = deck[0];

      // Show quick emoji feedback
      addFeedback(ICON_MAP[direction], FEEDBACK_TIMING.DISPLAY_DURATION_MS);

      // Tutorial gate
      if (current.isTutorial) {
        if (direction !== current.requireDirection) {
          // Wrong direction: show nudge, do NOT pop
          return;
        }
        // Correct direction: pop card, do not persist, do not analytics as swipe
        setDeck(prev => prev.slice(1));
        // Check if this was the last tutorial card
        const remainingCards = deck.slice(1);
        const hasMoreTutorialCards = remainingCards.length > 0 && remainingCards[0]?.isTutorial;
        if (!hasMoreTutorialCards) {
          setTutorialSeen();
        }
        return;
      }

      // Normal design card path
      const choice = CHOICE_MAP[direction];
      if (!choice) return;

      setDeck((prev) => {
        const [first, ...rest] = prev;
        const newDeck = direction === SWIPE_DIRECTIONS.DOWN ? [...rest, first] : rest;
        return newDeck;
      });

      await saveSwipe(current.id, choice);
    },
    [deck, addFeedback, setDeck, saveSwipe]
  );

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
    [handleSwipe]
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
          }}
          className="lux-button-primary"
        >
          Play Again
        </button>
        <button
          type="button"
          onClick={() => {
            clearTutorialSeen();
            loadDesigns();
          }}
          className="lux-button-secondary"
          style={{ marginTop: 'var(--space-2)' }}
        >
          Replay Tutorial
        </button>
      </div>
    );
  }

  return (
    <div className="swipe-game">
      {/* Minimal header - only on non-mobile or when needed */}
      <div className="sg-header">
        {total > 0 && !current?.isTutorial && (
          <progress
            className="sg-progress"
            value={total - deck.length}
            max={total}
            aria-label="Swipe progress"
          />
        )}
      </div>

      <div className="swipe-container">
        <TinderCard key={current.id} onSwipe={handleSwipe}>
          <div className={`card ${current.isTutorial ? `tutorial-card-wrapper hint-${current.requireDirection}` : ''}`}>
            <DesignCanvas
              src={current.image_url}
              alt={current.isTutorial ? current.text : `Design ${current.id}`}
              card={current}
              tutorialHighlightDir={current.isTutorial ? current.requireDirection : null}
              fallbackSrc={ASSET_PATHS.FALLBACK_IMAGE}
            />
          </div>
        </TinderCard>

        <span className="swipe-label left">Dislike</span>
        <span className="swipe-label right">Like</span>
        <span className="swipe-label up">Love</span>
        <span className="swipe-label down">Unsure</span>

        {feedbacks.map((fb) => (
          <div key={fb.id} className="swipe-feedback" aria-live="polite">
            {fb.icon}
          </div>
        ))}
      </div>
    </div>
  );
}