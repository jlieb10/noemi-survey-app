import { useState, useEffect } from 'react';
import config from '../../docs/noemi-survey-config.json';
import { supabase } from '../services/supabaseClient.js';
import { onSurveyStart, onQuestionAnswered, onSurveyComplete } from '../services/analytics.js';
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

  const current = questions[index];

  // Fire survey start once on mount
  useEffect(() => {
    onSurveyStart();

  }, []);

  const handleChange = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    onQuestionAnswered(id, value);
  };

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

  const renderOtherOption = (q, limit) => (
    <label style={{ display: 'block', marginTop: '0.5rem' }}>
      <input
        type="checkbox"
        checked={(answers[q.id] || []).includes(SURVEY_CONSTANTS.OTHER_OPTION_ID)}
        onChange={() => handleMultiChange(q.id, SURVEY_CONSTANTS.OTHER_OPTION_ID, limit, q.exclusive_option_id)}
      />{' '}
      Other
      {(answers[q.id] || []).includes(SURVEY_CONSTANTS.OTHER_OPTION_ID) && (
        <input
          type="text"
          value={answers[`${q.id}_other`] || ''}
          onChange={(e) => handleChange(`${q.id}_other`, e.target.value)}
          style={{
            marginLeft: '0.5rem',
            padding: '0.25rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        />
      )}
    </label>
  );

  const handleNext = () => {
    if (index < questions.length - 1) setIndex((i) => i + 1);
    else handleSubmit();
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
          .insert({ email, answers, marketing_opt_in: marketing })
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
      case 'multi_select':
        return (
          <div>
            {q.options.map((opt) => (
              <label key={opt.id} style={{ display: 'block', marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={(answers[q.id] || []).includes(opt.id)}
                  onChange={() => handleMultiChange(q.id, opt.id, q.max_select, q.exclusive_option_id)}
                />{' '}
                {opt.label}
              </label>
            ))}
            {renderOtherOption(q, q.max_select)}
          </div>
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
                <div style={{ textAlign: 'center', marginTop: '0.25rem' }}>{opt.label}</div>
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
              <label key={opt.id} style={{ display: 'block', marginTop: '0.5rem' }}>
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
              <label key={opt.id} style={{ display: 'block', marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={val.join === opt.id}
                  onChange={() => handleJoin(opt.id)}
                />{' '}
                {opt.label}
              </label>
            ))}
            {val.join === 'yes' && q.follow_ups_if_yes && (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {q.follow_ups_if_yes.map((fu) => (
                  <label key={fu.id} style={{ display: 'block' }}>
                    {fu.label}
                    <input
                      type={fu.type === 'email' ? 'email' : 'text'}
                      value={val[fu.id] || ''}
                      onChange={(e) => handleChange(q.id, { ...val, [fu.id]: e.target.value })}
                      maxLength={fu.max_chars}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      }
      default:
        return <p>Unsupported question type: {q.type}</p>;
    }
  };

  return (
    <div className="survey-wrapper">
      <div style={{ marginBottom: '1rem' }}>Question {index + 1} of {questions.length}</div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleNext();
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <h2 style={{ marginBottom: '0.5rem' }}>{current.prompt}</h2>
        {renderQuestion(current)}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="submit"
            disabled={loading}
            className="lux-button-primary"
          >
            {loading
              ? 'Submitting…'
              : index === questions.length - 1
              ? config.survey.meta.end_cta
              : 'Next'}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleNext}
            className="lux-button-secondary"
          >
            Skip
          </button>
        </div>
      </form>
    </div>
  );
}
