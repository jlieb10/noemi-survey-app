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
import { useDeck, useTutorial, useSwipeFeedback, useSwipeHistory } from '../hooks/useSwipeGame.js';
import DesignCanvas from '../DesignCanvas.jsx';
import './SwipeGame.css';

// Story share configuration
const STORY_CONFIG = {
  width: 1080,
  height: 1920,
  maxImageSize: 900,
  logoWidth: 240,
  imageY: 300,
  gradient: {
    start: '#e0d7ff',
    end: '#ffe3e3'
  },
  text: {
    color: '#5a4333',
    title: 'I loved this design…',
    subtitle: 'Cast your vote now',
    titleFont: '48px serif',
    subtitleFont: '36px sans-serif',
    urlFont: '28px sans-serif'
  }
};

/**
 * Create a story canvas with gradient background
 * @returns {object} Canvas context and canvas element
 */
const createStoryCanvas = () => {
  const story = document.createElement('canvas');
  story.width = STORY_CONFIG.width;
  story.height = STORY_CONFIG.height;
  const ctx = story.getContext('2d');
  
  const gradient = ctx.createLinearGradient(0, 0, story.width, story.height);
  gradient.addColorStop(0, STORY_CONFIG.gradient.start);
  gradient.addColorStop(1, STORY_CONFIG.gradient.end);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, story.width, story.height);
  
  return { ctx, story };
};

/**
 * Load and draw an image with scaling
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} src - Image source URL
 * @param {number} maxSize - Maximum size for scaling
 * @param {number} y - Y position
 * @returns {Promise<void>}
 */
const drawScaledImage = async (ctx, src, maxSize, y) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = src;
  });
  
  const scale = Math.min(maxSize / img.width, maxSize / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const x = (STORY_CONFIG.width - w) / 2;
  
  ctx.drawImage(img, x, y, w, h);
};

/**
 * Draw logo on canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @returns {Promise<void>}
 */
const drawLogo = async (ctx) => {
  const logo = new Image();
  logo.crossOrigin = 'anonymous';
  
  await new Promise((resolve) => {
    logo.onload = resolve;
    logo.onerror = resolve;
    logo.src = '/logo.png';
  });
  
  const lw = STORY_CONFIG.logoWidth;
  const lh = (logo.height / logo.width) * lw || 80;
  ctx.drawImage(logo, STORY_CONFIG.width - lw - 40, STORY_CONFIG.height - lh - 40, lw, lh);
};

/**
 * Add text content to story canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} instagramHandle - Instagram handle to display
 */
const addStoryText = (ctx, instagramHandle) => {
  ctx.fillStyle = STORY_CONFIG.text.color;
  ctx.textAlign = 'center';
  
  // Title text
  ctx.font = STORY_CONFIG.text.titleFont;
  ctx.fillText(STORY_CONFIG.text.title, STORY_CONFIG.width / 2, 120);
  ctx.fillText(STORY_CONFIG.text.subtitle, STORY_CONFIG.width / 2, 180);
  
  // Instagram handle
  ctx.font = STORY_CONFIG.text.subtitleFont;
  ctx.fillText(instagramHandle, STORY_CONFIG.width / 2, STORY_CONFIG.height - 120);
  
  // Survey URL
  const surveyUrl = window.location.origin;
  ctx.font = STORY_CONFIG.text.urlFont;
  ctx.fillText(surveyUrl, STORY_CONFIG.width / 2, STORY_CONFIG.height - 60);
};

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
  const { deck, setDeck, loadDesigns, resetDeck, total } = useDeck();
  const { showTutorial, tutorialDir, setShowTutorial } = useTutorial(deck !== null);
  const { feedbacks, addFeedback } = useSwipeFeedback();
  const { history, addToHistory, undo: undoHistory, clearHistory } = useSwipeHistory();
  const instagramHandle = config.brand?.instagram || '@noemi';
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

  const handleShare = useCallback(async () => {
    if (!current) return;
    
    try {
      const { ctx, story } = createStoryCanvas();
      
      await drawScaledImage(ctx, current.image_url, STORY_CONFIG.maxImageSize, STORY_CONFIG.imageY);
      await drawLogo(ctx);
      addStoryText(ctx, instagramHandle);

      const blob = await new Promise((resolve) => story.toBlob(resolve, 'image/png'));
      if (navigator.share && blob) {
        const file = new File([blob], 'story.png', { type: 'image/png' });
        await navigator.share({ files: [file], title: 'NOEMI design', text: 'Check this out' });
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  }, [current, instagramHandle]);

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

  return (
    <div className="swipe-game">
      <h2 className="sg-title">{config.swipe_ritual.title}</h2>
      <p className="sg-instructions">Swipe right to like, left to dislike, up to love, down if unsure. You can undo the last swipe.</p>
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

        <button
          type="button"
          aria-label="Share to Instagram"
          className="instagram-share-btn"
          onClick={handleShare}
        >
          IG
        </button>

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