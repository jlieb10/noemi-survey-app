import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the config
vi.mock('../../docs/noemi-survey-config.json', () => ({
  default: {
    survey: { meta: { end_cta: "Continue" } },
    questions: [
      {
        "id": "q1",
        "title": "All About You", 
        "type": "group",
        "sub_questions": [
          {
            "id": "q1d",
            "label": "Email for exclusive offers and insights",
            "type": "email",
            "marketing_consent": {
              "default_checked": true,
              "tooltip": "We'll only send you NOEMI news and offers. You can unsubscribe anytime."
            },
            "required": false
          }
        ]
      },
      {
        "id": "q2",
        "type": "single_select",
        "prompt": "Next question",
        "options": [{"id": "option1", "label": "Option 1"}]
      }
    ]
  }
}));

// Mock analytics and services
vi.mock('../services/analytics.js', () => ({
  onSurveyStart: vi.fn(),
  onQuestionAnswered: vi.fn(),
  onSurveyComplete: vi.fn(),
}));

vi.mock('../utils/geolocation.js', () => ({
  getCachedUserLocation: vi.fn().mockResolvedValue({}),
}));

vi.mock('../services/supabaseClient.js', () => ({
  supabase: null
}));

vi.mock('../constants.js', () => ({
  DEFAULT_PARTICIPANT_IDS: {
    LOCAL_TEST: 'local-test',
  },
  SURVEY_CONSTANTS: {
    GATE_QUESTION_ID: 'q1d',
  },
  ASSET_PATHS: {
    FALLBACK_IMAGE: '/vite.svg',
  },
}));

vi.mock('../utils/common.js', () => ({
  handleImageError: vi.fn(),
}));

import Survey from './Survey.jsx';

describe('Survey Q1 Validation', () => {
  const mockOnComplete = vi.fn();
  let user;

  beforeEach(() => {
    cleanup();
    // Clear localStorage to prevent autosaved data from affecting tests
    localStorage.clear();
    user = userEvent.setup();
    mockOnComplete.mockClear();
  });

  describe('Email and consent validation', () => {
    it('should show error when email is missing and user tries to proceed', async () => {
      render(<Survey onComplete={mockOnComplete} />);
      
      // Try to click Next without providing email
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);
      
      // Should show validation error for missing email
      expect(screen.getByText('Please provide your email to continue.')).toBeInTheDocument();
      
      // Should not advance to next question (still on Q1)
      expect(screen.getByRole('heading', { level: 2, name: 'All About You' })).toBeInTheDocument();
    });

    it('should show error when consent is not granted and user tries to proceed', async () => {
      render(<Survey onComplete={mockOnComplete} />);
      
      // Fill email but uncheck consent
      const emailInput = screen.getByLabelText(/email for exclusive offers/i);
      await user.type(emailInput, 'test@example.com');
      
      const consentCheckbox = screen.getByRole('checkbox', { name: /i agree to receive marketing communications/i });
      await user.click(consentCheckbox); // Uncheck it
      
      // Try to proceed
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);
      
      // Should show validation error for missing consent
      expect(screen.getByText('Please provide consent for marketing communications to continue.')).toBeInTheDocument();
      
      // Should not advance to next question (still on Q1)
      expect(screen.getByRole('heading', { level: 2, name: 'All About You' })).toBeInTheDocument();
    });

    it('should show error when both email and consent are missing', async () => {
      render(<Survey onComplete={mockOnComplete} />);
      
      // Uncheck consent (email is already empty)
      const consentCheckbox = screen.getByRole('checkbox', { name: /i agree to receive marketing communications/i });
      await user.click(consentCheckbox);
      
      // Try to proceed
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);
      
      // Should show validation error for both
      expect(screen.getByText('Please provide your email and consent for marketing communications to continue.')).toBeInTheDocument();
      
      // Should not advance to next question (still on Q1)
      expect(screen.getByRole('heading', { level: 2, name: 'All About You' })).toBeInTheDocument();
    });

    it('should proceed when both email and consent are provided', async () => {
      render(<Survey onComplete={mockOnComplete} />);
      
      // Fill email (consent is checked by default)
      const emailInput = screen.getByLabelText(/email for exclusive offers/i);
      await user.type(emailInput, 'test@example.com');
      
      // Try to proceed
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);
      
      // Should not show validation error
      expect(screen.queryByText(/please provide.*to continue/i)).not.toBeInTheDocument();
      
      // Should advance to next question
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2, name: 'Next question' })).toBeInTheDocument();
      });
    });

    it('should clear validation error when user fixes the email field', async () => {
      render(<Survey onComplete={mockOnComplete} />);
      
      // Try to proceed without email to trigger error
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);
      
      // Verify error is shown
      expect(screen.getByText('Please provide your email to continue.')).toBeInTheDocument();
      
      // Fill in email
      const emailInput = screen.getByLabelText(/email for exclusive offers/i);
      await user.type(emailInput, 'test@example.com');
      
      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Please provide your email to continue.')).not.toBeInTheDocument();
      });
    });

    it('should clear validation error when user fixes the consent field', async () => {
      render(<Survey onComplete={mockOnComplete} />);
      
      // Fill email but uncheck consent
      const emailInput = screen.getByLabelText(/email for exclusive offers/i);
      await user.type(emailInput, 'test@example.com');
      
      const consentCheckbox = screen.getByRole('checkbox', { name: /i agree to receive marketing communications/i });
      await user.click(consentCheckbox); // Uncheck it
      
      // Try to proceed to trigger error
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);
      
      // Verify error is shown
      expect(screen.getByText('Please provide consent for marketing communications to continue.')).toBeInTheDocument();
      
      // Re-check consent
      await user.click(consentCheckbox);
      
      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Please provide consent for marketing communications to continue.')).not.toBeInTheDocument();
      });
    });
  });
});