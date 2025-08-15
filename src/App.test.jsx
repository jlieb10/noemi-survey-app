import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import App from './components/App.jsx';

beforeEach(() => {
  cleanup();
});

/**
 * Ensure terms tooltip appears when triggered.
 */
test('reveals terms on hover', async () => {
  render(<App />);
  const button = screen.getByRole('button', { name: /view terms/i });
  expect(screen.queryByText(/By participating, you agree/)).toBeNull();
  
  await userEvent.hover(button);
  
  // Wait for the tooltip to appear
  await screen.findByText(/By participating, you agree/);
  expect(screen.getByText(/By participating, you agree/)).toBeInTheDocument();
});

/**
 * Ensure welcome screen has only one primary CTA button.
 */
test('welcome screen has single CTA button', () => {
  render(<App />);
  
  // Should have the Begin button (use getAllByRole and check first one)
  const beginButtons = screen.getAllByRole('button', { name: 'Begin' });
  expect(beginButtons[0]).toBeInTheDocument();
  
  // Should NOT have the secondary "Explore Design Concepts" button
  expect(screen.queryByRole('button', { name: 'Explore Design Concepts' })).not.toBeInTheDocument();
  
  // Should have exactly 2 buttons total (Begin button + terms button)
  const buttons = screen.getAllByRole('button');
  expect(buttons).toHaveLength(2);
});
