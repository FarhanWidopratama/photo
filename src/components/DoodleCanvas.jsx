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

  // Redraw all paths
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw saved paths
    const allPaths = [...doodlePaths, ...(currentPath.length > 0 ? [{ color: brushColor, size: brushSize, points: currentPath }] : [])];
    
    allPaths.forEach(path => {
      if (!path.points || path.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      ctx.stroke();
    });
  }, [doodlePaths, currentPath, brushColor, brushSize, width, height]);

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    if (!isDoodling) return;
    setIsDrawing(true);
    const coords = getCanvasCoords(e);
    setCurrentPath([coords]);
  };

  const draw = (e) => {
    if (!isDrawing || !isDoodling) return;
    const coords = getCanvasCoords(e);
    setCurrentPath(prev => [...prev, coords]);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath.length > 1) {
      setDoodlePaths(prev => [...prev, { color: brushColor, size: brushSize, points: currentPath }]);
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
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
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
