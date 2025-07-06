'use client';

import { useState } from 'react';

interface DebugControlsProps {
  onHousingZChange: (z: number) => void;
  onScreenZChange: (z: number) => void;
  housingZ: number;
  screenZ: number;
  onScanlineStrengthChange: (value: number) => void;
  onScanlineScaleChange: (value: number) => void;
  onCornerRoundnessChange: (value: number) => void;
  onBubbleSizeChange: (value: number) => void;
  onEdgeTransitionChange: (value: number) => void;
  onDisplacementAmountChange: (value: number) => void;
  scanlineStrength: number;
  scanlineScale: number;
  cornerRoundness: number;
  bubbleSize: number;
  edgeTransition: number;
  displacementAmount: number;
  emissiveBoost: number;
  onEmissiveBoostChange: (value: number) => void;
  // Bloom parameters
  bloomIntensity: number;
  bloomKernelSize: number;
  bloomLuminanceThreshold: number;
  bloomLuminanceSmoothing: number;
  onBloomIntensityChange: (value: number) => void;
  onBloomKernelSizeChange: (value: number) => void;
  onBloomLuminanceThresholdChange: (value: number) => void;
  onBloomLuminanceSmoothingChange: (value: number) => void;
}

export default function DebugControls({ 
  onHousingZChange, 
  onScreenZChange, 
  housingZ, 
  screenZ,
  onScanlineStrengthChange,
  onScanlineScaleChange,
  onCornerRoundnessChange,
  onBubbleSizeChange,
  onEdgeTransitionChange,
  onDisplacementAmountChange,
  scanlineStrength,
  scanlineScale,
  cornerRoundness,
  bubbleSize,
  edgeTransition,
  displacementAmount,
  emissiveBoost,
  onEmissiveBoostChange,
  bloomIntensity,
  bloomKernelSize,
  bloomLuminanceThreshold,
  bloomLuminanceSmoothing,
  onBloomIntensityChange,
  onBloomKernelSizeChange,
  onBloomLuminanceThresholdChange,
  onBloomLuminanceSmoothingChange
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
    <div className="fixed top-4 right-4 z-50 bg-black bg-opacity-80 text-white p-4 rounded-lg font-mono text-sm max-h-screen overflow-y-auto">
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
        
        <div>
          <label className="block text-xs text-gray-300 mb-1">
            Scanline Strength: {scanlineStrength.toFixed(2)}
          </label>
          <input
            type="range"
            min={0.0}
            max={1.0}
            step={0.01}
            value={scanlineStrength}
            onChange={(e) => onScanlineStrengthChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-xs text-gray-300 mb-1">
            Scanline Scale: {scanlineScale.toFixed(0)}
          </label>
          <input
            type="range"
            min={100}
            max={2000}
            step={50}
            value={scanlineScale}
            onChange={(e) => onScanlineScaleChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-xs text-gray-300 mb-1">
            Corner Roundness: {cornerRoundness.toFixed(2)}
          </label>
          <input
            type="range"
            min={0.0}
            max={1.0}
            step={0.05}
            value={cornerRoundness}
            onChange={(e) => onCornerRoundnessChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-xs text-gray-300 mb-1">
            Bubble Size: {bubbleSize.toFixed(2)}
          </label>
          <input
            type="range"
            min={0.0}
            max={1.0}
            step={0.01}
            value={bubbleSize}
            onChange={(e) => onBubbleSizeChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-xs text-gray-300 mb-1">
            Edge Transition: {edgeTransition.toFixed(2)}
          </label>
          <input
            type="range"
            min={0.0}
            max={1.0}
            step={0.01}
            value={edgeTransition}
            onChange={(e) => onEdgeTransitionChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-xs text-gray-300 mb-1">
            Displacement Amount: {displacementAmount.toFixed(2)}
          </label>
          <input
            type="range"
            min={0.0}
            max={1.0}
            step={0.01}
            value={displacementAmount}
            onChange={(e) => onDisplacementAmountChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-xs text-gray-300 mb-1">
            Emissive Boost: {emissiveBoost.toFixed(2)}
          </label>
          <input
            type="range"
            min={0.5}
            max={3.0}
            step={0.1}
            value={emissiveBoost}
            onChange={(e) => onEmissiveBoostChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div className="border-t border-gray-600 pt-3">
          <h4 className="text-xs font-bold text-gray-300 mb-2">Bloom Post-Processing</h4>
          
          <div>
            <label className="block text-xs text-gray-300 mb-1">
              Bloom Intensity: {bloomIntensity.toFixed(2)}
            </label>
            <input
              type="range"
              min={0.0}
              max={5.0}
              step={0.1}
              value={bloomIntensity}
              onChange={(e) => onBloomIntensityChange(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-300 mb-1">
              Bloom Kernel Size: {bloomKernelSize}
            </label>
            <input
              type="range"
              min={1}
              max={7}
              step={1}
              value={bloomKernelSize}
              onChange={(e) => onBloomKernelSizeChange(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-300 mb-1">
              Luminance Threshold: {bloomLuminanceThreshold.toFixed(2)}
            </label>
            <input
              type="range"
              min={0.0}
              max={10.0}
              step={0.05}
              value={bloomLuminanceThreshold}
              onChange={(e) => onBloomLuminanceThresholdChange(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-300 mb-1">
              Luminance Smoothing: {bloomLuminanceSmoothing.toFixed(2)}
            </label>
            <input
              type="range"
              min={0.0}
              max={1.0}
              step={0.01}
              value={bloomLuminanceSmoothing}
              onChange={(e) => onBloomLuminanceSmoothingChange(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
        
        <div className="text-xs text-gray-400 mt-2">
          <div>Housing front should be closest to camera</div>
          <div>Screen should be recessed into housing</div>
          <div>Bloom enhances bright screen content</div>
        </div>
      </div>
    </div>
  );
} 