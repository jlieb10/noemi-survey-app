import { useEffect, useRef } from 'react';

/**
 * Canvas-based image renderer to prevent easy saving.
 * Also handles tutorial cards with text-based overlay.
 * @param {{ src?: string, alt: string, card?: object, tutorialHighlightDir?: string }} props
 * @returns {JSX.Element}
 */
export default function DesignCanvas({ src, alt, card, tutorialHighlightDir }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !src) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Set consistent canvas dimensions (e.g., 400x400 or maintain aspect ratio within bounds)
      const maxWidth = 400;
      const maxHeight = 400;

      let { width, height } = img;

      // Calculate scaling to fit within bounds while maintaining aspect ratio
      const scale = Math.min(maxWidth / width, maxHeight / height);

      if (scale < 1) {
        width *= scale;
        height *= scale;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
    };
    img.onerror = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    img.src = src;
  }, [src]);

  useEffect(() => {
    const prevent = async (e) => {
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        try {
          await navigator.clipboard.writeText('');
        } catch {
          /* noop */
        }
      }
    };
    window.addEventListener('keydown', prevent);
    return () => window.removeEventListener('keydown', prevent);
  }, []);

  // Text card display (unified system for tutorials and potential future text cards)
  if (card?.isTutorial || card?.kind === 'text' || card?.cardType === 'text' || card?.cardType === 'tutorial') {
    return (
      <div className="text-card" style={{
        width: '100%',
        height: '100%',
        minWidth: '400px',
        minHeight: '400px'
      }}>
        <div className="text-card__content">
          <div className="text-card__text">
            {card.text}
          </div>
          {tutorialHighlightDir && (
            <div className="text-card__direction-hint">
              <div className={`direction-arrow dir-${card.requireDirection.toLowerCase()}`}>
                {card.requireDirection === 'up' && '↑'}
                {card.requireDirection === 'down' && '↓'}
                {card.requireDirection === 'left' && '←'}
                {card.requireDirection === 'right' && '→'}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-label={alt}
      className="design-canvas"
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
