import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from '@testing-library/react';
import { expect, test, vi, beforeEach, describe } from 'vitest';
import '@testing-library/jest-dom/vitest';
import Survey from './Survey.jsx';

// Mock the config with realistic structure that matches the actual survey
vi.mock('../../docs/noemi-survey-config.json', () => ({
  default: {
    questions: [
      {
        id: 'q1',
        title: 'All About You',
        type: 'group',
        sub_questions: [
          {
            id: 'q1a',
            label: 'Your name',
            type: 'short_text',
            placeholder: 'First and last',
            required: false, // Changed to false to avoid HTML form validation
          },
          {
            id: 'q1c',
            label: 'How do you identify?',
            type: 'select',
            options: ['Woman', 'Man', 'Non‑binary', 'Prefer not to say'],
            required: false, // Changed to false to avoid HTML form validation
          },
          {
            id: 'q1d',
            label: 'Email for exclusive offers and insights',
            type: 'email',
            marketing_consent: {
              default_checked: true,
              tooltip:
                "We'll only send you NOEMI news and offers. You can unsubscribe anytime.",
            },
            required: false,
          },
        ],
      },
      {
        id: 'q2',
        type: 'multi_select',
        prompt: 'What do you most want from your ritual?',
        required: true,
        ui_hint: 'chips',
        max_select: 3,
        options: [
          { id: 'sleep', label: 'Deeper sleep' },
          { id: 'mood', label: 'Steadier mood' },
          { id: 'stress', label: 'Less stress' },
        ],
      },
    ],
    survey: {
      meta: {
        end_cta: 'Continue',
      },
    },
  },
}));

// Mock other dependencies
vi.mock('../services/supabaseClient.js', () => ({
  supabase: null,
}));

vi.mock('../services/analytics.js', () => ({
  onSurveyStart: vi.fn(),
  onQuestionAnswered: vi.fn(),
  onSurveyComplete: vi.fn(),
}));

vi.mock('../utils/geolocation.js', () => ({
  getCachedUserLocation: vi.fn().mockResolvedValue(null),
}));

describe('Survey', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    // Clear localStorage to prevent autosaved data from affecting tests
    localStorage.clear();
  });

  test('first question shows no back link and Next/Skip buttons', () => {
    render(<Survey onComplete={vi.fn()} />);

    // Should NOT have a back link on first question
    expect(
      screen.queryByRole('button', { name: /go back/i })
    ).not.toBeInTheDocument();

    // Should have exactly one primary action button (Next)
    const nextButton = screen.getByRole('button', { name: 'Next' });
    expect(nextButton).toBeInTheDocument();

    // Should have a Skip button
    const skipButton = screen.getByRole('button', { name: 'Skip' });
    expect(skipButton).toBeInTheDocument();

    // Should have exactly 2 buttons total (next + skip)
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);

    // Should show the group question title (use the main heading h2)
    const mainHeading = screen.getByRole('heading', {
      level: 2,
      name: 'All About You',
    });
    expect(mainHeading).toBeInTheDocument();

    // Should show the text input for name
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();

    // Should show the email input
    expect(
      screen.getByLabelText(/email for exclusive offers/i)
    ).toBeInTheDocument();
  });

  test('second question shows enabled back link and Continue/Skip buttons', async () => {
    const mockOnComplete = vi.fn();
    render(<Survey onComplete={mockOnComplete} />);

    // Fill in email to satisfy validation
    const emailInput = screen.getByLabelText(/email for exclusive offers/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    // Go to next question
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    // Wait for navigation to occur
    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          name: 'What do you most want from your ritual?',
        })
      ).toBeInTheDocument();
    });

    // Should have an enabled back link
    const backLink = screen.getByRole('button', { name: /go back/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('aria-disabled', 'false');

    // Should have exactly one primary action button (Continue - since it's the last question)
    const continueButton = screen.getByRole('button', { name: 'Continue' });
    expect(continueButton).toBeInTheDocument();

    // Should have a Skip button (it's always present)
    const skipButton = screen.getByRole('button', { name: 'Skip' });
    expect(skipButton).toBeInTheDocument();

    // Should have exactly 3 buttons total (back link + continue button + skip button)
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
  });

  test('back link functionality works correctly', async () => {
    const mockOnComplete = vi.fn();
    render(<Survey onComplete={mockOnComplete} />);

    // Should start on question 1
    expect(
      screen.getByRole('heading', { level: 2, name: 'All About You' })
    ).toBeInTheDocument();

    // Fill in email to satisfy validation
    const emailInput = screen.getByLabelText(/email for exclusive offers/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    // Go to next question
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    // Wait for navigation to question 2
    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          name: 'What do you most want from your ritual?',
        })
      ).toBeInTheDocument();
    });

    // Click back link
    const backLink = screen.getByRole('button', { name: /go back/i });
    fireEvent.click(backLink);

    // Should be back on question 1
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 2, name: 'All About You' })
      ).toBeInTheDocument();
    });

    // Previous email answer should be preserved
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
  });
});
