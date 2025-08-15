import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock the config
vi.mock('../../docs/noemi-survey-config.json', () => ({
  default: {
    survey: { meta: { end_cta: 'Continue' } },
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
            required: true,
          },
        ],
      },
    ],
  },
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
  supabase: null,
}));

import Survey from './Survey.jsx';

describe('Survey Component - Basic Functionality', () => {
  const mockOnComplete = vi.fn();

  it('renders grouped question structure', () => {
    render(<Survey onComplete={mockOnComplete} />);

    // Check that the grouped question renders
    expect(screen.getAllByText('All About You')[0]).toBeInTheDocument();
    expect(screen.getByText('Your name')).toBeInTheDocument();
  });
});
