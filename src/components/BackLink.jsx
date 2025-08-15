/**
 * Subtle back arrow link component that matches the UI design.
 * Provides an elegant way to navigate back without using a button.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Function} props.onClick - Function to call when the back link is clicked
 * @param {boolean} props.disabled - Whether the back link is disabled
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.ariaLabel] - Accessible label for the link
 * @returns {JSX.Element} The back link component
 */
export default function BackLink({
  onClick,
  disabled,
  className = '',
  ariaLabel,
}) {
  const handleClick = (e) => {
    e.preventDefault();
    if (!disabled && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <a
      href="#"
      className={`back-link ${disabled ? 'disabled' : ''} ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel || 'Go back to previous question'}
      aria-disabled={disabled}
    >
      <span className="back-arrow" aria-hidden="true">
        ←
      </span>
      <span className="back-text">Back</span>
    </a>
  );
}
