'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useWindowSize } from '../utils/useWindowSize';
import { TerminalEntry } from '../lib/terminal-types';

interface TerminalControllerProps {
  entries: TerminalEntry[];
  onCurrentInputChange?: (input: string) => void;
  onTypingStateChange?: (isTyping: boolean) => void;
  onUserSubmit?: (input: string) => void;
  hideVisualContent?: boolean;
  yOffset?: number;
}

export default function TerminalController({ 
  entries,
  onCurrentInputChange, 
  onTypingStateChange,
  onUserSubmit,
  hideVisualContent = false,
  yOffset = 0
}: TerminalControllerProps) {
  const [currentInput, setCurrentInput] = useState('');
  const [, setIsInputFocused] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track window size using centralized hook
  const windowSize = useWindowSize();

  // Calculate the exact prompt width for consistent indentation
  const promptIndent = useMemo(() => {
    // Create a temporary canvas to measure prompt width
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '1.5rem'; // Fallback
    
    // Set font to match terminal styling
    ctx.font = '16px monospace';
    const promptWidth = ctx.measureText('> ').width;
    
    return `${promptWidth}px`;
  }, []);

  // Helper function to calculate wrapped lines for input
  const calculateWrappedInputLines = useCallback((text: string): string[] => {
    if (!text) return [''];
    
    // Create a temporary canvas to measure text width
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [text]; // Fallback if canvas context not available
    
    // Set font to match terminal styling
    ctx.font = '16px monospace'; // Match the terminal font
    
    // Calculate available width (account for terminal padding and prompt)
    const promptWidth = ctx.measureText('> ').width;
    const padding = 32; // Much larger padding for comfortable margins
    const availableWidth = windowSize.width - padding - promptWidth - 150; // Much larger right margin
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach((word) => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > availableWidth && currentLine) {
        // Current line is full, start a new one
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    // Add the remaining text
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines.length > 0 ? lines : [''];
  }, [windowSize.width]);

  const handleTyping = useCallback(() => {
    setIsTyping(true);
    onTypingStateChange?.(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTypingStateChange?.(false);
    }, 250);
  }, [onTypingStateChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    handleTyping();
    
    if (e.key === 'Enter') {
      if (currentInput.trim()) {
        onUserSubmit?.(currentInput.trim());
        setCurrentInput('');
        onCurrentInputChange?.(''); // Notify parent that input was cleared
      }
    }
  }, [currentInput, handleTyping, onCurrentInputChange, onUserSubmit]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newInput = e.target.value;
    setCurrentInput(newInput);
    onCurrentInputChange?.(newInput);
    handleTyping();
  }, [handleTyping, onCurrentInputChange]);


  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleTerminalClick = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-transparent text-white font-mono overflow-hidden" onClick={handleTerminalClick}>
      {!hideVisualContent && (
        <div className="h-full flex flex-col">
          {/* Terminal output area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1 flex flex-col-reverse">
            {entries.slice().reverse().map((entry) => (
              <div key={entry.id} className="whitespace-pre-wrap pr-16" style={{ marginLeft: promptIndent }}>
                {entry.render()}
              </div>
            ))}
          </div>
          
          {/* Input line */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex flex-col">
              {(() => {
                const wrappedLines = calculateWrappedInputLines(currentInput);
                // Reverse lines so they display from top to bottom but read correctly (wrap upward)
                return wrappedLines.slice().reverse().map((line, index) => {
                  const isBottomLine = index === wrappedLines.length - 1;
                  return (
                    <div key={index} className="flex items-center pr-16">
                      {isBottomLine && <span className="text-white mr-2">&gt;</span>}
                      {!isBottomLine && <span className="text-transparent mr-2 select-none">&gt;</span>} {/* Invisible prompt for alignment */}
                      <span className="whitespace-pre">{line}</span>
                      {/* Show cursor only on the bottom line */}
                      {isBottomLine && (
                        <span className={`bg-white w-2 h-5 inline-block ${isTyping ? '' : 'cursor-blink'}`}></span>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden input for focus - positioned based on yOffset when hideVisualContent is true */}
      <input
        ref={inputRef}
        className="absolute opacity-0 pointer-events-auto"
        style={{ 
          left: '-9999px', 
          top: hideVisualContent ? `${windowSize.height - yOffset}px` : '-9999px',
          width: '1px', 
          height: '1px' 
        }}
        value={currentInput}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsInputFocused(true)}
        onBlur={() => setIsInputFocused(false)}
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        inputMode="text"
      />
    </div>
  );
}