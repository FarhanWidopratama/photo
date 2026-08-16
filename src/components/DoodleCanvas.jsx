import React, { useRef, useState, useEffect } from 'react';

export default function DoodleCanvas({
  width,
  height,
  brushColor,
  brushSize,
  doodlePaths,
  setDoodlePaths,
  isDoodling
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);

  // Redraw all paths — stored normalized (0-1), scaled to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width || 1;
    const h = canvas.height || 1;

    // Draw saved paths
    const normSize = brushSize / w;
    const allPaths = [
      ...doodlePaths,
      ...(currentPath.length > 0 ? [{ color: brushColor, size: normSize, points: currentPath }] : []),
    ];

    allPaths.forEach(path => {
      if (!path.points || path.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = path.color;
      ctx.lineWidth = Math.max(1, (path.size || normSize) * w);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(path.points[0].x * w, path.points[0].y * h);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x * w, path.points[i].y * h);
      }
      ctx.stroke();
    });
  }, [doodlePaths, currentPath, brushColor, brushSize, width, height]);

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: rect.width ? Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) : 0,
      y: rect.height ? Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)) : 0,
    };
  };

  const startDrawing = (e) => {
    if (!isDoodling) return;
    e.preventDefault();
    setIsDrawing(true);
    // Capture the pointer so strokes keep tracking outside the canvas edge
    try { canvasRef.current?.setPointerCapture(e.pointerId); } catch (err) { /* unsupported */ }
    const coords = getCanvasCoords(e);
    setCurrentPath([coords]);
  };

  const draw = (e) => {
    if (!isDrawing || !isDoodling) return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    setCurrentPath(prev => [...prev, coords]);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath.length > 1) {
      const w = canvasRef.current?.width || 1;
      setDoodlePaths(prev => [...prev, { color: brushColor, size: brushSize / w, points: currentPath }]);
    }
    setCurrentPath([]);
  };

  return (
    <canvas
      ref={canvasRef}
      width={width || 280}
      height={height || 620}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onMouseUpCapture={stopDrawing}
      onPointerCancel={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
      onTouchCancel={stopDrawing}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: isDoodling ? 'auto' : 'none',
        cursor: isDoodling ? 'crosshair' : 'default',
        zIndex: 25
      }}
    />
  );
}
