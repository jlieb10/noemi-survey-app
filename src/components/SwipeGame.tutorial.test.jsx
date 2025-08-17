import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SwipeGame from './SwipeGame.jsx';

// Mock the hooks to control tutorial state
vi.mock('../hooks/useSwipeGame.js', () => ({
  useDeck: () => ({
    deck: [{ id: 'test-design', image_url: '/test-image.jpg' }],
    setDeck: vi.fn(),
    loadDesigns: vi.fn(),
    resetDeck: vi.fn(),
    total: 1,
  }),
  useTutorial: () => ({
    showTutorial: true,
    tutorialCardIndex: 0,
    tutorialDir: null,
    setShowTutorial: vi.fn(),
    handleTutorialSwipe: vi.fn(),
  }),
  useSwipeFeedback: () => ({
    feedbacks: [],
    addFeedback: vi.fn(),
  }),
}));

describe('SwipeGame Tutorial', () => {
  it('displays tutorial welcome text from config', () => {
    render(<SwipeGame participantId="test-participant" />);
    
    // Should display the tutorial welcome text from the config
    expect(screen.getByText(/Welcome to the NOEMI Brand Exploration game/i)).toBeInTheDocument();
    expect(screen.getByText(/Continue by swiping this card up/i)).toBeInTheDocument();
  });

  it('shows tutorial content overlay on the card', () => {
    render(<SwipeGame participantId="test-participant" />);
    
    // Should have tutorial content container
    const tutorialContent = document.querySelector('.tutorial-content');
    expect(tutorialContent).toBeInTheDocument();
    
    // Should have tutorial text element
    const tutorialText = document.querySelector('.tutorial-text');
    expect(tutorialText).toBeInTheDocument();
  });

  it('displays tutorial without game title for cleaner mobile experience', () => {
    render(<SwipeGame participantId="test-participant" />);
    
    // Should NOT display the title anymore for minimal mobile design
    expect(screen.queryByText('NOEMI Brand Exploration')).not.toBeInTheDocument();
    
    // Should still have the tutorial content
    expect(screen.getByText(/Welcome to the NOEMI Brand Exploration game/i)).toBeInTheDocument();
  });
});