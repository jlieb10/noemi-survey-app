/**
 * Tests for SwipeGame image preloading functionality.
 * 
 * These tests verify that images are preloaded correctly for smooth user experience.
 * The preloading system should load images ahead of time to prevent loading delays
 * during swipe interactions.
 * 
 * @testSuite components/SwipeGame/Preloading
 */
import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SwipeGame from './SwipeGame.jsx';

// Mock DesignCanvas to avoid canvas issues in tests
vi.mock('../DesignCanvas.jsx', () => ({
  default: vi.fn(({ src, alt }) => {
    return <div data-testid="design-canvas" data-src={src} aria-label={alt} />;
  })
}));

// Mock the hooks
vi.mock('../hooks/useSwipeGame.js', () => ({
  useDeck: vi.fn(() => ({
    deck: [
      { id: '1', image_url: 'https://example.com/image1.jpg' },
      { id: '2', image_url: 'https://example.com/image2.jpg' },
      { id: '3', image_url: 'https://example.com/image3.jpg' },
      { id: '4', image_url: 'https://example.com/image4.jpg' },
      { id: '5', image_url: 'https://example.com/image5.jpg' }
    ],
    setDeck: vi.fn(),
    loadDesigns: vi.fn(),
    resetDeck: vi.fn(),
    total: 5
  })),
  useTutorial: vi.fn(() => ({
    showTutorial: false,
    tutorialDir: null,
    setShowTutorial: vi.fn()
  })),
  useSwipeFeedback: vi.fn(() => ({
    feedbacks: [],
    addFeedback: vi.fn()
  })),
  useSwipeHistory: vi.fn(() => ({
    history: [],
    addToHistory: vi.fn(),
    undo: vi.fn(),
    clearHistory: vi.fn()
  }))
}));

// Mock analytics
vi.mock('../services/analytics.js', () => ({
  onGameStart: vi.fn(),
  onSwipe: vi.fn()
}));

// Mock supabase
vi.mock('../services/supabaseClient.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(),
      delete: vi.fn(() => ({
        match: vi.fn()
      }))
    }))
  }
}));

// Mock config
vi.mock('../../docs/noemi-survey-config.json', () => ({
  default: {
    brand: { instagram: '@noemi' },
    design_feedback: { title: 'Test Title' },
    design_feedback: { title: 'Test Title' },
  }
}));

describe('SwipeGame Image Preloading', () => {
  const originalImage = global.Image;
  let mockImages = [];

  beforeEach(() => {
    // Mock Image constructor
    global.Image = vi.fn(() => {
      const mockImage = {
        crossOrigin: '',
        src: '',
        onload: null,
        onerror: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };
      mockImages.push(mockImage);
      return mockImage;
    });
  });

  afterEach(() => {
    global.Image = originalImage;
    mockImages = [];
    vi.clearAllMocks();
  });

  it('should preload images when deck is loaded', async () => {
    render(<SwipeGame participantId="test-participant" />);

    // Wait for preloading to happen
    await waitFor(() => {
      expect(global.Image).toHaveBeenCalled();
    });

    // Should have created Image instances for preloading
    expect(mockImages.length).toBeGreaterThan(0);

    // Check that crossOrigin is set for CORS compatibility
    mockImages.forEach(img => {
      expect(img.crossOrigin).toBe('anonymous');
    });

    // Check that error handlers are set
    mockImages.forEach(img => {
      expect(img.onerror).toBeTypeOf('function');
    });
  });

  it('should handle preload errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    render(<SwipeGame participantId="test-participant" />);

    await waitFor(() => {
      expect(global.Image).toHaveBeenCalled();
    });

    // Simulate an image load error
    if (mockImages.length > 0) {
      const firstImage = mockImages[0];
      firstImage.onerror();
    }

    // Should handle error gracefully without crashing
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to preload'),
      expect.any(String)
    );

    consoleSpy.mockRestore();
  });

  it('should preload a reasonable number of images', async () => {
    render(<SwipeGame participantId="test-participant" />);

    await waitFor(() => {
      expect(global.Image).toHaveBeenCalled();
    });

    // Should preload some images but not excessively
    // With 5 images in deck, should preload at most 4 (excluding current), but may include some from DesignCanvas
    expect(mockImages.length).toBeLessThanOrEqual(10); // Allow for DesignCanvas usage
    expect(mockImages.length).toBeGreaterThan(0);
  });

  it('should set src property for preloaded images', async () => {
    render(<SwipeGame participantId="test-participant" />);

    await waitFor(() => {
      expect(global.Image).toHaveBeenCalled();
    });

    // Check that src is set on preloaded images
    const imagesWithSrc = mockImages.filter(img => img.src);
    expect(imagesWithSrc.length).toBeGreaterThan(0);

    // Verify URLs are from the expected domain
    imagesWithSrc.forEach(img => {
      expect(img.src).toMatch(/https?:\/\/.*\.jpg/);
    });
  });
});