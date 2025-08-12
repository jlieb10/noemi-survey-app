/**
 * Custom hooks for managing swipe game state and behavior.
 */
import { useState, useEffect, useCallback } from 'react';
import { ASSET_PATHS, SWIPE_DIRECTIONS, TUTORIAL_TIMING } from '../constants.js';
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
  };
}

/**
 * Hook for managing tutorial state and animation.
 * @param {boolean} shouldShowTutorial - Whether to show the tutorial
 * @returns {Object} Object containing tutorial state and controls
 */
export function useTutorial(shouldShowTutorial) {
  const [showTutorial, setShowTutorial] = useState(shouldShowTutorial);
  const [tutorialDir, setTutorialDir] = useState(null);

  useEffect(() => {
    if (!shouldShowTutorial || !showTutorial) return;

    async function runTutorial() {
      const sequence = [
        SWIPE_DIRECTIONS.RIGHT,
        SWIPE_DIRECTIONS.LEFT,
        SWIPE_DIRECTIONS.UP,
        SWIPE_DIRECTIONS.DOWN,
      ];
      
      for (const dir of sequence) {
        setTutorialDir(dir);
        await delay(TUTORIAL_TIMING.DIRECTION_DISPLAY_MS);
        setTutorialDir(null);
        await delay(TUTORIAL_TIMING.DIRECTION_PAUSE_MS);
      }
      setShowTutorial(false);
    }

    runTutorial();
  }, [shouldShowTutorial, showTutorial]);

  return {
    showTutorial,
    tutorialDir,
    setShowTutorial,
  };
}

/**
 * Hook for managing swipe feedback animations.
 * @returns {Object} Object containing feedback state and functions
 */
export function useSwipeFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);

  const addFeedback = useCallback((icon, duration = FEEDBACK_TIMING.DISPLAY_DURATION_MS) => {
    const id = Date.now();
    setFeedbacks((prev) => [...prev, { icon, id }]);
    setTimeout(() => {
      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
    }, duration);
  }, []);

  return {
    feedbacks,
    addFeedback,
  };
}

/**
 * Hook for managing swipe history and undo functionality.
 * @returns {Object} Object containing history state and functions
 */
export function useSwipeHistory() {
  const [history, setHistory] = useState([]);

  const addToHistory = useCallback((deck, card) => {
    setHistory((prev) => [...prev, { deck: [...deck], card }]);
  }, []);

  const undo = useCallback(() => {
    let lastEntry;
    setHistory((prev) => {
      if (!prev.length) return prev;
      lastEntry = prev[prev.length - 1];
      return prev.slice(0, -1);
    });
    return lastEntry;
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    history,
    addToHistory,
    undo,
    clearHistory,
  };
}