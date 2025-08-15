/**
 * Unit tests for analytics service.
 *
 * These tests verify that analytics events are properly logged and structured.
 * Since this is currently a placeholder implementation, tests focus on ensuring
 * proper function signatures and console output. When replacing with a real
 * analytics provider, update tests to verify actual integration calls.
 *
 * @testSuite services/analytics
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  onSurveyStart,
  onQuestionAnswered,
  onSurveyComplete,
  onGameStart,
  onSwipe,
} from './analytics.js';

describe('Analytics Service', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('onSurveyStart', () => {
    it('should log survey start event', () => {
      onSurveyStart();

      expect(consoleSpy).toHaveBeenCalledWith('Analytics: survey_start');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('should be callable multiple times', () => {
      onSurveyStart();
      onSurveyStart();
      onSurveyStart();

      expect(consoleSpy).toHaveBeenCalledTimes(3);
      expect(consoleSpy).toHaveBeenNthCalledWith(1, 'Analytics: survey_start');
      expect(consoleSpy).toHaveBeenNthCalledWith(2, 'Analytics: survey_start');
      expect(consoleSpy).toHaveBeenNthCalledWith(3, 'Analytics: survey_start');
    });
  });

  describe('onQuestionAnswered', () => {
    it('should log question answered event with correct parameters', () => {
      const questionId = 'q1_wellness_goal';
      const answer = 'stress_relief';

      onQuestionAnswered(questionId, answer);

      expect(consoleSpy).toHaveBeenCalledWith('Analytics: question_answered', {
        questionId,
        answer,
      });
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle different answer types', () => {
      // String answer
      onQuestionAnswered('q1', 'string_answer');
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        'Analytics: question_answered',
        { questionId: 'q1', answer: 'string_answer' }
      );

      // Array answer (multi-select)
      onQuestionAnswered('q2', ['option1', 'option2']);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        2,
        'Analytics: question_answered',
        { questionId: 'q2', answer: ['option1', 'option2'] }
      );

      // Number answer (scale)
      onQuestionAnswered('q3', 7);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        3,
        'Analytics: question_answered',
        { questionId: 'q3', answer: 7 }
      );

      // Object answer (gate question)
      onQuestionAnswered('q4', { join: 'yes', email: 'test@example.com' });
      expect(consoleSpy).toHaveBeenNthCalledWith(
        4,
        'Analytics: question_answered',
        {
          questionId: 'q4',
          answer: { join: 'yes', email: 'test@example.com' },
        }
      );

      expect(consoleSpy).toHaveBeenCalledTimes(4);
    });

    it('should handle null and undefined answers', () => {
      onQuestionAnswered('q1', null);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        'Analytics: question_answered',
        { questionId: 'q1', answer: null }
      );

      onQuestionAnswered('q2', undefined);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        2,
        'Analytics: question_answered',
        { questionId: 'q2', answer: undefined }
      );

      expect(consoleSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle empty string question IDs', () => {
      onQuestionAnswered('', 'answer');

      expect(consoleSpy).toHaveBeenCalledWith('Analytics: question_answered', {
        questionId: '',
        answer: 'answer',
      });
    });
  });

  describe('onSurveyComplete', () => {
    it('should log survey complete event with participant ID', () => {
      const participantId = 'participant_123';

      onSurveyComplete(participantId);

      expect(consoleSpy).toHaveBeenCalledWith('Analytics: survey_complete', {
        participantId,
      });
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle different participant ID formats', () => {
      // UUID format
      onSurveyComplete('550e8400-e29b-41d4-a716-446655440000');
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        'Analytics: survey_complete',
        { participantId: '550e8400-e29b-41d4-a716-446655440000' }
      );

      // Numeric ID
      onSurveyComplete('12345');
      expect(consoleSpy).toHaveBeenNthCalledWith(
        2,
        'Analytics: survey_complete',
        { participantId: '12345' }
      );

      // Test constant
      onSurveyComplete('LOCAL_TEST');
      expect(consoleSpy).toHaveBeenNthCalledWith(
        3,
        'Analytics: survey_complete',
        { participantId: 'LOCAL_TEST' }
      );

      expect(consoleSpy).toHaveBeenCalledTimes(3);
    });

    it('should handle null participant ID', () => {
      onSurveyComplete(null);

      expect(consoleSpy).toHaveBeenCalledWith('Analytics: survey_complete', {
        participantId: null,
      });
    });
  });

  describe('onGameStart', () => {
    it('should log game start event with participant ID', () => {
      const participantId = 'participant_456';

      onGameStart(participantId);

      expect(consoleSpy).toHaveBeenCalledWith('Analytics: game_start', {
        participantId,
      });
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle different participant ID types', () => {
      onGameStart('string_id');
      onGameStart(123);
      onGameStart(null);

      expect(consoleSpy).toHaveBeenNthCalledWith(1, 'Analytics: game_start', {
        participantId: 'string_id',
      });
      expect(consoleSpy).toHaveBeenNthCalledWith(2, 'Analytics: game_start', {
        participantId: 123,
      });
      expect(consoleSpy).toHaveBeenNthCalledWith(3, 'Analytics: game_start', {
        participantId: null,
      });

      expect(consoleSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('onSwipe', () => {
    it('should log swipe event with all required parameters', () => {
      const participantId = 'participant_789';
      const cardId = 'card_123';
      const choice = 'like';

      onSwipe(participantId, cardId, choice);

      expect(consoleSpy).toHaveBeenCalledWith('Analytics: swipe', {
        participantId,
        cardId,
        choice,
      });
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle all valid choice types', () => {
      const participantId = 'test_participant';
      const cardId = 'test_card';

      const validChoices = ['like', 'dislike', 'love', 'not_sure'];

      validChoices.forEach((choice, index) => {
        onSwipe(participantId, cardId, choice);
        expect(consoleSpy).toHaveBeenNthCalledWith(
          index + 1,
          'Analytics: swipe',
          { participantId, cardId, choice }
        );
      });

      expect(consoleSpy).toHaveBeenCalledTimes(4);
    });

    it('should handle different card ID formats', () => {
      // UUID format
      onSwipe('p1', '550e8400-e29b-41d4-a716-446655440000', 'like');

      // Simple string
      onSwipe('p1', 'card_001', 'dislike');

      // Numeric string
      onSwipe('p1', '42', 'love');

      expect(consoleSpy).toHaveBeenCalledTimes(3);
      expect(consoleSpy).toHaveBeenNthCalledWith(1, 'Analytics: swipe', {
        participantId: 'p1',
        cardId: '550e8400-e29b-41d4-a716-446655440000',
        choice: 'like',
      });
      expect(consoleSpy).toHaveBeenNthCalledWith(2, 'Analytics: swipe', {
        participantId: 'p1',
        cardId: 'card_001',
        choice: 'dislike',
      });
      expect(consoleSpy).toHaveBeenNthCalledWith(3, 'Analytics: swipe', {
        participantId: 'p1',
        cardId: '42',
        choice: 'love',
      });
    });

    it('should handle null and undefined parameters', () => {
      onSwipe(null, 'card_1', 'like');
      onSwipe('participant_1', null, 'dislike');
      onSwipe('participant_1', 'card_1', null);
      onSwipe(undefined, undefined, undefined);

      expect(consoleSpy).toHaveBeenCalledTimes(4);
      expect(consoleSpy).toHaveBeenNthCalledWith(1, 'Analytics: swipe', {
        participantId: null,
        cardId: 'card_1',
        choice: 'like',
      });
      expect(consoleSpy).toHaveBeenNthCalledWith(4, 'Analytics: swipe', {
        participantId: undefined,
        cardId: undefined,
        choice: undefined,
      });
    });

    it('should handle invalid choice values without error', () => {
      // The function should still log even with invalid choices
      onSwipe('p1', 'c1', 'invalid_choice');
      onSwipe('p1', 'c1', '');
      onSwipe('p1', 'c1', 123);

      expect(consoleSpy).toHaveBeenCalledTimes(3);
      expect(consoleSpy).toHaveBeenNthCalledWith(1, 'Analytics: swipe', {
        participantId: 'p1',
        cardId: 'c1',
        choice: 'invalid_choice',
      });
      expect(consoleSpy).toHaveBeenNthCalledWith(2, 'Analytics: swipe', {
        participantId: 'p1',
        cardId: 'c1',
        choice: '',
      });
      expect(consoleSpy).toHaveBeenNthCalledWith(3, 'Analytics: swipe', {
        participantId: 'p1',
        cardId: 'c1',
        choice: 123,
      });
    });
  });

  describe('Function signatures and exports', () => {
    it('should export all required functions', () => {
      expect(typeof onSurveyStart).toBe('function');
      expect(typeof onQuestionAnswered).toBe('function');
      expect(typeof onSurveyComplete).toBe('function');
      expect(typeof onGameStart).toBe('function');
      expect(typeof onSwipe).toBe('function');
    });

    it('should have correct function arity (parameter count)', () => {
      expect(onSurveyStart.length).toBe(0);
      expect(onQuestionAnswered.length).toBe(2);
      expect(onSurveyComplete.length).toBe(1);
      expect(onGameStart.length).toBe(1);
      expect(onSwipe.length).toBe(3);
    });
  });
});
