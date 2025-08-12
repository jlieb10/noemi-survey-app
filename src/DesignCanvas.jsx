import { useEffect, useRef } from 'react';

/**
 * Canvas-based image renderer to prevent easy saving.
 * @param {{ src: string, alt: string }} props
 * @returns {JSX.Element}
 */
export default function DesignCanvas({ src, alt }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
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

  return (
    <canvas
      ref={canvasRef}
      aria-label={alt}
      className="design-canvas"
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
