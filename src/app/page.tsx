'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { PerspectiveCamera } from 'three';
import dynamic from 'next/dynamic';
import { useWebGPU } from '../utils/useWebGPU';
import TerminalController from '../components/TerminalController';
import FallbackPage from '../components/FallbackPage';
import { TerminalEntry } from '../lib/terminal-types';

// World units per CSS pixel (for frame thickness conversion)
const WORLD_PIXEL = 0.003;

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
  bloomLuminanceSmoothing,
  terminalEntries,
  currentInput,
  isTyping,
  debugMode,
  screenWorldWidth,
  screenWorldHeight
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
  terminalEntries: TerminalEntry[];
  currentInput: string;
  isTyping: boolean;
  debugMode: number;
  screenWorldWidth: number;
  screenWorldHeight: number;
}) {
  // Margin values in pixels
  const marginTopPx = 48;
  const marginRightPx = 48;
  const marginBottomPx = 48;
  const marginLeftPx = 48;

  // Compute total monitor size in world units (screen + bezel)
  const totalWorldWidth = screenWorldWidth + (marginLeftPx + marginRightPx) * WORLD_PIXEL;
  const totalWorldHeight = screenWorldHeight + (marginTopPx + marginBottomPx) * WORLD_PIXEL;

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
        terminalEntries={terminalEntries}
        currentInput={currentInput}
        isTyping={isTyping}
        debugMode={debugMode}
      />

      {/* Auto‐fit camera to the monitor dimensions */}
      <AutoFitCamera screenWidth={totalWorldWidth + 0.01} screenHeight={totalWorldHeight + 0.01} />

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
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { supported: webGPUSupported, loading: webGPULoading } = useWebGPU();

  // Window size state and resize handler
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Debug positioning state (removed camera - using fixed position)
  const [housingZ, setHousingZ] = useState(-0.2);
  const [screenZ, setScreenZ] = useState(-0.05);
  const [debugMode, setDebugMode] = useState(0);

  // Terminal display state
  const [hideTerminalOverlay, setHideTerminalOverlay] = useState(true);
  const [terminalYOffset, setTerminalYOffset] = useState(100);

  // Map parameters
  const [cornerRoundness, setCornerRoundness] = useState(0.4);
  const [bubbleSize, setBubbleSize] = useState(0.75);
  const [edgeTransition, setEdgeTransition] = useState(0.26);
  const [displacementAmount, setDisplacementAmount] = useState(0.10);
  const [scanlineStrength, setScanlineStrength] = useState(0.35);
  const [scanlineScale, setScanlineScale] = useState(450.0);
  const [emissiveBoost, setEmissiveBoost] = useState(1.2);

  // Bloom parameters - Better defaults for the new setup
  const [bloomIntensity, setBloomIntensity] = useState(2.5);
  const [bloomKernelSize, setBloomKernelSize] = useState(3);
  const [bloomLuminanceThreshold, setBloomLuminanceThreshold] = useState(0.45);
  const [bloomLuminanceSmoothing, setBloomLuminanceSmoothing] = useState(0.3);

  // Margins (should match MainScene and Monitor3D)
  const marginTopPx = 48;
  const marginRightPx = 48;
  const marginBottomPx = 48;
  const marginLeftPx = 48;

  // Compute screen pixel and world sizes
  const WORLD_PIXEL = 0.003;
  const screenPxWidth = windowSize.width - marginLeftPx - marginRightPx;
  const screenPxHeight = windowSize.height - marginTopPx - marginBottomPx;
  const screenWorldWidth = screenPxWidth * WORLD_PIXEL;
  const screenWorldHeight = screenPxHeight * WORLD_PIXEL;

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
          terminalEntries={entries}
          currentInput={currentInput}
          isTyping={isTyping}
          debugMode={debugMode}
          screenWorldWidth={screenWorldWidth}
          screenWorldHeight={screenWorldHeight}
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
        debugMode={debugMode}
        onDebugModeChange={setDebugMode}
        bloomIntensity={bloomIntensity}
        bloomKernelSize={bloomKernelSize}
        bloomLuminanceThreshold={bloomLuminanceThreshold}
        bloomLuminanceSmoothing={bloomLuminanceSmoothing}
        onBloomIntensityChange={setBloomIntensity}
        onBloomKernelSizeChange={setBloomKernelSize}
        onBloomLuminanceThresholdChange={setBloomLuminanceThreshold}
        onBloomLuminanceSmoothingChange={setBloomLuminanceSmoothing}
        hideTerminalOverlay={hideTerminalOverlay}
        terminalYOffset={terminalYOffset}
        onHideTerminalOverlayChange={setHideTerminalOverlay}
        onTerminalYOffsetChange={setTerminalYOffset}
      />

      {/* Terminal overlay - now with visibility control */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="pointer-events-auto">
          <TerminalController
            onEntriesChange={handleEntriesChange}
            onCurrentInputChange={setCurrentInput}
            onTypingStateChange={setIsTyping}
            hideVisualContent={hideTerminalOverlay}
            yOffset={terminalYOffset}
          />
        </div>
      </div>
    </div>
  );
}


function AutoFitCamera({ screenWidth, screenHeight }: { screenWidth: number; screenHeight: number }) {
  const { camera: genericCamera, size } = useThree();
  useEffect(() => {
    const camera = genericCamera as PerspectiveCamera;
    if (!(camera instanceof PerspectiveCamera)) return;
    const aspect = size.width / size.height;
    const vFov = (camera.fov * Math.PI) / 180;
    // Vertical distance needed
    const distV = (screenHeight / 2) / Math.tan(vFov / 2);
    // Horizontal FOV
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    // Horizontal distance needed
    const distH = (screenWidth / 2) / Math.tan(hFov / 2);
    const dist = Math.max(distV, distH) * 1.05; // Pad by 5%
    camera.position.set(0, 0, dist);
    camera.updateProjectionMatrix();
  }, [genericCamera, size.width, size.height, screenWidth, screenHeight]);
  return null;
}