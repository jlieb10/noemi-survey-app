import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import BackLink from './BackLink.jsx';

describe('BackLink', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders back link with default text and arrow', () => {
    render(<BackLink onClick={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: 'Go back to previous question' })
    ).toBeInTheDocument();
    expect(screen.getByText('←')).toBeInTheDocument();
    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const mockOnClick = vi.fn();
    render(<BackLink onClick={mockOnClick} />);

    const backButton = screen.getByRole('button', {
      name: 'Go back to previous question',
    });
    fireEvent.click(backButton);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick when Enter key is pressed', () => {
    const mockOnClick = vi.fn();
    render(<BackLink onClick={mockOnClick} />);

    const backButton = screen.getByRole('button', {
      name: 'Go back to previous question',
    });
    fireEvent.keyDown(backButton, { key: 'Enter' });

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick when Space key is pressed', () => {
    const mockOnClick = vi.fn();
    render(<BackLink onClick={mockOnClick} />);

    const backButton = screen.getByRole('button', {
      name: 'Go back to previous question',
    });
    fireEvent.keyDown(backButton, { key: ' ' });

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const mockOnClick = vi.fn();
    render(<BackLink onClick={mockOnClick} disabled />);

    const backButton = screen.getByRole('button', {
      name: 'Go back to previous question',
    });
    fireEvent.click(backButton);

    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('does not call onClick when disabled and Enter is pressed', () => {
    const mockOnClick = vi.fn();
    render(<BackLink onClick={mockOnClick} disabled />);

    const backButton = screen.getByRole('button', {
      name: 'Go back to previous question',
    });
    fireEvent.keyDown(backButton, { key: 'Enter' });

    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('applies disabled styling when disabled', () => {
    render(<BackLink onClick={vi.fn()} disabled />);

    const backLink = screen.getByRole('button', {
      name: 'Go back to previous question',
    });
    expect(backLink).toHaveClass('disabled');
    expect(backLink).toHaveAttribute('aria-disabled', 'true');
    expect(backLink).toHaveAttribute('tabIndex', '-1');
  });

  it('applies custom className', () => {
    render(<BackLink onClick={vi.fn()} className="custom-class" />);

    const backButton = screen.getByRole('button', {
      name: 'Go back to previous question',
    });
    expect(backButton).toHaveClass('custom-class');
  });

  it('uses custom aria label when provided', () => {
    render(<BackLink onClick={vi.fn()} ariaLabel="Return to previous step" />);

    expect(
      screen.getByRole('button', { name: 'Return to previous step' })
    ).toBeInTheDocument();
  });

  it('prevents default behavior on click', () => {
    const mockOnClick = vi.fn();
    render(<BackLink onClick={mockOnClick} />);

    const backButton = screen.getByRole('button', {
      name: 'Go back to previous question',
    });
    fireEvent.click(backButton);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('has correct accessibility attributes', () => {
    render(<BackLink onClick={vi.fn()} />);

    const backLink = screen.getByRole('button', {
      name: 'Go back to previous question',
    });
    expect(backLink).toHaveAttribute('role', 'button');
    expect(backLink).toHaveAttribute('tabIndex', '0');
    expect(backLink).toHaveAttribute(
      'aria-label',
      'Go back to previous question'
    );
  });

  it('ignores other keyboard keys', () => {
    const mockOnClick = vi.fn();
    render(<BackLink onClick={mockOnClick} />);

    const backButton = screen.getByRole('button', {
      name: 'Go back to previous question',
    });
    fireEvent.keyDown(backButton, { key: 'Tab' });
    fireEvent.keyDown(backButton, { key: 'Escape' });

    expect(mockOnClick).not.toHaveBeenCalled();
  });
});
