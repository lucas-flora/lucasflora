import { useEffect, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useWindowSize } from './useWindowSize';
import { TerminalEntry } from '../lib/terminal-types';

interface UseTerminalDOMOptions {
  marginTopPx?: number;
  marginRightPx?: number;
  marginBottomPx?: number;
  marginLeftPx?: number;
}

export function useTerminalDOM(
  entries: TerminalEntry[],
  currentInput: string,
  isTyping: boolean,
  options: UseTerminalDOMOptions = {}
): THREE.Texture | null {
  const {
    marginTopPx = 12,
    marginRightPx = 12,
    marginBottomPx = 36,
    marginLeftPx = 12,
  } = options;

  const windowSize = useWindowSize();
  
  // Calculate canvas dimensions
  const canvasWidth = Math.max(windowSize.width - marginLeftPx - marginRightPx, 1);
  const canvasHeight = Math.max(windowSize.height - marginTopPx - marginBottomPx, 1);

  // Create canvas and texture
  const { canvas, texture } = useMemo(() => {
    if (typeof window === 'undefined') return { canvas: null, texture: null };
    
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    const texture = new THREE.Texture(canvas);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat;
    texture.flipY = false;
    
    return { canvas, texture };
  }, [canvasWidth, canvasHeight]);

  // Render directly from entries data (no DOM extraction needed)
  const updateTexture = useCallback(() => {
    if (!canvas || !texture) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Mirror the canvas vertically to fix orientation in 3D
    ctx.save();
    ctx.scale(1, -1);
    ctx.translate(0, -canvasHeight);

    // Set up text rendering to match TerminalController exactly
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    const fontSize = 16;
    const lineHeight = fontSize * 1.2;
    const padding = 16; // p-4 = 16px
    const rightPadding = 64; // pr-16 = 64px (TerminalController's right padding)
    
    // Calculate prompt width for consistent indentation
    const promptWidth = ctx.measureText('> ').width;
    const textStartX = padding + promptWidth; // Match TerminalController's text positioning

    // Calculate how many lines the current input will take when wrapped
    let inputLineCount = 1;
    if (currentInput || true) { // Always reserve space for prompt
      const prompt = '> ';
      const inputText = prompt + currentInput;
      const maxWidth = canvasWidth - padding - rightPadding;
      const inputWrappedLines = wrapText(ctx, inputText, maxWidth);
      inputLineCount = Math.max(inputWrappedLines.length, 1);
    }
    
    // Dynamic input section height
    const inputSectionHeight = padding * 2 + (lineHeight * inputLineCount) + 8; // 8px spacing
    let y = canvasHeight - inputSectionHeight;

    // Draw terminal entries from newest to oldest, bottom to top
    const reversedEntries = [...entries].reverse();
    
    for (const entry of reversedEntries) {
      if (y < padding) break; // Stop if we're out of space
      
      // Get entry content
      const entryContent = entry.render()?.toString() || '';
      
      // Handle text wrapping like TerminalController
      const maxWidth = canvasWidth - padding - rightPadding;
      const wrappedLines = wrapText(ctx, entryContent, maxWidth);
      
      // Draw lines from bottom to top
      for (let i = wrappedLines.length - 1; i >= 0; i--) {
        ctx.fillText(wrappedLines[i], textStartX, y);
        y -= lineHeight;
      }
      
      y -= 4; // Space between entries
    }

    // Draw current input line at bottom
    if (currentInput || true) { // Always show prompt
      const prompt = '> ';
      const inputText = prompt + currentInput;
      const inputY = canvasHeight - padding - lineHeight;
      
      // Handle input wrapping
      const maxWidth = canvasWidth - padding - rightPadding;
      const wrappedInputLines = wrapText(ctx, inputText, maxWidth);
      
      let currentY = inputY;
      for (let i = wrappedInputLines.length - 1; i >= 0; i--) {
        const line = wrappedInputLines[i];
        if (i === wrappedInputLines.length - 1) {
          // First line gets the prompt
          ctx.fillText(line, textStartX, currentY);
          
          // Draw cursor
          if (true) { // Always show cursor for now
            const cursorX = textStartX + ctx.measureText(line).width;
            const cursorWidth = fontSize * 0.5;
            const cursorHeight = fontSize;
            
            ctx.fillStyle = '#ffffff';
            if (isTyping) {
              ctx.fillRect(cursorX, currentY, cursorWidth, cursorHeight);
            } else {
              // Blinking cursor
              const now = Date.now();
              const shouldShow = Math.floor(now / 500) % 2 === 0;
              if (shouldShow) {
                ctx.fillRect(cursorX, currentY, cursorWidth, cursorHeight);
              }
            }
            ctx.fillStyle = '#ffffff'; // Reset fill style
          }
        } else {
          // Subsequent lines are indented
          ctx.fillText(line, textStartX, currentY);
        }
        currentY -= lineHeight;
      }
    }

    ctx.restore();
    texture.needsUpdate = true;
  }, [canvas, texture, canvasWidth, canvasHeight, entries, currentInput, isTyping]);

  // Helper function to wrap text like TerminalController
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    if (!text) return [''];
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach((word) => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines.length > 0 ? lines : [''];
  };

  // Set up continuous updates (like useTerminalCanvas)
  useEffect(() => {
    if (!canvas || !texture) return;

    // Update at 60fps like the original
    const interval = setInterval(updateTexture, 1000 / 60);
    
    return () => clearInterval(interval);
  }, [canvas, texture, updateTexture]);

  return texture;
} 