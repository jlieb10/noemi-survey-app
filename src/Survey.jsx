import { useState } from 'react';
import config from '../docs/noemi-survey-config.json';
import { supabase } from './supabaseClient.js';

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

  const handleChange = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
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
      return { ...prev, [id]: next };
    });
  };

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
      const goals = Object.entries(answers).map(([k, v]) => `${k}=${JSON.stringify(v)}`);
      const email = answers.Q10 && typeof answers.Q10 === 'object' ? answers.Q10.email || null : null;
      const marketing = answers.Q10 && typeof answers.Q10 === 'object' ? answers.Q10.join === 'yes' : false;
      if (!supabase) {
        onComplete('local-test');
        return;
      }
      const { data, error: insertError } = await supabase
        .from('participants')
        .insert({ email, goals, marketing_opt_in: marketing })
        .select()
        .single();
      if (insertError) throw insertError;
      onComplete(data.id);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Determine whether the current question has been answered.
   * For gate opt-in questions, validate required follow-up fields.
   *
   * @returns {boolean}
   */
  const isAnswered = () => {
    const val = answers[current.id];
    if (!current.required) return true;
    switch (current.type) {
      case 'multi_select':
      case 'rank_top_n':
        return Array.isArray(val) && val.length > 0;
      case 'short_text_one_word':
        return !!val && val.trim().length > 0;
      case 'gate_opt_in': {
        if (!val || !val.join) return false;
        if (val.join === 'yes' && current.follow_ups_if_yes) {
          return current.follow_ups_if_yes.every(
            (fu) => !fu.required || (val[fu.id] && val[fu.id].trim().length > 0),
          );
        }
        return true;
      }
      default:
        return !!val;
    }
  };

  const renderQuestion = (q) => {
    switch (q.type) {
      case 'single_select':
        return (
          <div>
            {q.options.map((opt) => (
              <label key={opt.id} style={{ display: 'block', marginTop: '0.5rem' }}>
                <input
                  type="radio"
                  name={q.id}
                  checked={answers[q.id] === opt.id}
                  onChange={() => handleChange(q.id, opt.id)}
                />{' '}
                {opt.label}
              </label>
            ))}
          </div>
        );
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
                  type="radio"
                  name={q.id}
                  style={{ display: 'none' }}
                  checked={answers[q.id] === opt.id}
                  onChange={() => handleChange(q.id, opt.id)}
                />
                <img
                  src={`${config.survey.meta.assets_base}${opt.image.src}`}
                  alt={opt.image.alt}
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    border: answers[q.id] === opt.id ? '2px solid #C6A25A' : '2px solid transparent',
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
            <p style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>Select up to {q.n}</p>
          </div>
        );
      case 'gate_opt_in': {
        const val = answers[q.id] || { join: null, email: '', instagram: '' };
        const handleJoin = (choice) => handleChange(q.id, { ...val, join: choice });
        return (
          <div>
            {q.options.map((opt) => (
              <label key={opt.id} style={{ display: 'block', marginTop: '0.5rem' }}>
                <input
                  type="radio"
                  name={`${q.id}_join`}
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
    <div>
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
        <button
          type="submit"
          disabled={!isAnswered() || loading}
          style={{
            padding: '0.75rem',
            fontSize: '1rem',
            backgroundColor: '#1e1e1e',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {loading
            ? 'Submitting…'
            : index === questions.length - 1
            ? config.survey.meta.end_cta
            : 'Next'}
        </button>
      </form>
    </div>
  );
}
