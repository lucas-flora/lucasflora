'use client';

import TerminalController from '../components/TerminalController';
import { TerminalEntry } from '../lib/terminal-types';

export default function Home() {
  const handleEntriesChange = (newEntries: TerminalEntry[]) => {
    // Handle entries change for future canvas integration
    console.log('Entries updated:', newEntries);
  };

  return (
    <div className="min-h-screen bg-black">
      <TerminalController onEntriesChange={handleEntriesChange} />
    </div>
  );
}
