'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { TerminalEntry, TextEntry } from '../lib/terminal-types';

interface TerminalControllerProps {
  onEntriesChange: (entries: TerminalEntry[]) => void;
}

export default function TerminalController({ onEntriesChange }: TerminalControllerProps) {
  const [entries, setEntries] = useState<TerminalEntry[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [, setIsInputFocused] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTyping = useCallback(() => {
    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 250);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    handleTyping();
    
    if (e.key === 'Enter') {
      if (currentInput.trim()) {
        const newEntry = new TextEntry(currentInput);
        const newEntries = [...entries, newEntry];
        setEntries(newEntries);
        onEntriesChange(newEntries);
        setCurrentInput('');
      }
    }
  }, [currentInput, entries, onEntriesChange, handleTyping]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentInput(e.target.value);
    handleTyping();
  }, [handleTyping]);


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
      <div className="h-full flex flex-col">
        {/* Terminal output area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 flex flex-col-reverse">
          {entries.slice().reverse().map((entry) => (
            <div key={entry.id} className="whitespace-pre-wrap ml-4">
              {entry.render()}
            </div>
          ))}
        </div>
        
        {/* Input line */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center">
            <span className="text-white mr-2">&gt;</span>
            <span className="whitespace-pre">{currentInput}</span>
            <span className={`bg-white w-2 h-5 inline-block ${isTyping ? '' : 'cursor-blink'}`}></span>
          </div>
        </div>
      </div>
      
      {/* Hidden input for focus */}
      <input
        ref={inputRef}
        className="absolute opacity-0 pointer-events-auto"
        style={{ left: '-9999px', top: '-9999px', width: '1px', height: '1px' }}
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