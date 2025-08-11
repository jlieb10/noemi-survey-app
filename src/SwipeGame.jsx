import { useEffect, useState } from 'react';
import { onGameStart, onSwipe as trackSwipe } from './analytics.js';
import TinderCard from 'react-tinder-card';
import config from '../docs/noemi-survey-config.json';
import { supabase } from './supabaseClient.js';
import './SwipeGame.css';

const CHOICE_MAP = {
  right: 'like',
  left: 'dislike',
  up: 'love',
  down: 'not_sure',
};

const ICON_MAP = {
  right: '👍',
  left: '👎',
  up: '❤️',
  down: '❓',
};

/**
 * Swipe-based mini-game for rating cards.
 * @param {{ participantId: string }} props
 * @returns {JSX.Element}
 */
export default function SwipeGame({ participantId }) {
  const [deck, setDeck] = useState(null);
  const [initialDeck, setInitialDeck] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [history, setHistory] = useState([]);
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialDir, setTutorialDir] = useState(null);

  useEffect(() => {
    // Fire a game start event whenever the participant ID changes
    onGameStart(participantId);

    async function loadDesigns() {
      try {
        const res = await fetch('/designs/index.json');
        const data = await res.json();
        const subset = data.slice(0, 20);
        setDeck(subset);
        setInitialDeck(subset);
        setShowTutorial(true);
      } catch (err) {
        console.error('Failed to load designs', err);
        setDeck([]);
      }
    }

    loadDesigns();
  }, [participantId]);

  useEffect(() => {
    if (!deck || !showTutorial) return;
    async function runTutorial() {
      const sequence = ['right', 'left', 'up', 'down'];
      for (const dir of sequence) {
        setTutorialDir(dir);
        await new Promise((r) => setTimeout(r, 400));
        setTutorialDir(null);
        await new Promise((r) => setTimeout(r, 200));
      }
      setShowTutorial(false);
    }
    runTutorial();
  }, [deck, showTutorial]);

  /**
   * Persist a swipe choice.
   * @param {string} cardId
   * @param {string} choice
   * @returns {Promise<void>}
   */
  const saveSwipe = async (cardId, choice) => {
    try {
      if (supabase) {
        await supabase.from('swipes').insert({
          participant_id: participantId,
          card_id: cardId,
          choice,
        });
      } else {
        await fetch('https://lzzgroksxrqkwyvykmka.supabase.co/rest/v1/swipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ participant_id: participantId, card_id: cardId, choice }),
        });
      }
      trackSwipe(participantId, cardId, choice);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Remove a swipe record to support undo.
   * @param {string} cardId
   * @returns {Promise<void>}
   */
  const removeSwipe = async (cardId) => {
    try {
      if (supabase) {
        await supabase
          .from('swipes')
          .delete()
          .match({ participant_id: participantId, card_id: cardId });
      } else {
        await fetch(
          `https://lzzgroksxrqkwyvykmka.supabase.co/rest/v1/swipes?participant_id=eq.${participantId}&card_id=eq.${cardId}`,
          {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Handle swipe direction and record choice.
   * @param {string} direction
   * @returns {Promise<void>}
   */
  const handleSwipe = async (direction) => {
    const choice = CHOICE_MAP[direction];
    if (!choice || !deck?.length) return;

    const current = deck[0];
    setHistory((prev) => [...prev, { deck: [...deck], card: current }]);

    setFeedback({ icon: ICON_MAP[direction], key: Date.now() });
    setTimeout(() => setFeedback(null), 1000);

    setDeck((prev) => {
      const [first, ...rest] = prev;
      return direction === 'down' ? [...rest, first] : rest;
    });

    await saveSwipe(current.id, choice);
  };

  /**
   * Restore the previous deck state and remove persisted swipe.
   * @returns {Promise<void>}
   */
  const handleUndo = async () => {
    let lastEntry;
    setHistory((prev) => {
      if (!prev.length) return prev;
      lastEntry = prev[prev.length - 1];
      setDeck(lastEntry.deck);
      return prev.slice(0, -1);
    });
    if (lastEntry) {
      await removeSwipe(lastEntry.card.id);
    }
  };

  if (deck === null) {
    return <p>Loading designs…</p>;
  }

  if (!deck.length) {
    return (
      <div className="swipe-game">
        <p className="sg-subtitle">Thanks for swiping!</p>
        <button
          type="button"
          onClick={() => {
            setDeck(initialDeck);
            setHistory([]);
            setShowTutorial(true);
          }}
          className="lux-button-primary"
        >
          Play Again
        </button>
      </div>
    );
  }

  const current = deck[0];

  return (
    <div className="swipe-game">
      <h2 className="sg-title">{config.swipe_ritual.title}</h2>

      <div className="swipe-container">
        {showTutorial ? (
          <div
            className={`card tutorial${
              tutorialDir ? ` hint-${tutorialDir}` : ''
            }`}
          >
            <img
              src={current.image_url}
              alt={`Design ${current.id}`}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = '/vite.svg';
              }}
            />
          </div>
        ) : (
          <TinderCard key={current.id} onSwipe={handleSwipe}>
            <div className="card">
              <img
                src={current.image_url}
                alt={`Design ${current.id}`}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = '/vite.svg';
                }}
              />
            </div>
          </TinderCard>
        )}

        <span className={`swipe-label left${tutorialDir === 'left' ? ' active' : ''}`}>
          Dislike
        </span>
        <span className={`swipe-label right${tutorialDir === 'right' ? ' active' : ''}`}>
          Like
        </span>
        <span className={`swipe-label up${tutorialDir === 'up' ? ' active' : ''}`}>
          Love
        </span>
        <span className={`swipe-label down${tutorialDir === 'down' ? ' active' : ''}`}>
          Unsure
        </span>

        {feedback && (
          <div key={feedback.key} className="swipe-feedback" aria-live="polite">
            {feedback.icon}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <button
          type="button"
          onClick={handleUndo}
          className="lux-button-secondary"
        >
          Undo
        </button>
      )}
    </div>
  );
}
