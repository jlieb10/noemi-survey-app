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
import {
  useDeck,
  useTutorial,
  useSwipeFeedback,
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
  const { showTutorial, tutorialCardIndex, tutorialDir, setShowTutorial, handleTutorialSwipe } = useTutorial(
    deck !== null
  );
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
      const choice = CHOICE_MAP[direction];
      if (!choice || !deck?.length) return;

      const current = deck[0];

      // Show quick emoji feedback
      addFeedback(ICON_MAP[direction], FEEDBACK_TIMING.DISPLAY_DURATION_MS);

      setDeck((prev) => {
        const [first, ...rest] = prev;
        const newDeck = direction === SWIPE_DIRECTIONS.DOWN ? [...rest, first] : rest;
        return newDeck;
      });

      await saveSwipe(current.id, choice);
    },
    [deck, saveSwipe, addFeedback, setDeck]
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
      {/* Minimal header - only on non-mobile or when needed */}
      <div className="sg-header">
        {total > 0 && !showTutorial && (
          <progress
            className="sg-progress"
            value={total - deck.length}
            max={total}
            aria-label="Swipe progress"
          />
        )}
      </div>

      <div className="swipe-container">
        {showTutorial ? (
          <div
            className={`card tutorial${
              tutorialDir ? ` hint-${tutorialDir}` : ''
            }`}
            onTouchStart={(e) => e.preventDefault()} // Prevent default touch behavior
            onClick={() => handleTutorialSwipe && handleTutorialSwipe()}
          >
            <div className="tutorial-content">
              <div className="tutorial-text">
                {getTutorialText(tutorialCardIndex)}
              </div>
              {tutorialCardIndex > 0 && (
                <div className="tutorial-demo-area">
                  <div className="swipe-demo-card">
                    <span className="demo-text">Demo Card</span>
                  </div>
                </div>
              )}
            </div>
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

        <span
          className={`swipe-label left${tutorialDir === SWIPE_DIRECTIONS.LEFT ? ' active' : ''}`}
        >
          Dislike
        </span>
        <span
          className={`swipe-label right${tutorialDir === SWIPE_DIRECTIONS.RIGHT ? ' active' : ''}`}
        >
          Like
        </span>
        <span
          className={`swipe-label up${tutorialDir === SWIPE_DIRECTIONS.UP ? ' active' : ''}`}
        >
          Love
        </span>
        <span
          className={`swipe-label down${tutorialDir === SWIPE_DIRECTIONS.DOWN ? ' active' : ''}`}
        >
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

/**
 * Get tutorial text based on current card index
 * @param {number} cardIndex - Current tutorial card index
 * @returns {string} Tutorial text to display
 */
function getTutorialText(cardIndex) {
  const tutorialTexts = [
    config.game_tutorial?.welcome_card || 
      'Welcome to the NOEMI Brand Exploration game! Swipe to help us refine what feels most NOEMI. Continue by swiping this card up.',
    config.game_tutorial?.card_one || 'Swipe right to like',
    config.game_tutorial?.card_two || 'Swipe left to dislike',
    config.game_tutorial?.card_three || 'Swipe up to love',
    config.game_tutorial?.card_four || 'Swipe down for not sure'
  ];
  
  return tutorialTexts[cardIndex] || tutorialTexts[0];
}