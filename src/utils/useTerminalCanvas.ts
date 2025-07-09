import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { TerminalEntry } from '../lib/terminal-types';
import { useWindowSize } from './useWindowSize';

interface TerminalCanvasOptions {
  // Layout margins (for calculating canvas size from window size)
  marginTopPx?: number;
  marginRightPx?: number;
  marginBottomPx?: number;
  marginLeftPx?: number;
  // Styling options
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  lineHeight?: number;
  padding?: number;
  spaceBetweenEntries?: number;
  showCursor?: boolean;
  cursorColor?: string;
  // Content options
  currentInput?: string;
  isTyping?: boolean;
}

export function useTerminalCanvas(
  entries: TerminalEntry[],
  options: TerminalCanvasOptions = {}
): THREE.Texture | null {
  const {
    marginTopPx = 12,
    marginRightPx = 12,
    marginBottomPx = 36,
    marginLeftPx = 12,
    backgroundColor = '#000000',
    textColor = '#ffffff',
    fontSize = 16,
    fontFamily = 'monospace',
    lineHeight = 1.2,
    padding = 16,
    spaceBetweenEntries = 4,
    showCursor = true,
    cursorColor = '#ffffff',
    currentInput = '',
    isTyping = false,
  } = options;

  // Get window size and calculate canvas dimensions
  const windowSize = useWindowSize();
  
  // Calculate canvas dimensions the same way Monitor3D does
  const canvasWidth = Math.max(windowSize.width - marginLeftPx - marginRightPx, 1);
  const canvasHeight = Math.max(windowSize.height - marginTopPx - marginBottomPx, 1);



  // Create canvas and texture only when window size or margins change
  const { canvas, texture } = useMemo(() => {
    console.log('🖼️ useTerminalCanvas: Creating canvas and texture (should only happen on window resize)', { canvasWidth, canvasHeight });
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

  // Set up 60fps continuous rendering loop (like a game engine)
  useEffect(() => {
    if (!canvas || !texture) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderFrame = () => {
      // Clear canvas
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Mirror the canvas vertically to fix orientation in 3D
      ctx.save();
      ctx.scale(1, -1);
      ctx.translate(0, -canvasHeight);

      // Set up text rendering
      ctx.fillStyle = textColor;
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';

      const actualLineHeight = fontSize * lineHeight;
      
      // Function to draw text with proper wrapping
      const drawText = (text: string, x: number, startY: number): number => {
        const lines = text.split('\n');
        let currentY = startY;
        
        lines.forEach((line) => {
          // Simple word wrapping
          const maxWidth = canvasWidth - padding * 2;
          const words = line.split(' ');
          let currentLine = '';
          
          words.forEach((word) => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
              // Draw the current line
              ctx.fillText(currentLine, x, currentY);
              currentY -= actualLineHeight;
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          });
          
          // Draw the remaining text
          if (currentLine) {
            ctx.fillText(currentLine, x, currentY);
            currentY -= actualLineHeight;
          }
        });
        
        return currentY;
      };

      // Start from bottom - reserve proper space for input section
      // Input section in TerminalController has substantial padding: p-4 top + line height + p-4 bottom + border
      const inputSectionHeight = padding * 2 + actualLineHeight + spaceBetweenEntries * 3; // Extra generous spacing
      let y = canvasHeight - inputSectionHeight;

      // Draw terminal entries FIRST (from newest to oldest, bottom to top)
      const reversedEntries = [...entries].reverse();
      
      for (const entry of reversedEntries) {
        if (y < padding) break; // Stop if we're out of space
        
        // Draw entry content - match TerminalController spacing
        ctx.fillStyle = textColor;
        const entryContent = entry.render()?.toString() || '';
        y = drawText(entryContent, padding + 16, y); // 16px left margin like ml-4
        
        y -= spaceBetweenEntries; // Use Tailwind space-y-1 (4px) instead of full line height
      }

      // Draw current input line LAST (at very bottom with proper padding)
      if (currentInput || showCursor) {
        const prompt = '> ';
        const inputText = prompt + currentInput;
        const inputX = padding;
        const inputY = canvasHeight - padding - actualLineHeight; // Bottom with padding
        
        ctx.fillStyle = textColor;
        ctx.fillText(inputText, inputX, inputY);
        
        // Draw cursor
        if (showCursor) {
          const cursorX = inputX + ctx.measureText(inputText).width;
          const cursorWidth = fontSize * 0.5;
          const cursorHeight = fontSize;
          
          ctx.fillStyle = cursorColor;
          if (isTyping) {
            ctx.fillRect(cursorX, inputY, cursorWidth, cursorHeight);
          } else {
            // Blinking cursor logic - show/hide based on time
            const now = Date.now();
            const blinkRate = 500; // ms
            const shouldShow = Math.floor(now / blinkRate) % 2 === 0;
            if (shouldShow) {
              ctx.fillRect(cursorX, inputY, cursorWidth, cursorHeight);
            }
          }
        }
      }

      // Restore canvas state
      ctx.restore();

      // Update texture from canvas - this happens 60fps regardless of content changes
      texture.needsUpdate = true;
    };

    // 60fps rendering loop - like a game engine or video capture
    const interval = setInterval(renderFrame, 1000 / 60);
    
    return () => clearInterval(interval);
  }, [canvas, texture, entries, backgroundColor, textColor, fontSize, fontFamily, lineHeight, padding, spaceBetweenEntries, showCursor, cursorColor, currentInput, isTyping, canvasWidth, canvasHeight]);

  return texture;
} 