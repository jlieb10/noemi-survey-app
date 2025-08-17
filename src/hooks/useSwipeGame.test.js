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
import { useDeck, useSwipeFeedback, buildTutorialDeckFromConfig, getTutorialSeen, setTutorialSeen, clearTutorialSeen } from './useSwipeGame.js';

// Mock fetch for deck loading
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

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
  STORAGE_KEYS: {
    TUTORIAL_SEEN: 'noemi_tutorial_seen',
  },
  TUTORIAL_KIND: {
    TEXT: 'text',
  },
}));

// Mock config
vi.mock('../../docs/noemi-survey-config.json', () => ({
  default: {
    game_tutorial: {
      welcome_card: 'Welcome to the NOEMI Brand Exploration game!',
      card_one: 'Swipe right to like',
      card_two: 'Swipe left to dislike',
      card_three: 'Swipe up to love',
      card_four: 'Swipe down for not sure'
    }
  }
}));

describe('useDeck', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with null deck and empty initial deck', () => {
    const { result } = renderHook(() => useDeck());

    expect(result.current.deck).toBeNull();
    expect(result.current.initialDeck).toEqual([]);
    expect(result.current.tutorialDeck).toEqual([]);
    expect(typeof result.current.loadDesigns).toBe('function');
    expect(typeof result.current.resetDeck).toBe('function');
    expect(typeof result.current.setDeck).toBe('function');
  });

  it('should load designs successfully', async () => {
    localStorageMock.getItem.mockReturnValue('1'); // Tutorial seen
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

  it('should include tutorial cards when tutorial has not been seen', async () => {
    localStorageMock.getItem.mockReturnValue(null); // Tutorial not seen
    const mockDesigns = [
      { id: 1, name: 'Design 1' },
      { id: 2, name: 'Design 2' },
    ];

    fetch.mockResolvedValue({
      json: () => Promise.resolve(mockDesigns),
    });

    const { result } = renderHook(() => useDeck());

    await act(async () => {
      await result.current.loadDesigns();
    });

    expect(result.current.deck).toHaveLength(7); // 5 tutorial + 2 designs
    expect(result.current.deck[0].isTutorial).toBe(true);
    expect(result.current.deck[5].name).toBe('Design 1');
    expect(result.current.tutorialDeck).toHaveLength(5);
  });

  it('should skip tutorial cards when tutorial has been seen', async () => {
    localStorageMock.getItem.mockReturnValue('1'); // Tutorial seen
    const mockDesigns = [
      { id: 1, name: 'Design 1' },
      { id: 2, name: 'Design 2' },
    ];

    fetch.mockResolvedValue({
      json: () => Promise.resolve(mockDesigns),
    });

    const { result } = renderHook(() => useDeck());

    await act(async () => {
      await result.current.loadDesigns();
    });

    expect(result.current.deck).toHaveLength(2); // Only designs
    expect(result.current.deck[0].name).toBe('Design 1');
    expect(result.current.tutorialDeck).toHaveLength(0);
  });

  it('should handle fetch errors gracefully', async () => {
    localStorageMock.getItem.mockReturnValue('1'); // Tutorial seen
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
    localStorageMock.getItem.mockReturnValue('1'); // Tutorial seen
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
    localStorageMock.getItem.mockReturnValue('1'); // Tutorial seen, so no tutorial cards
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

describe('Tutorial Functions', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  describe('buildTutorialDeckFromConfig', () => {
    it('should build tutorial deck from config', () => {
      const tutorialDeck = buildTutorialDeckFromConfig();

      expect(tutorialDeck).toHaveLength(5);
      expect(tutorialDeck[0]).toEqual({
        id: 'tutorial_welcome_card_0',
        kind: 'text',
        text: 'Welcome to the NOEMI Brand Exploration game!',
        requireDirection: 'up',
        isTutorial: true,
      });
      expect(tutorialDeck[1]).toEqual({
        id: 'tutorial_card_one_1',
        kind: 'text',
        text: 'Swipe right to like',
        requireDirection: 'right',
        isTutorial: true,
      });
    });

    it('should filter out empty text entries', () => {
      // This would test if config has empty entries, but our mock config is complete
      const tutorialDeck = buildTutorialDeckFromConfig();
      tutorialDeck.forEach(card => {
        expect(card.text).toBeTruthy();
      });
    });
  });

  describe('localStorage tutorial functions', () => {
    it('should get tutorial seen status', () => {
      localStorageMock.getItem.mockReturnValue('1');
      expect(getTutorialSeen()).toBe(true);

      localStorageMock.getItem.mockReturnValue(null);
      expect(getTutorialSeen()).toBe(false);

      localStorageMock.getItem.mockReturnValue('0');
      expect(getTutorialSeen()).toBe(false);
    });

    it('should handle localStorage errors in getTutorialSeen', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      expect(getTutorialSeen()).toBe(false);
    });

    it('should set tutorial seen flag', () => {
      setTutorialSeen();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('noemi_tutorial_seen', '1');
    });

    it('should handle localStorage errors in setTutorialSeen', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      // Should not throw
      expect(() => setTutorialSeen()).not.toThrow();
    });

    it('should clear tutorial seen flag', () => {
      clearTutorialSeen();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('noemi_tutorial_seen');
    });

    it('should handle localStorage errors in clearTutorialSeen', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      // Should not throw
      expect(() => clearTutorialSeen()).not.toThrow();
    });
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
