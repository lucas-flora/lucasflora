'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWebGPU } from '../utils/useWebGPU';
import TerminalController from '../components/TerminalController';
import FallbackPage from '../components/FallbackPage';
import { TerminalEntry } from '../lib/terminal-types';

// Dynamically import Canvas to avoid SSR issues
const Canvas = dynamic(() => import('@react-three/fiber').then(mod => ({ default: mod.Canvas })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white">Loading 3D scene...</div>
    </div>
  ),
});

// Dynamically import 3D components to avoid SSR issues
const Monitor3D = dynamic(() => import('../components/Monitor3D'), {
  ssr: false,
});

// Dynamically import post-processing components
const EffectComposer = dynamic(() => import('@react-three/postprocessing').then(mod => ({ default: mod.EffectComposer })), {
  ssr: false,
});

const Bloom = dynamic(() => import('@react-three/postprocessing').then(mod => ({ default: mod.Bloom })), {
  ssr: false,
});

const DebugControls = dynamic(() => import('../components/DebugControls'), {
  ssr: false,
});

// Removed camera controller - using fixed camera position

// Main 3D scene component
function MainScene({
  screenZ,
  scanlineStrength,
  scanlineScale,
  cornerRoundness,
  bubbleSize,
  edgeTransition,
  displacementAmount,
  emissiveBoost,
  bloomIntensity,
  bloomKernelSize,
  bloomLuminanceThreshold,
  bloomLuminanceSmoothing
}: { 
  screenZ: number;
  scanlineStrength: number;
  scanlineScale: number;
  cornerRoundness: number;
  bubbleSize: number;
  edgeTransition: number;
  displacementAmount: number;
  emissiveBoost: number;
  bloomIntensity: number;
  bloomKernelSize: number;
  bloomLuminanceThreshold: number;
  bloomLuminanceSmoothing: number;
}) {
  // Margin values in pixels
  const marginTopPx = 24;
  const marginRightPx = 24;
  const marginBottomPx = 42;
  const marginLeftPx = 24;

  return (
    <>
      <Monitor3D
        screenZ={screenZ}
        marginTopPx={marginTopPx}
        marginRightPx={marginRightPx}
        marginBottomPx={marginBottomPx}
        marginLeftPx={marginLeftPx}
        scanlineStrength={scanlineStrength}
        scanlineScale={scanlineScale}
        cornerRoundness={cornerRoundness}
        bubbleSize={bubbleSize}
        edgeTransition={edgeTransition}
        displacementAmount={displacementAmount}
        emissiveBoost={emissiveBoost}
      />
      
      {/* Post-processing chain */}
      <EffectComposer>
        <Bloom
          intensity={bloomIntensity}
          kernelSize={bloomKernelSize}
          luminanceThreshold={bloomLuminanceThreshold}
          luminanceSmoothing={bloomLuminanceSmoothing}
        />
      </EffectComposer>
    </>
  );
}

export default function Home() {
  const [entries, setEntries] = useState<TerminalEntry[]>([]);
  const { supported: webGPUSupported, loading: webGPULoading } = useWebGPU();
  
  // Debug positioning state (removed camera - using fixed position)
  const [housingZ, setHousingZ] = useState(-0.2);
  const [screenZ, setScreenZ] = useState(-0.05);
  
  // Map parameters
  const [cornerRoundness, setCornerRoundness] = useState(0.4);
  const [bubbleSize, setBubbleSize] = useState(0.99);
  const [edgeTransition, setEdgeTransition] = useState(0.15);
  const [displacementAmount, setDisplacementAmount] = useState(0.07);
  const [scanlineStrength, setScanlineStrength] = useState(0.33);
  const [scanlineScale, setScanlineScale] = useState(1200.0);
  const [emissiveBoost, setEmissiveBoost] = useState(1.0);
  
  // Bloom parameters - Better defaults for the new setup
  const [bloomIntensity, setBloomIntensity] = useState(1.3);
  const [bloomKernelSize, setBloomKernelSize] = useState(3);
  const [bloomLuminanceThreshold, setBloomLuminanceThreshold] = useState(0.9);
  const [bloomLuminanceSmoothing, setBloomLuminanceSmoothing] = useState(0.3);

  const handleEntriesChange = (newEntries: TerminalEntry[]) => {
    setEntries(newEntries);
    console.log('Entries updated:', newEntries);
  };

  // Show loading state while checking WebGPU support
  if (webGPULoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Checking WebGPU support...</div>
      </div>
    );
  }

  // Show fallback page if WebGPU is not supported
  if (!webGPUSupported) {
    return <FallbackPage entries={entries} />;
  }

  // Show the 3D experience if WebGPU is supported
  return (
    <div className="min-h-screen bg-red-500 relative">
      {/* R3F Canvas - will use WebGPU when available */}
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
        }}
        camera={{ 
          fov: 50,
          position: [0, 0, 2.6] // Much closer - monitor should fill screen
        }}
        shadows
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <MainScene 
          screenZ={screenZ} 
          scanlineStrength={scanlineStrength} 
          scanlineScale={scanlineScale} 
          cornerRoundness={cornerRoundness} 
          bubbleSize={bubbleSize} 
          edgeTransition={edgeTransition} 
          displacementAmount={displacementAmount}
          emissiveBoost={emissiveBoost}
          bloomIntensity={bloomIntensity}
          bloomKernelSize={bloomKernelSize}
          bloomLuminanceThreshold={bloomLuminanceThreshold}
          bloomLuminanceSmoothing={bloomLuminanceSmoothing}
        />
      </Canvas>
      
      {/* Debug Controls */}
      <DebugControls 
        housingZ={housingZ}
        screenZ={screenZ}
        onHousingZChange={setHousingZ}
        onScreenZChange={setScreenZ}
        scanlineStrength={scanlineStrength}
        scanlineScale={scanlineScale}
        cornerRoundness={cornerRoundness}
        bubbleSize={bubbleSize}
        edgeTransition={edgeTransition}
        displacementAmount={displacementAmount}
        emissiveBoost={emissiveBoost}
        onScanlineStrengthChange={setScanlineStrength}
        onScanlineScaleChange={setScanlineScale}
        onCornerRoundnessChange={setCornerRoundness}
        onBubbleSizeChange={setBubbleSize}
        onEdgeTransitionChange={setEdgeTransition}
        onDisplacementAmountChange={setDisplacementAmount}
        onEmissiveBoostChange={setEmissiveBoost}
        bloomIntensity={bloomIntensity}
        bloomKernelSize={bloomKernelSize}
        bloomLuminanceThreshold={bloomLuminanceThreshold}
        bloomLuminanceSmoothing={bloomLuminanceSmoothing}
        onBloomIntensityChange={setBloomIntensity}
        onBloomKernelSizeChange={setBloomKernelSize}
        onBloomLuminanceThresholdChange={setBloomLuminanceThreshold}
        onBloomLuminanceSmoothingChange={setBloomLuminanceSmoothing}
      />
      
      {/* Terminal overlay for now - will be integrated into 3D scene later */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="pointer-events-auto">
          <TerminalController onEntriesChange={handleEntriesChange} />
        </div>
      </div>
    </div>
  );
}
