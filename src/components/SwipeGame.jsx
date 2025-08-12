<<<<<<< HEAD
import { useCallback, useEffect } from 'react';
import { onGameStart, onSwipe as trackSwipe } from '../services/analytics.js';
import TinderCard from 'react-tinder-card';
=======
import { useCallback, useEffect, useState } from 'react';
import { onGameStart, onSwipe as trackSwipe } from '../services/analytics.js';
import TinderCard from 'react-tinder-card';
<<<<<<<< HEAD:src/SwipeGame.jsx
import config from '../docs/noemi-survey-config.json';
import { supabase } from './supabaseClient.js';
========
>>>>>>> e718470 (Complete comprehensive codebase cleanup and refactoring - Phase 1)
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
import DesignCanvas from './DesignCanvas.jsx';
<<<<<<< HEAD
=======
>>>>>>>> e718470 (Complete comprehensive codebase cleanup and refactoring - Phase 1):src/components/SwipeGame.jsx
>>>>>>> e718470 (Complete comprehensive codebase cleanup and refactoring - Phase 1)
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
<<<<<<< HEAD
  const { deck, setDeck, loadDesigns, resetDeck } = useDeck();
  const { showTutorial, tutorialDir, setShowTutorial } = useTutorial(deck !== null);
=======
<<<<<<<< HEAD:src/SwipeGame.jsx
  const [deck, setDeck] = useState(null);
  const [initialDeck, setInitialDeck] = useState([]);

  const [feedbacks, setFeedbacks] = useState([]);
  const [history, setHistory] = useState([]);
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialDir, setTutorialDir] = useState(null);
========
  const { deck, setDeck, loadDesigns, resetDeck, total } = useDeck();
  const { showTutorial, tutorialDir, setShowTutorial } = useTutorial(!!deck);
>>>>>>> e718470 (Complete comprehensive codebase cleanup and refactoring - Phase 1)
  const { feedbacks, addFeedback } = useSwipeFeedback();
  const { history, addToHistory, undo: undoHistory, clearHistory } = useSwipeHistory();
  const instagramHandle = config.brand?.instagram || '@noemi';
  const current = deck?.[0];
<<<<<<< HEAD
=======
>>>>>>>> e718470 (Complete comprehensive codebase cleanup and refactoring - Phase 1):src/components/SwipeGame.jsx
>>>>>>> e718470 (Complete comprehensive codebase cleanup and refactoring - Phase 1)

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
<<<<<<< HEAD

=======
>>>>>>> e718470 (Complete comprehensive codebase cleanup and refactoring - Phase 1)
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
<<<<<<< HEAD
    addToHistory(deck, current);
=======
<<<<<<<< HEAD:src/SwipeGame.jsx
    setHistory((prev) => [...prev, { deck: [...deck], card: current }]);
========
    addToHistory(deck, current);
>>>>>>>> e718470 (Complete comprehensive codebase cleanup and refactoring - Phase 1):src/components/SwipeGame.jsx
>>>>>>> e718470 (Complete comprehensive codebase cleanup and refactoring - Phase 1)

    // Show quick emoji feedback
    addFeedback(ICON_MAP[direction], FEEDBACK_TIMING.DISPLAY_DURATION_MS);

    setDeck((prev) => {
      const [first, ...rest] = prev;
      return direction === SWIPE_DIRECTIONS.DOWN ? [...rest, first] : rest;
    });

    await saveSwipe(current.id, choice);
<<<<<<< HEAD
  }, [deck, saveSwipe, addToHistory, addFeedback, setDeck]);
=======
<<<<<<<< HEAD:src/SwipeGame.jsx
  }, [deck, saveSwipe]);
========
  }, [deck, saveSwipe, addToHistory, addFeedback, setDeck]);
>>>>>>>> e718470 (Complete comprehensive codebase cleanup and refactoring - Phase 1):src/components/SwipeGame.jsx
>>>>>>> e718470 (Complete comprehensive codebase cleanup and refactoring - Phase 1)

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

<<<<<<< HEAD
  const handleShare = useCallback(async () => {
    if (!current) return;
    try {
      const story = document.createElement('canvas');
      story.width = 1080;
      story.height = 1920;
      const ctx = story.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, story.width, story.height);
      gradient.addColorStop(0, '#e0d7ff');
      gradient.addColorStop(1, '#ffe3e3');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, story.width, story.height);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = current.image_url;
      });
      const maxSize = 900;
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (story.width - w) / 2;
      const y = 300;
      ctx.drawImage(img, x, y, w, h);

      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      await new Promise((resolve) => {
        logo.onload = resolve;
        logo.onerror = resolve;
        logo.src = '/logo.png';
      });
      const lw = 240;
      const lh = (logo.height / logo.width) * lw || 80;
      ctx.drawImage(logo, story.width - lw - 40, story.height - lh - 40, lw, lh);

      ctx.fillStyle = '#5a4333';
      ctx.font = '48px serif';
      ctx.textAlign = 'center';
      ctx.fillText('I loved this design…', story.width / 2, 120);
      ctx.fillText('Cast your vote now', story.width / 2, 180);

      ctx.font = '36px sans-serif';
      ctx.fillText(instagramHandle, story.width / 2, story.height - 120);
      const surveyUrl = window.location.origin;
      ctx.font = '28px sans-serif';
      ctx.fillText(surveyUrl, story.width / 2, story.height - 60);

      const blob = await new Promise((resolve) => story.toBlob(resolve, 'image/png'));
      if (navigator.share && blob) {
        const file = new File([blob], 'story.png', { type: 'image/png' });
        await navigator.share({ files: [file], title: 'NOEMI design', text: 'Check this out' });
      }
    } catch (err) {
      console.error('Share failed', err);
    }
  }, [current, instagramHandle]);

=======
>>>>>>> e718470 (Complete comprehensive codebase cleanup and refactoring - Phase 1)
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

<<<<<<< HEAD
  return (
    <div className="swipe-game">
      <h2 className="sg-title">{config.swipe_ritual.title}</h2>
      <p className="sg-instructions">Swipe right to like, left to dislike, up to love, down if unsure. You can undo the last swipe.</p>
      {total > 0 && (
        <progress className="sg-progress" value={total - deck.length} max={total} aria-label="Swipe progress" />
      )}
=======
  const current = deck[0];

  return (
    <div className="swipe-game">
      <h2 className="sg-title">{config.swipe_ritual.title}</h2>
>>>>>>> e718470 (Complete comprehensive codebase cleanup and refactoring - Phase 1)

      <div className="swipe-container">
        {showTutorial ? (
          <div
            className={`card tutorial${
              tutorialDir ? ` hint-${tutorialDir}` : ''
            }`}
          >
<<<<<<< HEAD
            <DesignCanvas 
              src={current.image_url} 
              alt={`Design ${current.id}`} 
              fallbackSrc={ASSET_PATHS.FALLBACK_IMAGE}
=======
<<<<<<<< HEAD:src/SwipeGame.jsx
            <img
              src={current.image_url}
              alt={`Design ${current.id}`}
              loading="lazy"
              width="300"
              height="300"
              onError={(e) => {
                e.currentTarget.src = '/vite.svg';
              }}
========
            <DesignCanvas 
              src={current.image_url} 
              alt={`Design ${current.id}`}
              fallbackSrc={ASSET_PATHS.FALLBACK_IMAGE}
>>>>>>>> e718470 (Complete comprehensive codebase cleanup and refactoring - Phase 1):src/components/SwipeGame.jsx
>>>>>>> e718470 (Complete comprehensive codebase cleanup and refactoring - Phase 1)
            />
          </div>
        ) : (
          <TinderCard key={current.id} onSwipe={handleSwipe}>
            <div className="card">
<<<<<<< HEAD
              <DesignCanvas 
                src={current.image_url} 
                alt={`Design ${current.id}`} 
                fallbackSrc={ASSET_PATHS.FALLBACK_IMAGE}
=======
<<<<<<<< HEAD:src/SwipeGame.jsx
              <img
                src={current.image_url}
                alt={`Design ${current.id}`}
                loading="lazy"
                width="300"
                height="300"
                onError={(e) => {
                  e.currentTarget.src = '/vite.svg';
                }}
========
              <DesignCanvas 
                src={current.image_url} 
                alt={`Design ${current.id}`}
                fallbackSrc={ASSET_PATHS.FALLBACK_IMAGE}
>>>>>>>> e718470 (Complete comprehensive codebase cleanup and refactoring - Phase 1):src/components/SwipeGame.jsx
>>>>>>> e718470 (Complete comprehensive codebase cleanup and refactoring - Phase 1)
              />
            </div>
          </TinderCard>
        )}

<<<<<<< HEAD
=======
<<<<<<<< HEAD:src/SwipeGame.jsx
        <span className={`swipe-label left${tutorialDir === 'left' ? ' active' : ''}`}>
========
>>>>>>> e718470 (Complete comprehensive codebase cleanup and refactoring - Phase 1)
        <button
          type="button"
          aria-label="Share to Instagram"
          className="instagram-share-btn"
          onClick={handleShare}
        >
          IG
        </button>

        <span className={`swipe-label left${tutorialDir === SWIPE_DIRECTIONS.LEFT ? ' active' : ''}`}>
<<<<<<< HEAD
=======
>>>>>>>> e718470 (Complete comprehensive codebase cleanup and refactoring - Phase 1):src/components/SwipeGame.jsx
>>>>>>> e718470 (Complete comprehensive codebase cleanup and refactoring - Phase 1)
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