import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SwipeGame from './SwipeGame.jsx';

// Mock the hooks to control tutorial state
vi.mock('../hooks/useSwipeGame.js', () => ({
  useDeck: () => ({
    deck: [{ 
      id: 'tutorial_welcome_card_0', 
      isTutorial: true,
      text: 'Welcome to the NOEMI Brand Exploration game! Swipe to help us refine what feels most NOEMI. Continue by swiping this card up.',
      requireDirection: 'up'
    }],
    setDeck: vi.fn(),
    loadDesigns: vi.fn(),
    resetDeck: vi.fn(),
    tutorialDeck: [],
    total: 1,
  }),
  useSwipeFeedback: () => ({
    feedbacks: [],
    addFeedback: vi.fn(),
  }),
  setTutorialSeen: vi.fn(),
  clearTutorialSeen: vi.fn(),
}));

describe('SwipeGame Tutorial', () => {
  it('displays tutorial welcome text from config', () => {
    render(<SwipeGame participantId="test-participant" />);
    
    // Should display the tutorial welcome text from the config
    expect(screen.getByText(/Welcome to the NOEMI Brand Exploration game/i)).toBeInTheDocument();
    expect(screen.getByText(/Continue by swiping this card up/i)).toBeInTheDocument();
  });

  it('shows tutorial content as a card', () => {
    render(<SwipeGame participantId="test-participant" />);
    
    // Should have tutorial card container
    const tutorialCard = document.querySelector('.tutorial-card');
    expect(tutorialCard).toBeInTheDocument();
    
    // Should have tutorial text content
    const tutorialContent = document.querySelector('.tutorial-card__content');
    expect(tutorialContent).toBeInTheDocument();
  });

  it('displays tutorial without game title for cleaner mobile experience', () => {
    render(<SwipeGame participantId="test-participant" />);
    
    // Should NOT display the title anymore for minimal mobile design
    expect(screen.queryByText('NOEMI Brand Exploration')).not.toBeInTheDocument();
    
    // Should still have the tutorial content
    expect(screen.getByText(/Welcome to the NOEMI Brand Exploration game/i)).toBeInTheDocument();
  });
});