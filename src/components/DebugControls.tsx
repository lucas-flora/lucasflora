'use client';

import { useState } from 'react';

interface DebugControlsProps {
  onHousingZChange: (z: number) => void;
  onScreenZChange: (z: number) => void;
  housingZ: number;
  screenZ: number;
  onScanlineStrengthChange: (value: number) => void;
  onLineSpacingChange: (value: number) => void;
  onCornerRoundnessChange: (value: number) => void;
  onBubbleSizeChange: (value: number) => void;
  onEdgeTransitionChange: (value: number) => void;
  onDisplacementAmountChange: (value: number) => void;
  scanlineStrength: number;
  lineSpacing: number;
  cornerRoundness: number;
  bubbleSize: number;
  edgeTransition: number;
  displacementAmount: number;
  emissiveBoost: number;
  onEmissiveBoostChange: (value: number) => void;
  cutoutRadius: number;
  bevelSize: number;
  onCutoutRadiusChange: (value: number) => void;
  onBevelSizeChange: (value: number) => void;
  checkerboardSize: number;
  onCheckerboardSizeChange: (value: number) => void;
  // Debug mode
  debugMode: number;
  onDebugModeChange: (value: number) => void;
  // Bloom parameters
  bloomIntensity: number;
  bloomKernelSize: number;
  bloomLuminanceThreshold: number;
  bloomLuminanceSmoothing: number;
  onBloomIntensityChange: (value: number) => void;
  onBloomKernelSizeChange: (value: number) => void;
  onBloomLuminanceThresholdChange: (value: number) => void;
  onBloomLuminanceSmoothingChange: (value: number) => void;
  // Terminal overlay controls
  hideTerminalOverlay: boolean;
  terminalYOffset: number;
  onHideTerminalOverlayChange: (value: boolean) => void;
  onTerminalYOffsetChange: (value: number) => void;
  // Frame noise controls
  frameNoiseScale: number;
  frameNoiseStrength: number;
  onFrameNoiseScaleChange: (value: number) => void;
  onFrameNoiseStrengthChange: (value: number) => void;
  // Key light controls (relative)
  keyLightIntensity: number;
  keyLightXRel: number;
  keyLightYRel: number;
  keyLightZRel: number;
  keyLightDistanceRel: number;
  onKeyLightIntensityChange: (value: number) => void;
  onKeyLightXRelChange: (value: number) => void;
  onKeyLightYRelChange: (value: number) => void;
  onKeyLightZRelChange: (value: number) => void;
  onKeyLightDistanceRelChange: (value: number) => void;
  // LED & surround sphere controls
  ledRadiusPx: number;
  surroundRadius: number;
  onLedRadiusPxChange: (value: number) => void;
  onSurroundRadiusChange: (value: number) => void;
  ledInset: number;
  onLedInsetChange: (value: number) => void;
}

export default function DebugControls({
  onHousingZChange,
  onScreenZChange,
  housingZ,
  screenZ,
  onScanlineStrengthChange,
  onLineSpacingChange,
  onCornerRoundnessChange,
  onBubbleSizeChange,
  onEdgeTransitionChange,
  onDisplacementAmountChange,
  scanlineStrength,
  lineSpacing,
  cornerRoundness,
  bubbleSize,
  edgeTransition,
  displacementAmount,
  emissiveBoost,
  onEmissiveBoostChange,
  cutoutRadius,
  bevelSize,
  onCutoutRadiusChange,
  onBevelSizeChange,
  checkerboardSize,
  onCheckerboardSizeChange,
  debugMode,
  onDebugModeChange,
  bloomIntensity,
  bloomKernelSize,
  bloomLuminanceThreshold,
  bloomLuminanceSmoothing,
  onBloomIntensityChange,
  onBloomKernelSizeChange,
  onBloomLuminanceThresholdChange,
  onBloomLuminanceSmoothingChange,
  hideTerminalOverlay,
  terminalYOffset,
  onHideTerminalOverlayChange,
  onTerminalYOffsetChange,
  frameNoiseScale,
  frameNoiseStrength,
  onFrameNoiseScaleChange,
  onFrameNoiseStrengthChange,
  ledInset,
  onLedInsetChange,
  // Key light
  keyLightXRel,
  keyLightYRel,
  keyLightZRel,
  keyLightIntensity,
  keyLightDistanceRel,
  onKeyLightIntensityChange,
  onKeyLightXRelChange,
  onKeyLightYRelChange,
  onKeyLightZRelChange,
  onKeyLightDistanceRelChange,
  // LED & surround sphere
  ledRadiusPx,
  // surroundRadius,
  onLedRadiusPxChange,
  // onSurroundRadiusChange,
}: DebugControlsProps) {
  const [isVisible, setIsVisible] = useState(false);

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
            Cutout Radius (world units): {cutoutRadius.toFixed(3)}
          </label>
          <input
            type="range"
            min={0.0}
            max={0.5}
            step={0.001}
            value={cutoutRadius}
            onChange={(e) => onCutoutRadiusChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-300 mb-1">
            Bevel Size (world units): {bevelSize.toFixed(3)}
          </label>
          <input
            type="range"
            min={0.0}
            max={0.1}
            step={0.001}
            value={bevelSize}
            onChange={(e) => onBevelSizeChange(parseFloat(e.target.value))}
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
            Debug Mode: {debugMode === 0 ? 'Terminal' : debugMode === 1 ? 'Bubble Map' : debugMode === 2 ? 'Scanlines' : debugMode === 3 ? 'Checkerboard' : 'Scanline Test'}
          </label>
          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={debugMode}
            onChange={(e) => onDebugModeChange(parseInt(e.target.value))}
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
            Line Spacing: {lineSpacing.toFixed(1)} px-units
          </label>
          <input
            type="range"
            min={0.1}
            max={20}
            step={0.1}
            value={lineSpacing}
            onChange={(e) => onLineSpacingChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-xs text-gray-300 mb-1">
            Checkerboard Size: {checkerboardSize.toFixed(3)} world units
          </label>
          <input
            type="range"
            min={0.01}
            max={0.2}
            step={0.005}
            value={checkerboardSize}
            onChange={(e) => onCheckerboardSizeChange(parseFloat(e.target.value))}
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

        <div>
          <label className="block text-xs text-gray-300 mb-1">
            Frame Noise Scale: {frameNoiseScale.toFixed(2)}
          </label>
          <input
            type="range"
            min={0.1}
            max={1.0}
            step={0.01}
            value={frameNoiseScale}
            onChange={(e) => onFrameNoiseScaleChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-300 mb-1">
            Frame Noise Strength: {frameNoiseStrength.toFixed(3)}
          </label>
          <input
            type="range"
            min={0.0}
            max={1.0}
            step={0.01}
            value={frameNoiseStrength}
            onChange={(e) => onFrameNoiseStrengthChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* LED Radius */}
        <div>
          <label className="block text-xs text-gray-300 mb-1">
            LED Radius (px): {ledRadiusPx.toFixed(1)}
          </label>
          <input
            type="range"
            min={1}
            max={20}
            step={0.5}
            value={ledRadiusPx}
            onChange={(e) => onLedRadiusPxChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        {/* LED Inset */}
        <div>
          <label className="block text-xs text-gray-300 mb-1">
            LED Inset (world): {ledInset.toFixed(3)}
          </label>
          <input
            type="range"
            min={0}
            max={0.1}
            step={0.005}
            value={ledInset}
            onChange={e => onLedInsetChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>


        {/* Key Light Intensity */}
        <div>
          <label className="block text-xs text-gray-300 mb-1">
            Key Light Intensity: {keyLightIntensity.toFixed(1)}
          </label>
          <input
            type="range"
            min={0.1}
            max={12}
            step={0.1}
            value={keyLightIntensity}
            onChange={e => onKeyLightIntensityChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      

        {/* Key Light Position */}
        <div>
          <label className="block text-xs text-gray-300 mb-1">
            Key Light X Rel: {keyLightXRel.toFixed(3)}
          </label>
          <input
            type="range"
            min={-1}
            max={1}
            step={0.01}
            value={keyLightXRel}
            onChange={(e) => onKeyLightXRelChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-300 mb-1">
            Key Light Y Rel: {keyLightYRel.toFixed(3)}
          </label>
          <input
            type="range"
            min={-1}
            max={1}
            step={0.01}
            value={keyLightYRel}
            onChange={(e) => onKeyLightYRelChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-300 mb-1">
            Key Light Z Rel: {keyLightZRel.toFixed(3)}
          </label>
          <input
            type="range"
            min={0}
            max={3}
            step={0.01}
            value={keyLightZRel}
            onChange={(e) => onKeyLightZRelChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-xs text-gray-300 mb-1">
            Key Light Distance Rel: {keyLightDistanceRel.toFixed(3)}
          </label>
          <input
            type="range"
            min={0.1}
            max={5}
            step={0.1}
            value={keyLightDistanceRel}
            onChange={(e) => onKeyLightDistanceRelChange(parseFloat(e.target.value))}
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
        
        <div className="border-t border-gray-600 pt-3">
          <h4 className="text-xs font-bold text-gray-300 mb-2">Terminal Overlay</h4>
          
          <div>
            <label className="flex items-center space-x-2 mb-2">
              <input
                type="checkbox"
                checked={hideTerminalOverlay}
                onChange={(e) => onHideTerminalOverlayChange(e.target.checked)}
                className="form-checkbox"
              />
              <span className="text-xs text-gray-300">Hide Terminal Overlay</span>
            </label>
          </div>
          
          <div>
            <label className="block text-xs text-gray-300 mb-1">
              Y Offset: {terminalYOffset}px
            </label>
            <input
              type="range"
              min={0}
              max={400}
              step={1}
              value={terminalYOffset}
              onChange={(e) => onTerminalYOffsetChange(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
        
        <div className="text-xs text-gray-400 mt-2">
          <div>Housing front should be closest to camera</div>
          <div>Screen should be recessed into housing</div>
          <div>Bloom enhances bright screen content</div>
          <div>Hide overlay to rely on 3D terminal texture</div>
        </div>
      </div>
    </div>
  );
}