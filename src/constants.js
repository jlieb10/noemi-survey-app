/**
 * Application constants and configuration values.
 * Centralizes magic numbers, strings, and mappings for better maintainability.
 */

// URL query parameter keys
export const URL_PARAMS = {
  DEV_MODE: 'dev',
  PLAY_MODE: 'play',
};

// Local storage keys
export const STORAGE_KEYS = {
  PARTICIPANT_ID: 'participant_id',
};

// Application steps/states
export const APP_STEPS = {
  WELCOME: 'welcome',
  SURVEY: 'survey',
  GAME: 'game',
};

// Default participant IDs
export const DEFAULT_PARTICIPANT_IDS = {
  GUEST: 'guest',
  LOCAL_TEST: 'local-test',
};

// Swipe game mappings
export const SWIPE_DIRECTIONS = {
  RIGHT: 'right',
  LEFT: 'left',
  UP: 'up',
  DOWN: 'down',
};

export const CHOICE_MAP = {
  [SWIPE_DIRECTIONS.RIGHT]: 'like',
  [SWIPE_DIRECTIONS.LEFT]: 'dislike',
  [SWIPE_DIRECTIONS.UP]: 'love',
  [SWIPE_DIRECTIONS.DOWN]: 'not_sure',
};

export const ICON_MAP = {
  [SWIPE_DIRECTIONS.RIGHT]: '👍',
  [SWIPE_DIRECTIONS.LEFT]: '👎',
  [SWIPE_DIRECTIONS.UP]: '❤️',
  [SWIPE_DIRECTIONS.DOWN]: '❓',
};

export const KEY_MAP = {
  ArrowRight: SWIPE_DIRECTIONS.RIGHT,
  ArrowLeft: SWIPE_DIRECTIONS.LEFT,
  ArrowUp: SWIPE_DIRECTIONS.UP,
  ArrowDown: SWIPE_DIRECTIONS.DOWN,
};

// Timing constants
export const TUTORIAL_TIMING = {
  DIRECTION_DISPLAY_MS: 400,
  DIRECTION_PAUSE_MS: 200,
};

export const FEEDBACK_TIMING = {
  DISPLAY_DURATION_MS: 1500,
};

// Design paths and fallbacks
export const ASSET_PATHS = {
  DESIGNS_INDEX: '/designs/index.json',
  FALLBACK_IMAGE: '/vite.svg',
  LOGO: '/logo.png',
};

// Survey-specific constants
export const SURVEY_CONSTANTS = {
  GATE_QUESTION_ID: 'Q12',
  OTHER_OPTION_ID: 'other',
};