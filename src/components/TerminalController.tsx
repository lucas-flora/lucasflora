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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (currentInput.trim()) {
        const newEntry = new TextEntry(currentInput);
        const newEntries = [...entries, newEntry];
        setEntries(newEntries);
        onEntriesChange(newEntries);
        setCurrentInput('');
      }
    } else if (e.key === 'Backspace') {
      setCurrentInput(prev => prev.slice(0, -1));
    } else if (e.key.length === 1) {
      setCurrentInput(prev => prev + e.key);
    }
  }, [currentInput, entries, onEntriesChange]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-black text-white font-mono overflow-hidden">
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
            <span className="bg-white w-2 h-5 inline-block"></span>
          </div>
        </div>
      </div>
      
      {/* Hidden input for focus */}
      <input
        ref={inputRef}
        className="absolute opacity-0 pointer-events-none"
        value={currentInput}
        onChange={() => {}}
        onFocus={() => setIsInputFocused(true)}
        onBlur={() => setIsInputFocused(false)}
        autoFocus
      />
    </div>
  );
}