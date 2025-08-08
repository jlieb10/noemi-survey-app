import { useState } from 'react';
import { supabase } from './supabaseClient.js';

/**
 * A simple survey form collecting basic demographic and spending
 * information. When submitted it inserts the participant into the
 * Supabase `participants` table and calls the provided callback with
 * the returned ID.
 */
export default function Survey({ onComplete }) {
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [spend, setSpend] = useState('');
  const [optIn, setOptIn] = useState(true);
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
      const { data, error: insertError } = await supabase
        .from('participants')
        .insert({
          email,
          age: age ? parseInt(age, 10) : null,
          monthly_supplement_spend: spend ? parseFloat(spend) : null,
          marketing_opt_in: optIn,
        })
        .select()
        .single();
      if (insertError) {
        throw insertError;
      }
      // Pass the generated ID back to the parent component.
      onComplete(data.id);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2>Tell us about yourself</h2>
      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '0.5rem' }}
        />
      </label>
      <label>
        Age
        <input
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          style={{ width: '100%', padding: '0.5rem' }}
        />
      </label>
      <label>
        Monthly supplement spend (£)
        <input
          type="number"
          step="0.01"
          value={spend}
          onChange={(e) => setSpend(e.target.value)}
          style={{ width: '100%', padding: '0.5rem' }}
        />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="checkbox"
          checked={optIn}
          onChange={(e) => setOptIn(e.target.checked)}
        />
        I agree to receive marketing emails
      </label>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit" disabled={loading} style={{ padding: '0.75rem', fontSize: '1rem' }}>
        {loading ? 'Submitting…' : 'Start swiping'}
      </button>
    </form>
  );
}