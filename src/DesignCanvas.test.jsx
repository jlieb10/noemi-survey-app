import { render, screen } from '@testing-library/react';
import { beforeAll, expect, test } from 'vitest';
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
