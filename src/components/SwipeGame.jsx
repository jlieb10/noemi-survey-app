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
import { handleImageError } from '../utils/common.js';
import { useDeck, useTutorial, useSwipeFeedback, useSwipeHistory } from '../hooks/useSwipeGame.js';
import './SwipeGame.css';

/**
 * Interactive swipe-based game component for rating design cards.
 * 
 * Features:
 * - Tutorial animation showing swipe directions
 * - Keyboard controls (arrow keys) and touch/mouse swipe support
 * - Visual feedback for swipe actions
 * - Undo functionality with history tracking
 * - Automatic data persistence to Supabase
 * 
 * Swipe directions map to:
 * - Right: Like
 * - Left: Dislike  
 * - Up: Love
 * - Down: Not sure (card cycles to bottom of deck)
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.participantId - Unique identifier for the participant
 * @returns {JSX.Element} The swipe game interface
 */
export default function SwipeGame({ participantId }) {
  const { deck, setDeck, loadDesigns, resetDeck } = useDeck();
  const { showTutorial, tutorialDir, setShowTutorial } = useTutorial(!!deck);
  const { feedbacks, addFeedback } = useSwipeFeedback();
  const { history, addToHistory, undo: undoHistory, clearHistory } = useSwipeHistory();

  useEffect(() => {
    // Fire a game start event whenever the participant ID changes
    onGameStart(participantId);
    loadDesigns();
  }, [participantId, loadDesigns]);



  /**
   * Persist a swipe choice.
   * @param {string} cardId
   * @param {string} choice
   * @returns {Promise<void>}
   */
  const saveSwipe = useCallback(async (cardId, choice) => {
    try {
      if (supabase) {
        await supabase.from('swipes').insert({
          participant_id: participantId,
          card_id: cardId,
          choice,
        });
        trackSwipe(participantId, cardId, choice);
      } else {
        console.warn('Supabase client not available. Swipe data not persisted.');
      }
    } catch (err) {
      console.error('Failed to save swipe:', err);
    }
  }, [participantId]);

  /**
   * Remove a swipe record to support undo.
   * @param {string} cardId
   * @returns {Promise<void>}
   */

  const removeSwipe = useCallback(async (cardId) => {
    try {
      if (supabase) {
        await supabase
          .from('swipes')
          .delete()
          .match({ participant_id: participantId, card_id: cardId });
      } else {
        console.warn('Supabase client not available. Undo operation not persisted.');
      }
    } catch (err) {
      console.error('Failed to remove swipe:', err);
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
    addToHistory(deck, current);

    // Show quick emoji feedback
    addFeedback(ICON_MAP[direction], FEEDBACK_TIMING.DISPLAY_DURATION_MS);

    setDeck((prev) => {
      const [first, ...rest] = prev;
      return direction === SWIPE_DIRECTIONS.DOWN ? [...rest, first] : rest;
    });

    await saveSwipe(current.id, choice);
  }, [deck, saveSwipe, addToHistory, addFeedback, setDeck]);

  /**
   * Restore the previous deck state and remove persisted swipe.
   * @returns {Promise<void>}
   */
  const handleUndo = useCallback(async () => {
    const lastEntry = undoHistory();
    if (lastEntry) {
      setDeck(lastEntry.deck);
      await removeSwipe(lastEntry.card.id);
    }
  }, [undoHistory, removeSwipe, setDeck]);

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
            clearHistory();
            setShowTutorial(true);
          }}
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

      <div className="swipe-container">
        {showTutorial ? (
          <div
            className={`card tutorial${
              tutorialDir ? ` hint-${tutorialDir}` : ''
            }`}
          >
            <img
              src={current.image_url}
              alt={`Design ${current.id}`}
              loading="lazy"
              onError={(e) => handleImageError(e, ASSET_PATHS.FALLBACK_IMAGE)}
            />
          </div>
        ) : (
          <TinderCard key={current.id} onSwipe={handleSwipe}>
            <div className="card">
              <img
                src={current.image_url}
                alt={`Design ${current.id}`}
                loading="lazy"
                onError={(e) => handleImageError(e, ASSET_PATHS.FALLBACK_IMAGE)}
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

      {history.length > 0 && (
        <button
          type="button"
          onClick={handleUndo}
          className="lux-button-secondary"
        >
          Undo
        </button>
      )}
    </div>
  );
}
