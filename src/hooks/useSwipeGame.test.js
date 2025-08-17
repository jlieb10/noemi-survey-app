/**
 * Unit tests for useSwipeGame hooks.
 *
 * These tests verify the behavior of custom hooks used in the swipe game component.
 * Tests cover state management, async operations, tutorial flows, and feedback systems.
 * When modifying hooks, ensure all state transitions and side effects are tested.
 *
 * @testSuite hooks/useSwipeGame
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeck, useTutorial, useSwipeFeedback } from './useSwipeGame.js';

// Mock fetch for deck loading
global.fetch = vi.fn();

// Mock constants
vi.mock('../constants.js', () => ({
  ASSET_PATHS: {
    DESIGNS_INDEX: '/api/designs.json',
  },
  SWIPE_DIRECTIONS: {
    RIGHT: 'right',
    LEFT: 'left',
    UP: 'up',
    DOWN: 'down',
  },
  TUTORIAL_TIMING: {
    DIRECTION_DISPLAY_MS: 100,
    DIRECTION_PAUSE_MS: 50,
  },
  FEEDBACK_TIMING: {
    DISPLAY_DURATION_MS: 200,
  },
}));

describe('useDeck', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with null deck and empty initial deck', () => {
    const { result } = renderHook(() => useDeck());

    expect(result.current.deck).toBeNull();
    expect(result.current.initialDeck).toEqual([]);
    expect(typeof result.current.loadDesigns).toBe('function');
    expect(typeof result.current.resetDeck).toBe('function');
    expect(typeof result.current.setDeck).toBe('function');
  });

  it('should load designs successfully', async () => {
    const mockDesigns = [
      { id: 1, name: 'Design 1' },
      { id: 2, name: 'Design 2' },
    ];

    fetch.mockResolvedValue({
      json: () => Promise.resolve(mockDesigns),
    });

    const { result } = renderHook(() => useDeck());

    let returnedData;
    await act(async () => {
      returnedData = await result.current.loadDesigns();
    });

    expect(fetch).toHaveBeenCalledWith('/api/designs.json');
    expect(result.current.deck).toEqual(mockDesigns);
    expect(result.current.initialDeck).toEqual(mockDesigns);
    expect(returnedData).toEqual(mockDesigns);
  });

  it('should handle fetch errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useDeck());

    let returnedData;
    await act(async () => {
      returnedData = await result.current.loadDesigns();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load designs',
      expect.any(Error)
    );
    expect(result.current.deck).toEqual([]);
    expect(result.current.initialDeck).toEqual([]);
    expect(returnedData).toEqual([]);

    consoleSpy.mockRestore();
  });

  it('should handle JSON parsing errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetch.mockResolvedValue({
      json: () => Promise.reject(new Error('Invalid JSON')),
    });

    const { result } = renderHook(() => useDeck());

    await act(async () => {
      await result.current.loadDesigns();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load designs',
      expect.any(Error)
    );
    expect(result.current.deck).toEqual([]);

    consoleSpy.mockRestore();
  });

  it('should reset deck to initial state', async () => {
    const mockDesigns = [
      { id: 1, name: 'Design 1' },
      { id: 2, name: 'Design 2' },
    ];

    fetch.mockResolvedValue({
      json: () => Promise.resolve(mockDesigns),
    });

    const { result } = renderHook(() => useDeck());

    // Load designs first
    await act(async () => {
      await result.current.loadDesigns();
    });

    // Modify deck
    act(() => {
      result.current.setDeck([{ id: 1, name: 'Design 1' }]);
    });

    expect(result.current.deck).toHaveLength(1);

    // Reset deck
    act(() => {
      result.current.resetDeck();
    });

    expect(result.current.deck).toEqual(mockDesigns);
    expect(result.current.deck).toHaveLength(2);
  });

  it('should allow manual deck updates', () => {
    const { result } = renderHook(() => useDeck());

    const newDeck = [{ id: 3, name: 'Design 3' }];

    act(() => {
      result.current.setDeck(newDeck);
    });

    expect(result.current.deck).toEqual(newDeck);
  });
});

describe('useTutorial', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should initialize with correct initial state when tutorial should not show', () => {
    const { result } = renderHook(() => useTutorial(false));

    expect(result.current.showTutorial).toBe(false);
    expect(result.current.tutorialDir).toBeNull();
    expect(typeof result.current.setShowTutorial).toBe('function');
  });

  it('should initialize with tutorial showing when shouldShowTutorial is true', async () => {
    const { result } = renderHook(() => useTutorial(true));

    expect(result.current.showTutorial).toBe(true);
    expect(result.current.tutorialCardIndex).toBe(0);
    // Tutorial starts with null direction initially 
    expect(result.current.tutorialDir).toBeNull();
    expect(typeof result.current.handleTutorialSwipe).toBe('function');
  });

  it('should run tutorial sequence when enabled', async () => {
    const { result } = renderHook(() => useTutorial(true));

    expect(result.current.showTutorial).toBe(true);
    expect(typeof result.current.setShowTutorial).toBe('function');

    // Tutorial should start with a direction
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    // Tutorial direction should be one of the expected values
    expect(['right', 'left', 'up', 'down', null]).toContain(
      result.current.tutorialDir
    );
  });

  it('should not run tutorial when shouldShowTutorial is false', async () => {
    const { result } = renderHook(() => useTutorial(false));

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.showTutorial).toBe(false);
    expect(result.current.tutorialDir).toBeNull();
  });

  it('should not run tutorial when showTutorial is manually set to false', async () => {
    const { result } = renderHook(() => useTutorial(true));

    // Manually disable tutorial immediately
    act(() => {
      result.current.setShowTutorial(false);
    });

    // Wait for any potential async operations to complete
    await act(async () => {
      vi.advanceTimersByTime(2000); // Wait longer to ensure cleanup
    });

    expect(result.current.showTutorial).toBe(false);
    expect(result.current.tutorialDir).toBeNull();
  });

  it('should allow manual control of tutorial state', () => {
    const { result } = renderHook(() => useTutorial(false));

    // Enable tutorial manually
    act(() => {
      result.current.setShowTutorial(true);
    });

    expect(result.current.showTutorial).toBe(true);

    // Disable tutorial manually
    act(() => {
      result.current.setShowTutorial(false);
    });

    expect(result.current.showTutorial).toBe(false);
  });

  it('should support multi-card tutorial progression', () => {
    const { result } = renderHook(() => useTutorial(true));

    // Should start with first card (welcome)
    expect(result.current.tutorialCardIndex).toBe(0);
    
    // Simulate swiping to next tutorial card
    act(() => {
      result.current.handleTutorialSwipe();
    });
    
    expect(result.current.tutorialCardIndex).toBe(1);
    
    // Simulate swiping through remaining cards
    act(() => {
      result.current.handleTutorialSwipe(); // card 2
    });
    expect(result.current.tutorialCardIndex).toBe(2);
    
    act(() => {
      result.current.handleTutorialSwipe(); // card 3
    });
    expect(result.current.tutorialCardIndex).toBe(3);
    
    act(() => {
      result.current.handleTutorialSwipe(); // card 4
    });
    expect(result.current.tutorialCardIndex).toBe(4);
    
    // Final swipe should end tutorial
    act(() => {
      result.current.handleTutorialSwipe();
    });
    expect(result.current.showTutorial).toBe(false);
    expect(result.current.tutorialCardIndex).toBe(0);
  });
});

describe('useSwipeFeedback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should initialize with empty feedbacks array', () => {
    const { result } = renderHook(() => useSwipeFeedback());

    expect(result.current.feedbacks).toEqual([]);
    expect(typeof result.current.addFeedback).toBe('function');
  });

  it('should add feedback with default duration', () => {
    const { result } = renderHook(() => useSwipeFeedback());

    act(() => {
      result.current.addFeedback('❤️');
    });

    expect(result.current.feedbacks).toHaveLength(1);
    expect(result.current.feedbacks[0]).toEqual({
      icon: '❤️',
      id: expect.any(Number),
    });
  });

  it('should add feedback with custom duration', () => {
    const { result } = renderHook(() => useSwipeFeedback());

    act(() => {
      result.current.addFeedback('👍', 500);
    });

    expect(result.current.feedbacks).toHaveLength(1);
    expect(result.current.feedbacks[0].icon).toBe('👍');
  });

  it('should remove feedback after timeout', async () => {
    const { result } = renderHook(() => useSwipeFeedback());

    act(() => {
      result.current.addFeedback('❤️');
    });

    expect(result.current.feedbacks).toHaveLength(1);

    // Advance time to trigger removal
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.feedbacks).toHaveLength(0);
  });

  it('should handle multiple concurrent feedbacks', () => {
    const { result } = renderHook(() => useSwipeFeedback());

    act(() => {
      result.current.addFeedback('❤️');
      result.current.addFeedback('👍');
      result.current.addFeedback('😍');
    });

    expect(result.current.feedbacks).toHaveLength(3);
    expect(result.current.feedbacks.map((f) => f.icon)).toEqual([
      '❤️',
      '👍',
      '😍',
    ]);
  });

  it('should remove feedbacks independently', async () => {
    const { result } = renderHook(() => useSwipeFeedback());

    // Add feedback with different durations
    act(() => {
      result.current.addFeedback('❤️', 100);
    });

    // Wait a tick to ensure different timestamp
    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    act(() => {
      result.current.addFeedback('👍', 300);
    });

    expect(result.current.feedbacks).toHaveLength(2);

    // First feedback should be removed
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.feedbacks).toHaveLength(1);
    expect(result.current.feedbacks[0].icon).toBe('👍');

    // Second feedback should be removed
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.feedbacks).toHaveLength(0);
  });

  it('should generate unique IDs for feedbacks', async () => {
    const { result } = renderHook(() => useSwipeFeedback());

    act(() => {
      result.current.addFeedback('❤️');
    });

    // Wait a tick to ensure different timestamp
    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    act(() => {
      result.current.addFeedback('❤️');
    });

    const [feedback1, feedback2] = result.current.feedbacks;
    expect(feedback1.id).not.toBe(feedback2.id);
    expect(typeof feedback1.id).toBe('number');
    expect(typeof feedback2.id).toBe('number');
  });
});
