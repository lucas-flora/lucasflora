'use client';

import { useEffect, useRef, useState } from 'react';
import { TerminalEntry } from '../lib/terminal-types';

interface TerminalCanvasProps {
  entries: TerminalEntry[];
  currentInput: string;
  width: number;
  height: number;
}

export default function TerminalCanvas({ 
  entries, 
  currentInput, 
  width, 
  height 
}: TerminalCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCursor, setShowCursor] = useState(true);

  // Cursor blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Set text properties
    ctx.font = '16px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'top';

    const lineHeight = 20;
    const padding = 20;
    let currentY = padding;

    // Render entries
    entries.forEach((entry) => {
      const content = entry.render() as string;
      const lines = content.split('\n');
      
      lines.forEach((line) => {
        ctx.fillText(line, padding, currentY);
        currentY += lineHeight;
      });
    });

    // Render current input line
    const promptText = '$ ' + currentInput;
    ctx.fillStyle = '#00ff00'; // Green prompt
    ctx.fillText('$', padding, currentY);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText(currentInput, padding + 20, currentY);

    // Render cursor
    if (showCursor) {
      const textWidth = ctx.measureText(promptText).width;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(padding + textWidth, currentY, 2, 16);
    }

  }, [entries, currentInput, showCursor, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="block"
    />
  );
}