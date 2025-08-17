/**
 * Custom hooks for managing swipe game state and behavior.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  ASSET_PATHS,
  SWIPE_DIRECTIONS,
  TUTORIAL_TIMING,
  FEEDBACK_TIMING,
} from '../constants.js';
import { delay } from '../utils/common.js';

/**
 * Hook for managing the deck of cards and loading state.
 * @returns {Object} Object containing deck state and loading functions
 */
export function useDeck() {
  const [deck, setDeck] = useState(null);
  const [initialDeck, setInitialDeck] = useState([]);

  const loadDesigns = useCallback(async () => {
    try {
      const res = await fetch(ASSET_PATHS.DESIGNS_INDEX);
      const data = await res.json();
      setDeck(data);
      setInitialDeck(data);
      return data;
    } catch (err) {
      console.error('Failed to load designs', err);
      setDeck([]);
      return [];
    }
  }, []);

  const resetDeck = useCallback(() => {
    setDeck(initialDeck);
  }, [initialDeck]);

  return {
    deck,
    setDeck,
    initialDeck,
    loadDesigns,
    resetDeck,
    total: initialDeck.length,
  };
}

/**
 * Hook for managing tutorial state and animation.
 * @param {boolean} shouldShowTutorial - Whether to show the tutorial
 * @returns {Object} Object containing tutorial state and controls
 */
export function useTutorial(shouldShowTutorial) {
  const [showTutorial, setShowTutorial] = useState(shouldShowTutorial);
  const [tutorialCardIndex, setTutorialCardIndex] = useState(0);
  const [tutorialDir, setTutorialDir] = useState(null);

  const handleTutorialSwipe = useCallback(() => {
    if (tutorialCardIndex < 4) {
      // Move to next tutorial card
      setTutorialCardIndex(prev => prev + 1);
    } else {
      // End tutorial and start game
      setShowTutorial(false);
      setTutorialCardIndex(0);
    }
  }, [tutorialCardIndex]);

  useEffect(() => {
    if (!shouldShowTutorial || !showTutorial) {
      setTutorialDir(null);
      return;
    }

    let cancelled = false;

    async function runTutorialAnimation() {
      // For welcome card (index 0), show up animation
      if (tutorialCardIndex === 0) {
        await delay(1000); // Initial pause
        if (!cancelled && showTutorial) {
          setTutorialDir(SWIPE_DIRECTIONS.UP);
          await delay(TUTORIAL_TIMING.DIRECTION_DISPLAY_MS);
          if (!cancelled && showTutorial) {
            setTutorialDir(null);
            await delay(TUTORIAL_TIMING.DIRECTION_PAUSE_MS);
          }
        }
        return;
      }

      // For instruction cards, show the specific direction
      const directions = [
        null, // welcome card
        SWIPE_DIRECTIONS.RIGHT, // card_one: "Swipe right to like"
        SWIPE_DIRECTIONS.LEFT,  // card_two: "Swipe left to dislike"  
        SWIPE_DIRECTIONS.UP,    // card_three: "Swipe up to love"
        SWIPE_DIRECTIONS.DOWN   // card_four: "Swipe down for not sure"
      ];

      const targetDirection = directions[tutorialCardIndex];
      if (targetDirection && !cancelled && showTutorial) {
        await delay(800); // Pause before showing motion hint
        if (!cancelled && showTutorial) {
          setTutorialDir(targetDirection);
          await delay(TUTORIAL_TIMING.DIRECTION_DISPLAY_MS * 2); // Longer display for instruction cards
          if (!cancelled && showTutorial) {
            setTutorialDir(null);
            await delay(TUTORIAL_TIMING.DIRECTION_PAUSE_MS);
          }
        }
      }
    }

    runTutorialAnimation();

    return () => {
      cancelled = true;
    };
  }, [shouldShowTutorial, showTutorial, tutorialCardIndex]);

  return {
    showTutorial,
    tutorialCardIndex,
    tutorialDir,
    setShowTutorial,
    handleTutorialSwipe,
  };
}

/**
 * Hook for managing swipe feedback animations.
 * @returns {Object} Object containing feedback state and functions
 */
export function useSwipeFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);

  const addFeedback = useCallback(
    (icon, duration = FEEDBACK_TIMING.DISPLAY_DURATION_MS) => {
      const id = Date.now();
      setFeedbacks((prev) => [...prev, { icon, id }]);
      setTimeout(() => {
        setFeedbacks((prev) => prev.filter((f) => f.id !== id));
      }, duration);
    },
    []
  );

  return {
    feedbacks,
    addFeedback,
  };
}
