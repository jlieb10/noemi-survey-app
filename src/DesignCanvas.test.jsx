import { render, screen } from '@testing-library/react';
import { beforeAll, expect, test, vi } from 'vitest';
import DesignCanvas from './DesignCanvas.jsx';

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = () => ({
    drawImage: () => {},
    clearRect: () => {},
  });
});

test('renders image into canvas', () => {
  render(<DesignCanvas src="/logo.png" alt="test" />);
  const canvas = screen.getByLabelText('test');
  expect(canvas.tagName).toBe('CANVAS');
});

test('clears clipboard on PrintScreen', async () => {
  const writeText = vi.fn();
  Object.assign(navigator, { clipboard: { writeText } });
  render(<DesignCanvas src="/logo.png" alt="test" />);
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'PrintScreen' }));
  await Promise.resolve();
  expect(writeText).toHaveBeenCalledWith('');
});
