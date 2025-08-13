import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { expect, test, vi, beforeEach, describe } from 'vitest';
import '@testing-library/jest-dom/vitest';
import Survey from './Survey.jsx';

// Mock the config
vi.mock('../../docs/noemi-survey-config.json', () => ({
  default: {
    questions: [
      {
        id: 'Q1',
        type: 'single_select',
        prompt: 'Which best describes you today?',
        options: [
          { id: 'woman', label: 'Woman' },
          { id: 'man', label: 'Man' }
        ]
      },
      {
        id: 'Q2',
        type: 'single_select',
        prompt: 'How are you feeling?',
        options: [
          { id: 'good', label: 'Good' },
          { id: 'bad', label: 'Bad' }
        ]
      }
    ],
    survey: {
      meta: {
        end_cta: 'Submit'
      }
    }
  }
}));

// Mock other dependencies
vi.mock('../services/supabaseClient.js', () => ({
  supabase: null
}));

vi.mock('../services/analytics.js', () => ({
  onSurveyStart: vi.fn(),
  onQuestionAnswered: vi.fn(),
  onSurveyComplete: vi.fn()
}));

vi.mock('../utils/geolocation.js', () => ({
  getCachedUserLocation: vi.fn().mockResolvedValue(null)
}));

describe('Survey', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  test('first question shows disabled back link and single Next button', () => {
    render(<Survey onComplete={vi.fn()} />);
    
    // Should have a disabled back link
    const backLink = screen.getByRole('button', { name: /go back/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('aria-disabled', 'true');
    
    // Should have exactly one primary action button (Next)
    const nextButton = screen.getByRole('button', { name: 'Next' });
    expect(nextButton).toBeInTheDocument();
    
    // Should NOT have a Skip button
    expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument();
    
    // Should have exactly 2 buttons total (back link + next button)
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });

  test('second question shows enabled back link and single Submit button', () => {
    const mockOnComplete = vi.fn();
    render(<Survey onComplete={mockOnComplete} />);
    
    // Answer first question and go to next
    fireEvent.click(screen.getByRole('radio', { name: 'Woman' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    
    // Should have an enabled back link
    const backLink = screen.getByRole('button', { name: /go back/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('aria-disabled', 'false');
    
    // Should have exactly one primary action button (Submit - since it's the last question)
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    expect(submitButton).toBeInTheDocument();
    
    // Should NOT have a Skip button
    expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument();
    
    // Should have exactly 2 buttons total (back link + submit button)
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });

  test('back link functionality works correctly', () => {
    const mockOnComplete = vi.fn();
    render(<Survey onComplete={mockOnComplete} />);
    
    // Answer first question and go to next
    fireEvent.click(screen.getByRole('radio', { name: 'Woman' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    
    // Should be on question 2 (use heading since it's unique)
    expect(screen.getByRole('heading', { name: 'How are you feeling?' })).toBeInTheDocument();
    
    // Click back link
    const backLink = screen.getByRole('button', { name: /go back/i });
    fireEvent.click(backLink);
    
    // Should be back on question 1
    expect(screen.getByRole('heading', { name: 'Which best describes you today?' })).toBeInTheDocument();
    
    // Previous answer should be preserved
    expect(screen.getByRole('radio', { name: 'Woman' })).toBeChecked();
  });
});