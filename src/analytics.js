/*
 * Placeholder analytics hooks. In production, replace these functions
 * with calls to your preferred analytics provider (e.g. Google Analytics,
 * Segment, or a custom data layer). Each function receives contextual
 * information about the event so you can send rich data downstream.
 */

export function onSurveyStart() {
  // Called when the user begins the survey
  // eslint-disable-next-line no-console
  console.debug('Analytics: survey_start');
}

export function onQuestionAnswered(questionId, answer) {
  // Called each time a question is answered
  // eslint-disable-next-line no-console
  console.debug('Analytics: question_answered', { questionId, answer });
}

export function onSurveyComplete(participantId) {
  // Called when the survey has been submitted and a participant ID generated
  // eslint-disable-next-line no-console
  console.debug('Analytics: survey_complete', { participantId });
}

export function onGameStart(participantId) {
  // Called when the swipe ritual game starts
  // eslint-disable-next-line no-console
  console.debug('Analytics: game_start', { participantId });
}

export function onSwipe(participantId, cardId, choice) {
  // Called whenever the user swipes on a card
  // eslint-disable-next-line no-console
  console.debug('Analytics: swipe', { participantId, cardId, choice });
}
