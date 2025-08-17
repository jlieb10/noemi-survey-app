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

  // Tutorial card display
  if (card?.isTutorial) {
    return (
      <div className="tutorial-card">
        <div className="tutorial-card__content">
          {card.text}
        </div>
        {tutorialHighlightDir && (
          <div className={`tutorial-hint dir-${card.requireDirection.toLowerCase()}`} />
        )}
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
