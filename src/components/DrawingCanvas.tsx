import React, { useRef, useEffect, useState, useCallback } from 'react';

interface DrawingCanvasProps {
  onClear: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onClear, canvasRef }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = Math.min(200, container.clientWidth * 0.5);
    }

    // Initial canvas style - dark background like chalkboard
    ctx.fillStyle = '#1a3a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Set drawing style - chalk-like
    ctx.strokeStyle = '#f5f5dc';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [canvasRef]);

  const getPosition = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, [canvasRef]);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getPosition(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasContent(true);
  }, [canvasRef, getPosition]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getPosition(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing, canvasRef, getPosition]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.fillStyle = '#1a3a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
    onClear();
  }, [canvasRef, onClear]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-foreground/70 text-sm font-medium">
          ✏️ Schreibe hier deine Antwort:
        </span>
        {hasContent && (
          <button
            onClick={clearCanvas}
            className="text-sm text-destructive hover:text-destructive/80 transition-colors"
          >
            🗑️ Löschen
          </button>
        )}
      </div>
      <div className="wood-frame p-2 rounded-xl">
        <canvas
          ref={canvasRef}
          className="w-full rounded-lg cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <p className="text-center text-muted-foreground text-xs mt-2">
        Schreibe groß und deutlich! 📝
      </p>
    </div>
  );
};
