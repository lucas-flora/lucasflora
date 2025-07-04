'use client';

import { useState } from 'react';

interface DebugControlsProps {
  onHousingZChange: (z: number) => void;
  onScreenZChange: (z: number) => void;
  housingZ: number;
  screenZ: number;
}

export default function DebugControls({ 
  onHousingZChange, 
  onScreenZChange, 
  housingZ, 
  screenZ
}: DebugControlsProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button 
          onClick={() => setIsVisible(true)}
          className="bg-gray-800 text-white px-3 py-1 rounded text-sm"
        >
          Debug
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-black bg-opacity-80 text-white p-4 rounded-lg font-mono text-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold">Debug Controls</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-300 mb-1">
            Housing Z: {housingZ.toFixed(3)}
          </label>
          <input
            type="range"
            min={-0.5}
            max={0.5}
            step={0.01}
            value={housingZ}
            onChange={(e) => onHousingZChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-xs text-gray-300 mb-1">
            Screen Z: {screenZ.toFixed(3)}
          </label>
          <input
            type="range"
            min={-0.2}
            max={0.2}
            step={0.01}
            value={screenZ}
            onChange={(e) => onScreenZChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        
        {/* Camera control removed - using fixed camera position */}
        
        <div className="text-xs text-gray-400 mt-2">
          <div>Housing front should be closest to camera</div>
          <div>Screen should be recessed into housing</div>
        </div>
      </div>
    </div>
  );
} 