import { useState } from 'react';
import { supabase } from './supabaseClient.js';

/**
 * A simple survey form collecting basic demographic and spending
 * information. When submitted it inserts the participant into the
 * Supabase `participants` table and calls the provided callback with
 * the returned ID.
 */
export default function Survey({ onComplete }) {
  // Basic contact details
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [spend, setSpend] = useState('');
  const [optIn, setOptIn] = useState(true);

  // Supplement usage questions
  const [usesSupplements, setUsesSupplements] = useState('');
  const [categories, setCategories] = useState([]);
  const [reasons, setReasons] = useState('');
  const [frequency, setFrequency] = useState('');
  const [interest, setInterest] = useState('3');

  // Submission state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Handles the form submission. Inserts a new participant into the
   * database and, on success, notifies the parent component. Errors
   * are captured and displayed to the user.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Consolidate responses into the goals array. This allows us
      // to capture arbitrary survey answers without altering the DB
      // schema. Each element encodes a key=value pair describing
      // usage, categories, reasons, frequency and interest.
      const goals = [];
      goals.push(`uses_supplements=${usesSupplements}`);
      if (categories.length > 0) goals.push(`categories=${categories.join(',')}`);
      if (reasons) goals.push(`reasons=${reasons.trim()}`);
      if (frequency) goals.push(`frequency=${frequency}`);
      goals.push(`interest=${interest}`);

      const { data, error: insertError } = await supabase
        .from('participants')
        .insert({
          email,
          age: age ? parseInt(age, 10) : null,
          monthly_supplement_spend: spend ? parseFloat(spend) : null,
          goals,
          marketing_opt_in: optIn,
        })
        .select()
        .single();
      if (insertError) {
        throw insertError;
      }
      onComplete(data.id);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', marginBottom: '0.5rem' }}>NOĒMI</h1>
      <p style={{ fontStyle: 'italic', marginBottom: '1rem' }}>We’re crafting a luxury supplement experience and need your insight.</p>
      {/* Email and age */}
      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        />
      </label>
      <label>
        Age
        <input
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        />
      </label>
      {/* Supplement usage */}
      <fieldset style={{ border: 'none', padding: 0 }}>
        <legend style={{ fontWeight: 'bold' }}>Do you currently take nutritional supplements?</legend>
        <label style={{ display: 'block', marginTop: '0.25rem' }}>
          <input
            type="radio"
            name="uses_supplements"
            value="yes"
            checked={usesSupplements === 'yes'}
            onChange={(e) => setUsesSupplements(e.target.value)}
          />{' '}
          Yes
        </label>
        <label style={{ display: 'block' }}>
          <input
            type="radio"
            name="uses_supplements"
            value="no"
            checked={usesSupplements === 'no'}
            onChange={(e) => setUsesSupplements(e.target.value)}
          />{' '}
          No
        </label>
      </fieldset>
      {/* Categories */}
      <fieldset style={{ border: 'none', padding: 0 }}>
        <legend style={{ fontWeight: 'bold' }}>Which of these categories do you currently take? (Select all that apply)</legend>
        {['Energy', 'Immunity', 'Beauty', 'Sleep', 'Mental focus', 'Other'].map((cat) => (
          <label key={cat} style={{ display: 'block', marginTop: '0.25rem' }}>
            <input
              type="checkbox"
              value={cat}
              checked={categories.includes(cat)}
              onChange={(e) => {
                const checked = e.target.checked;
                setCategories((prev) => {
                  if (checked) return [...prev, cat];
                  return prev.filter((c) => c !== cat);
                });
              }}
            />{' '}
            {cat}
          </label>
        ))}
      </fieldset>
      {/* Reasons */}
      <label>
        Why do you take supplements? (optional)
        <textarea
          value={reasons}
          onChange={(e) => setReasons(e.target.value)}
          rows={3}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        />
      </label>
      {/* Frequency */}
      <label>
        How often do you take supplements?
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          <option value="">Select...</option>
          <option value="daily">Daily</option>
          <option value="several_times_per_week">Several times per week</option>
          <option value="weekly">Weekly</option>
          <option value="occasionally">Occasionally</option>
        </select>
      </label>
      {/* Interest */}
      <label>
        How interested are you in discovering a new premium supplement brand?
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
          <span>Not at all</span>
          <span>Very</span>
        </div>
      </label>
      {/* Spend */}
      <label>
        Monthly supplement spend (£)
        <input
          type="number"
          step="0.01"
          value={spend}
          onChange={(e) => setSpend(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        />
      </label>
      {/* Marketing opt-in */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="checkbox"
          checked={optIn}
          onChange={(e) => setOptIn(e.target.checked)}
        />
        I agree to receive news and offers from NOĒMI
      </label>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button
        type="submit"
        disabled={loading}
        style={{ padding: '0.75rem', fontSize: '1rem', backgroundColor: '#1e1e1e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        {loading ? 'Submitting…' : 'Start swiping'}
      </button>
    </form>
  );
}
