import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import '@testing-library/jest-dom/vitest';
import App from './App.jsx';

/**
 * Ensure terms tooltip appears when triggered.
 */
test('reveals terms on hover', async () => {
  render(<App />);
  const button = screen.getByRole('button', { name: /view terms/i });
  expect(screen.queryByText(/By participating, you agree/)).toBeNull();
  await userEvent.hover(button);
  expect(screen.getByText(/By participating, you agree/)).toBeInTheDocument();
});
