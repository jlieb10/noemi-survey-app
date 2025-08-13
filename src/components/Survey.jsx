import { useState, useEffect, useRef } from 'react';
import config from '../../docs/noemi-survey-config.json';
import { supabase } from '../services/supabaseClient.js';
import { onSurveyStart, onQuestionAnswered, onSurveyComplete } from '../services/analytics.js';
import { getCachedUserLocation } from '../utils/geolocation.js';
import BackLink from './BackLink.jsx';
import {
  DEFAULT_PARTICIPANT_IDS,
  SURVEY_CONSTANTS,
  ASSET_PATHS,
} from '../constants.js';
import { handleImageError } from '../utils/common.js';

/**
 * Renders the survey and collects responses.
 * @param {{ onComplete: (id: string) => void }} props - Completion callback.
 * @returns {JSX.Element} Survey component.
 */
export default function Survey({ onComplete }) {
  const questions = config.questions || [];
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  // Timer for auto-advancing on single-select
  const autoNextRef = useRef(null);

  const current = questions[index];

  // Fire survey start once on mount and get user location
  useEffect(() => {
    onSurveyStart();
    
    // Get user location for analytics
    getCachedUserLocation().then(location => {
      setUserLocation(location);
    });
  }, []);

  // Clear any pending auto-advance timer on unmount
  useEffect(() => () => clearTimeout(autoNextRef.current), []);

  /**
   * Handle answer changes for single-value questions.
   * @param {string} id - Question ID
   * @param {any} value - Answer value
   */
  const handleChange = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    onQuestionAnswered(id, value);
  };

  /**
   * Handle answer changes for multi-select questions with validation.
   * @param {string} id - Question ID
   * @param {string} optId - Option ID being toggled
   * @param {number} max - Maximum selections allowed
   * @param {string} exclusiveId - ID of exclusive option if any
   */
  const handleMultiChange = (id, optId, max, exclusiveId) => {
    setAnswers((prev) => {
      const arr = Array.isArray(prev[id]) ? prev[id] : [];
      let next;
      if (arr.includes(optId)) {
        next = arr.filter((v) => v !== optId);
      } else {
        next = [...arr, optId];
        if (max && next.length > max) next = next.slice(1);
      }
      if (exclusiveId) {
        if (optId === exclusiveId) {
          next = [exclusiveId];
        } else {
          next = next.filter((v) => v !== exclusiveId);
        }
      }
      onQuestionAnswered(id, next);
      return { ...prev, [id]: next };
    });
  };

  const shouldShowOtherOption = (q) => {
    // If 'allow_other' is explicitly set, use that value
    if (typeof q.allow_other === 'boolean') {
      return q.allow_other;
    }
    // Fallback to previous behavior: exclude 'Other' for ingredient grids
    return q.ui_hint !== 'ingredient_grid';
  };

  const renderOtherOption = (q, limit) => (
    <label className="stack" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      <input
        type="checkbox"
        checked={(answers[q.id] || []).includes(SURVEY_CONSTANTS.OTHER_OPTION_ID)}
        onChange={() => handleMultiChange(q.id, SURVEY_CONSTANTS.OTHER_OPTION_ID, limit, q.exclusive_option_id)}
      />
      <span>Other</span>
      {(answers[q.id] || []).includes(SURVEY_CONSTANTS.OTHER_OPTION_ID) && (
        <input
          type="text"
          value={answers[`${q.id}_other`] || ''}
          onChange={(e) => handleChange(`${q.id}_other`, e.target.value)}
          style={{
            marginLeft: 'var(--space-2)',
            padding: 'var(--space-1)',
            border: '1px solid #ccc',
            borderRadius: 'var(--radius-sm)',
          }}
        />
      )}
    </label>
  );

  /**
   * Navigate to the next question or submit if on the last question.
   */
  const handleNext = () => {
    if (index < questions.length - 1) setIndex((i) => i + 1);
    else handleSubmit();
  };

  /**
   * Navigate back to the previous question.
   */
  const handleBack = () => {
    setIndex((i) => Math.max(0, i - 1));
  };

  /**
   * Persist survey responses and notify completion.
   * Extracts marketing opt-in data from the gate question.
   * @returns {Promise<void>}
   */
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      // Extract opt‑in details from the gate question (Q12).
      const gate = answers[SURVEY_CONSTANTS.GATE_QUESTION_ID] && typeof answers[SURVEY_CONSTANTS.GATE_QUESTION_ID] === 'object' ? answers[SURVEY_CONSTANTS.GATE_QUESTION_ID] : {};
      const email = gate.email || null;
      const marketing = gate.join === 'yes';
      let participantId = DEFAULT_PARTICIPANT_IDS.LOCAL_TEST;

      // Persist to Supabase if a client is available.
      if (supabase) {
        const { data, error: insertError } = await supabase
          .from('participants')
          .insert({ 
            email, 
            answers, 
            marketing_opt_in: marketing,
            location_data: userLocation 
          })
          .select()
          .single();
        if (insertError) throw insertError;
        participantId = data.id;
      }

      // Invoke completion callback with the new or placeholder ID.
      onComplete(participantId);
      onSurveyComplete(participantId);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
      // Even on error, navigate forward in dev/local mode.
      onComplete(DEFAULT_PARTICIPANT_IDS.LOCAL_TEST);
    } finally {
      setLoading(false);
    }
  };

  const renderQuestion = (q) => {
    switch (q.type) {
      case 'single_select':
        return (
          <fieldset className="stack" role="radiogroup" aria-labelledby={`${q.id}-label`}>
            <legend id={`${q.id}-label`} className="sr-only">{q.prompt}</legend>
            {q.options.map((opt) => (
              <label key={opt.id} className="stack" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <input
                  type="radio"
                  name={q.id}
                  value={opt.id}
                  checked={answers[q.id] === opt.id}
                  onChange={() => {
                    handleChange(q.id, opt.id);
                    clearTimeout(autoNextRef.current);
                    autoNextRef.current = setTimeout(() => handleNext(), 300);
                  }}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </fieldset>
        );
      case 'multi_select':
        return (
          <fieldset className="stack" aria-labelledby={`${q.id}-label`}>
            <legend id={`${q.id}-label`} className="sr-only">{q.prompt}</legend>
            <div 
              className={q.ui_hint === 'ingredient_grid' ? 'ingredient-grid' : 'stack'}
              style={q.ui_hint === 'ingredient_grid' ? {
                display: 'grid',
                gridTemplateColumns: q.layout === 'two_columns' ? '1fr 1fr' : '1fr',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-3)'
              } : {}}
            >
              {q.options.map((opt) => (
                <label key={opt.id} className="stack" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <input
                    type="checkbox"
                    checked={(answers[q.id] || []).includes(opt.id)}
                    onChange={() => handleMultiChange(q.id, opt.id, q.max_select, q.exclusive_option_id)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            {/* 
              The rendering of the 'Other' option is now configurable via the 'allow_other' property on the question object.
              If 'allow_other' is not specified, fallback to the previous behaviour: exclude 'Other' for ingredient grids.
            */}
            {shouldShowOtherOption(q) && renderOtherOption(q, q.max_select)}
            {q.max_select && (
              <p style={{ fontSize: '0.8rem', fontStyle: 'italic', marginTop: 'var(--space-2)' }}>
                Select up to {q.max_select} {q.ui_hint === 'ingredient_grid' ? 'ingredients' : 'options'}
              </p>
            )}
          </fieldset>
        );
      case 'image_select':
        return (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: q.layout === '2x2' ? '1fr 1fr' : '1fr',
              gap: '1rem',
            }}
          >
            {q.options.map((opt) => (
              <label key={opt.id} style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{ display: 'none' }}
                  checked={(answers[q.id] || []).includes(opt.id)}
                  onChange={() => handleMultiChange(q.id, opt.id, q.max_select, q.exclusive_option_id)}
                />
                <img
                  src={`${config.survey.meta.assets_base}${opt.image.src}`}
                  alt={opt.image.alt}
                  onError={(e) => handleImageError(e, ASSET_PATHS.FALLBACK_IMAGE)}
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    border: (answers[q.id] || []).includes(opt.id) ? '2px solid #C6A25A' : '2px solid transparent',
                  }}
                />
                <div style={{ textAlign: 'center', marginTop: 'var(--space-1)' }}>{opt.label}</div>
              </label>
            ))}
          </div>
        );
      case 'short_text_one_word':
        return (
          <input
            type="text"
            value={answers[q.id] || ''}
            onChange={(e) => handleChange(q.id, e.target.value)}
            maxLength={q.max_chars}
            placeholder={q.placeholder}
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        );
      case 'rank_top_n':
        return (
          <div>
            {q.options.map((opt) => (
              <label key={opt.id} className="stack" style={{ display: 'block' }}>
                <input
                  type="checkbox"
                  checked={(answers[q.id] || []).includes(opt.id)}
                  onChange={() => handleMultiChange(q.id, opt.id, q.n)}
                />{' '}
                {opt.label}
              </label>
            ))}
            {renderOtherOption(q, q.n)}
            <p style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>Select up to {q.n}</p>
          </div>
        );
      case 'gate_opt_in': {
        const val = answers[q.id] || { join: null, email: '', instagram: '' };
        const handleJoin = (choice) => {
          const newChoice = val.join === choice ? null : choice;
          handleChange(q.id, { ...val, join: newChoice });
        };
        return (
          <div>
            {q.options.map((opt) => (
              <label key={opt.id} className="stack" style={{ display: 'block' }}>
                <input
                  type="checkbox"
                  checked={val.join === opt.id}
                  onChange={() => handleJoin(opt.id)}
                />{' '}
                {opt.label}
              </label>
            ))}
            {val.join === 'yes' && q.follow_ups_if_yes && (
              <div className="stack" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {q.follow_ups_if_yes.map((fu) => (
                  <label key={fu.id} className="stack" style={{ display: 'block' }}>
                    {fu.label}
                    <input
                      type={fu.type === 'email' ? 'email' : 'text'}
                      value={val[fu.id] || ''}
                      onChange={(e) => handleChange(q.id, { ...val, [fu.id]: e.target.value })}
                      maxLength={fu.max_chars}
                      style={{ width: '100%', padding: 'var(--space-2)', border: '1px solid #ccc', borderRadius: 'var(--radius-sm)' }}
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      }
      case 'scale': {
        const currentValue = answers[q.id] || null;
        return (
          <fieldset className="scale-question" aria-labelledby={`${q.id}-label`}>
            <legend id={`${q.id}-label`} className="sr-only">{q.prompt}</legend>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--space-3)',
              margin: 'var(--space-4) 0'
            }}>
              <span style={{ 
                fontSize: '0.9rem', 
                color: 'var(--color-text-secondary)', 
                minWidth: '60px',
                textAlign: 'right'
              }}>
                {q.left}
              </span>
              <div style={{ 
                display: 'flex', 
                gap: 'var(--space-2)',
                flex: 1,
                justifyContent: 'center'
              }}>
                {Array.from({ length: q.max - q.min + 1 }, (_, i) => {
                  const value = q.min + i;
                  return (
                    <label 
                      key={value}
                      style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'pointer',
                        padding: 'var(--space-2)'
                      }}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={value}
                        checked={currentValue === value}
                        onChange={() => handleChange(q.id, value)}
                        style={{
                          width: '20px',
                          height: '20px',
                          marginBottom: 'var(--space-1)'
                        }}
                      />
                      <span style={{ 
                        fontSize: '0.8rem',
                        color: 'var(--color-text-secondary)'
                      }}>
                        {value}
                      </span>
                    </label>
                  );
                })}
              </div>
              <span style={{ 
                fontSize: '0.9rem', 
                color: 'var(--color-text-secondary)', 
                minWidth: '60px',
                textAlign: 'left'
              }}>
                {q.right}
              </span>
            </div>
          </fieldset>
        );
      }
      default:
        return <p>Unsupported question type: {q.type}</p>;
    }
  };

  return (
    <div className="survey-wrapper stack" role="main">
      {/* Progress bar */}
      <div className="survey-progress" style={{ marginBottom: '1rem' }}>
        <progress 
          value={index + 1} 
          max={questions.length} 
          style={{ width: '100%', height: '8px' }}
          aria-label={`Survey progress: Question ${index + 1} of ${questions.length}`}
        />
        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
          Question {index + 1} of {questions.length}
        </p>
      </div>
      
      <nav className="survey-navigation" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
        <BackLink
          onClick={handleBack}
          disabled={index === 0}
          ariaLabel={index > 0 ? `Go back to question ${index}` : undefined}
        />
      </nav>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleNext();
        }}
        className="stack"
        aria-labelledby="current-question"
      >
        <h2 id="current-question" className="stack" style={{ fontFamily: 'var(--font-serif)' }}>{current.prompt}</h2>
        {renderQuestion(current)}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div className="stack" style={{ display: 'flex', justifyContent: 'center' }}>
          <button type="submit" disabled={loading} className="lux-button-primary">
            {loading ? 'Submitting…' : index === questions.length - 1 ? config.survey.meta.end_cta : 'Next'}
          </button>
        </div>
      </form>
    </div>
  );
}