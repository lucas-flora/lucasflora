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
      
      // Function to pre-calculate wrapped lines for any text
      const calculateWrappedLines = (text: string, maxWidth: number): string[] => {
        const lines = text.split('\n');
        const wrappedLines: string[] = [];
        
        lines.forEach((line) => {
          if (!line.trim()) {
            wrappedLines.push('');
            return;
          }
          
          const words = line.split(' ');
          let currentLine = '';
          
          words.forEach((word) => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
              // Current line is full, start a new one
              wrappedLines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          });
          
          // Add the remaining text
          if (currentLine) {
            wrappedLines.push(currentLine);
          }
        });
        
        return wrappedLines;
      };
      
      // Function to draw text with proper wrapping (fixed order)
      const drawText = (text: string, x: number, bottomY: number): number => {
        // Match TerminalController's aggressive padding: 96px base + 150px extra margin
        const rightMargin = 32; // pr-16 = 64px right padding to match TerminalController
        const maxWidth = canvasWidth - padding * 2 - rightMargin;
        const wrappedLines = calculateWrappedLines(text, maxWidth);
        
        // Draw lines from bottom to top so first line appears highest
        let currentY = bottomY;
        for (let i = wrappedLines.length - 1; i >= 0; i--) {
          ctx.fillText(wrappedLines[i], x, currentY);
          currentY -= actualLineHeight;
        }
        
        // Return the Y position after drawing all lines (top of the text block)
        return currentY;
      };
      
      // Function to draw input with proper wrapping (upward direction)
      const drawInputWithWrapping = (inputText: string, x: number, bottomY: number): { endY: number, cursorX: number, cursorY: number } => {
        // Match TerminalController's aggressive padding for input as well
        const rightMargin = 32; // pr-16 = 64px right padding to match TerminalController
        const maxWidth = canvasWidth - padding * 2 - rightMargin;
        
        // Calculate prompt width for proper indentation of wrapped lines
        const prompt = '> ';
        const promptWidth = ctx.measureText(prompt).width;
        
        // Split input into prompt and content
        const content = inputText.substring(2); // Remove "> " prefix
        const wrappedLines = calculateWrappedLines(content, maxWidth - promptWidth);
        
        let currentY = bottomY;
        let cursorX = x;
        let cursorY = bottomY;
        
        // Draw lines from bottom to top (like entries)
        for (let i = wrappedLines.length - 1; i >= 0; i--) {
          const line = wrappedLines[i];
          
          if (i === wrappedLines.length - 1) {
            // First line (bottom) gets the prompt
            ctx.fillText(prompt + line, x, currentY);
            cursorX = x + ctx.measureText(prompt + line).width;
            cursorY = currentY;
          } else {
            // Subsequent lines (above) are indented to align with text after prompt
            ctx.fillText(line, x + promptWidth, currentY);
          }
          
          currentY -= actualLineHeight;
        }
        
        return { endY: currentY, cursorX, cursorY };
      };

      // Start from bottom - reserve proper space for input section
      // Calculate how many lines the current input will take when wrapped
      let inputLineCount = 1; // At least one line for the prompt even if no input
      if (currentInput || showCursor) {
        const prompt = '> ';
        const inputText = prompt + currentInput;
        // Match TerminalController's padding for line count calculation too
        const rightMargin = 64; // pr-16 = 64px right padding to match TerminalController
        const maxWidth = canvasWidth - padding * 2 - rightMargin;
        const inputWrappedLines = calculateWrappedLines(inputText, maxWidth);
        inputLineCount = Math.max(inputWrappedLines.length, 1);
      }
      
      // Dynamic input section height based on actual wrapped lines
      const inputSectionHeight = padding * 2 + (actualLineHeight * inputLineCount) + spaceBetweenEntries * 2;
      let y = canvasHeight - inputSectionHeight;

      // Draw terminal entries FIRST (from newest to oldest, bottom to top)
      const reversedEntries = [...entries].reverse();
      
      // Calculate consistent x positioning - entries should align with input text content (after "> ")
      const prompt = '> ';
      const promptWidth = ctx.measureText(prompt).width;
      const textStartX = padding + promptWidth; // Start from after the prompt position
      
      for (const entry of reversedEntries) {
        if (y < padding) break; // Stop if we're out of space
        
        // Draw entry content - align with input text content position
        ctx.fillStyle = textColor;
        const entryContent = entry.render()?.toString() || '';
        y = drawText(entryContent, textStartX, y);
        
        y -= spaceBetweenEntries; // Use Tailwind space-y-1 (4px) instead of full line height
      }

      // Draw current input line LAST (at very bottom with proper padding)
      if (currentInput || showCursor) {
        const prompt = '> ';
        const inputText = prompt + currentInput;
        const inputY = canvasHeight - padding - actualLineHeight; // Bottom with padding
        
        ctx.fillStyle = textColor;
        
        // Use same x position as entries for consistency
        const { cursorX, cursorY } = drawInputWithWrapping(inputText, textStartX, inputY);
        
        // Draw cursor
        if (showCursor) {
          const cursorWidth = fontSize * 0.5;
          const cursorHeight = fontSize;
          
          ctx.fillStyle = cursorColor;
          if (isTyping) {
            ctx.fillRect(cursorX, cursorY, cursorWidth, cursorHeight);
          } else {
            // Blinking cursor logic - show/hide based on time
            const now = Date.now();
            const blinkRate = 500; // ms
            const shouldShow = Math.floor(now / blinkRate) % 2 === 0;
            if (shouldShow) {
              ctx.fillRect(cursorX, cursorY, cursorWidth, cursorHeight);
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