'use client';

import { useState, useRef } from 'react';
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { PerspectiveCamera } from 'three';
import * as THREE from 'three';
import dynamic from 'next/dynamic';
import { useWebGPU } from '../utils/useWebGPU';
import { useWindowSize } from '../utils/useWindowSize';
import { useTerminalDOM } from '../utils/useTerminalDOM';
import TerminalController from '../components/TerminalController';
import FallbackPage from '../components/FallbackPage';
import { TerminalEntry, TextEntry, PendingEntry } from '../lib/terminal-types';

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
  marginTopPx,
  marginRightPx,
  marginBottomPx,
  marginLeftPx,
  scanlineStrength,
  lineSpacing,
  cornerRoundness,
  bubbleSize,
  edgeTransition,
  displacementAmount,
  emissiveBoost,
  bloomIntensity,
  bloomKernelSize,
  bloomLuminanceThreshold,
  bloomLuminanceSmoothing,
  debugMode,
  screenWorldWidth,
  screenWorldHeight,
  cutoutRadius,
  bevelSize,
  frameNoiseScale,
  frameNoiseStrength,
  keyLightXRel,
  keyLightYRel,
  keyLightZRel,
  keyLightIntensity,
  keyLightDistanceRel,
  ledRadiusPx,
  ledInset,
  checkerboardSize,
  domTexture,
  enableGlassOverlay,
  glassOpacity,
  refractionIndex,
  reflectionStrength,
  glassTint,
  glassThickness,
  fresnelPower,
  glassZOffset,
  reflectionClamp,
  chromaticAberrationBlackLevel,
  chromaticAberrationWhiteLevel,
  chromaticAberrationRedShift,
  chromaticAberrationGreenShift,
  chromaticAberrationBlueShift,
  chromaticAberrationStrength,
}: {
  screenZ: number;
  marginTopPx: number;
  marginRightPx: number;
  marginBottomPx: number;
  marginLeftPx: number;
  scanlineStrength: number;
  lineSpacing: number;
  cornerRoundness: number;
  bubbleSize: number;
  edgeTransition: number;
  displacementAmount: number;
  emissiveBoost: number;
  bloomIntensity: number;
  bloomKernelSize: number;
  bloomLuminanceThreshold: number;
  bloomLuminanceSmoothing: number;
  debugMode: number;
  screenWorldWidth: number;
  screenWorldHeight: number;
  cutoutRadius: number;
  bevelSize: number;
  frameNoiseScale: number;
  frameNoiseStrength: number;
  keyLightXRel: number;
  keyLightYRel: number;
  keyLightZRel: number;
  keyLightIntensity: number;
  keyLightDistanceRel: number;
  ledRadiusPx: number;
  ledInset: number;
  checkerboardSize: number;
  domTexture: THREE.Texture | null;
  enableGlassOverlay: boolean;
  glassOpacity: number;
  refractionIndex: number;
  reflectionStrength: number;
  glassTint: [number, number, number];
  glassThickness: number;
  fresnelPower: number;
  glassZOffset: number;
  reflectionClamp: number;
  chromaticAberrationBlackLevel: number;
  chromaticAberrationWhiteLevel: number;
  chromaticAberrationRedShift: number;
  chromaticAberrationGreenShift: number;
  chromaticAberrationBlueShift: number;
  chromaticAberrationStrength: number;
}) {

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
        lineSpacing={lineSpacing}
        cornerRoundness={cornerRoundness}
        bubbleSize={bubbleSize}
        edgeTransition={edgeTransition}
        displacementAmount={displacementAmount}
        emissiveBoost={emissiveBoost}
        debugMode={debugMode}
        cutoutRadius={cutoutRadius}
        bevelSize={bevelSize}
        frameNoiseScale={frameNoiseScale}
        frameNoiseStrength={frameNoiseStrength}
        keyLightXRel={keyLightXRel}
        keyLightYRel={keyLightYRel}
        keyLightZRel={keyLightZRel}
        keyLightIntensity={keyLightIntensity}
        keyLightDistanceRel={keyLightDistanceRel}
        ledRadiusPx={ledRadiusPx}
        ledInset={ledInset}
        checkerboardSize={checkerboardSize}
        terminalTexture={domTexture}
        enableGlassOverlay={enableGlassOverlay}
        glassOpacity={glassOpacity}
        refractionIndex={refractionIndex}
        reflectionStrength={reflectionStrength}
        glassTint={glassTint}
        glassThickness={glassThickness}
        fresnelPower={fresnelPower}
        glassZOffset={glassZOffset}
        reflectionClamp={reflectionClamp}
        chromaticAberrationBlackLevel={chromaticAberrationBlackLevel}
        chromaticAberrationWhiteLevel={chromaticAberrationWhiteLevel}
        chromaticAberrationRedShift={chromaticAberrationRedShift}
        chromaticAberrationGreenShift={chromaticAberrationGreenShift}
        chromaticAberrationBlueShift={chromaticAberrationBlueShift}
        chromaticAberrationStrength={chromaticAberrationStrength}
      />

      {/* Auto‐fit camera to the monitor dimensions */}
      <AutoFitCamera screenWidth={totalWorldWidth + 0.01} screenHeight={totalWorldHeight + 0.01} />

      {/* Post-processing chain */}
      <EffectComposer>
        {/* Add your RenderPass, ShaderPass, and Bloom in correct order here if needed */}
        {/* 
          <Postprocessing.RenderPass attachArray="passes" scene={genericScene} camera={genericCamera} />
          <Postprocessing.ShaderPass attachArray="passes" material={glassPassMaterial} />
        */}
        {/* Bloom should come last */}
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

  // Debug menu visibility state
  const [showDebugControls, setShowDebugControls] = useState(false);

  // Window size using centralized hook
  const windowSize = useWindowSize();

  // Keyboard shortcut for debug controls (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        const newState = !showDebugControls;
        setShowDebugControls(newState);
        console.log(`Debug controls ${newState ? 'shown' : 'hidden'}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDebugControls]);

  // Debug positioning state (removed camera - using fixed position)
  const [housingZ, setHousingZ] = useState(-0.2);
  const [screenZ, setScreenZ] = useState(-0.100);
  const [debugMode, setDebugMode] = useState(0);

  // Added debug states for cutoutRadius and bevelSize
  const [cutoutRadius, setCutoutRadius] = useState(0.2);
  const [bevelSize, setBevelSize] = useState(0.01);

  // Terminal display state
  const [hideTerminalOverlay, setHideTerminalOverlay] = useState(true);
  const [terminalYOffset, setTerminalYOffset] = useState(100);

  // Map parameters
  const [cornerRoundness, setCornerRoundness] = useState(0.5);
  const [bubbleSize, setBubbleSize] = useState(0.97);
  const [edgeTransition, setEdgeTransition] = useState(0.62);
  const [displacementAmount, setDisplacementAmount] = useState(0.40);
  const [scanlineStrength, setScanlineStrength] = useState(0.4);
  const [lineSpacing, setLineSpacing] = useState(1.3); // Pixel-units that get converted to world units
  const [checkerboardSize, setCheckerboardSize] = useState(0.12); // World units per checkerboard square
  const [emissiveBoost, setEmissiveBoost] = useState(1.1);

  // Bloom parameters - Better defaults for the new setup
  const [bloomIntensity, setBloomIntensity] = useState(2.6);
  const [bloomKernelSize, setBloomKernelSize] = useState(3);
  const [bloomLuminanceThreshold, setBloomLuminanceThreshold] = useState(0.45);
  const [bloomLuminanceSmoothing, setBloomLuminanceSmoothing] = useState(0.4);

  // Added frame noise parameters (updated per instructions)
  const [frameNoiseScale, setFrameNoiseScale] = useState(0.4);
  // Temporarily increase the default for testing
  const [frameNoiseStrength, setFrameNoiseStrength] = useState(0.4);
  // Key light relative position
  const [keyLightIntensity, setKeyLightIntensity] = useState(0.4);
  const [keyLightXRel, setKeyLightXRel] = useState(-0.880);
  const [keyLightYRel, setKeyLightYRel] = useState(0.540);
  const [keyLightZRel, setKeyLightZRel] = useState(0.560);
  const [keyLightDistanceRel, setKeyLightDistanceRel] = useState(1.0);

  // LED & surround sphere radii
  const [ledRadiusPx, setLedRadiusPx] = useState(6);
  const [surroundRadius, setSurroundRadius] = useState(0.1);
  const [ledInset, setLedInset] = useState(0.005);
  
  // Glass overlay state
  const [enableGlassOverlay, setEnableGlassOverlay] = useState(true);
  const [glassOpacity, setGlassOpacity] = useState(0.99);
  const [refractionIndex, setRefractionIndex] = useState(1.9);
  const [reflectionStrength, setReflectionStrength] = useState(0.03);
  const [glassTint, setGlassTint] = useState<[number, number, number]>([0.45, 0.53, 0.58]);
  const [glassThickness, setGlassThickness] = useState(0.008);
  const [fresnelPower, setFresnelPower] = useState(0.1);
  const [glassZOffset, setGlassZOffset] = useState(0.02);
  const [reflectionClamp, setReflectionClamp] = useState(0.09);
  
  // Chromatic aberration state
  const [chromaticAberrationBlackLevel, setChromaticAberrationBlackLevel] = useState(0.0);
  const [chromaticAberrationWhiteLevel, setChromaticAberrationWhiteLevel] = useState(0.58);
  const [chromaticAberrationRedShift, setChromaticAberrationRedShift] = useState(1.0);
  const [chromaticAberrationGreenShift, setChromaticAberrationGreenShift] = useState(0);
  const [chromaticAberrationBlueShift, setChromaticAberrationBlueShift] = useState(-0.4);
  const [chromaticAberrationStrength, setChromaticAberrationStrength] = useState(0.6);

  // Margins (should match MainScene and Monitor3D)
  const marginTopPx = 12;
  const marginRightPx = 12;
  const marginBottomPx = 36;
  const marginLeftPx = 12;

  // NEW ARCHITECTURE: Render directly from entries data
  const domTexture = useTerminalDOM(entries, currentInput, isTyping, {
    marginTopPx,
    marginRightPx, 
    marginBottomPx,
    marginLeftPx
  });



  // Compute screen pixel and world sizes with safety checks
  const WORLD_PIXEL = 0.003;
  // Ensure screen dimensions are positive (minimum 1px each)
  const screenPxWidth = Math.max(windowSize.width - marginLeftPx - marginRightPx, 1);
  const screenPxHeight = Math.max(windowSize.height - marginTopPx - marginBottomPx, 1);
  const screenWorldWidth = screenPxWidth * WORLD_PIXEL;
  const screenWorldHeight = screenPxHeight * WORLD_PIXEL;

  // Queue & Spinner Logic (from chat integration plan)
  const messageQueue = useRef<string[]>([]);
  const processing = useRef(false);

  const processQueue = async () => {
    if (processing.current || messageQueue.current.length === 0) return;
    processing.current = true;

    const input = messageQueue.current.shift()!;
    const userEntry = new TextEntry(input);
    const pendingEntry = new PendingEntry();

    setEntries(prev => [...prev, userEntry, pendingEntry]);

    try {
      const res = await fetch('/api/nyx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: input }] }),
      });

      if (!res.ok) {
        console.error('API response not ok:', res.status, res.statusText);
        const errorText = await res.text();
        console.error('Error response body:', errorText);
        throw new Error(`API returned ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      console.log('API response data:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      const nyxReply = new TextEntry(data.content);
      setEntries(prev => [...prev.filter(e => e.id !== pendingEntry.id), nyxReply]);
    } catch (err) {
      console.error('Nyx API error:', err);
      setEntries(prev => [...prev.filter(e => e.id !== pendingEntry.id), new TextEntry('⚠️ Nyx encountered an error.')]);
    } finally {
      processing.current = false;
      processQueue();
    }
  };

  const handleUserSubmit = (input: string) => {
    messageQueue.current.push(input);
    processQueue();
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
        onCreated={(state) => {
          // Add ResizeObserver to track Canvas size changes
          const canvas = state.gl.domElement;
          const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
              const { width, height } = entry.contentRect;
              console.log('🖼️ Canvas ResizeObserver: Canvas size changed', { width, height });
            }
          });
          observer.observe(canvas);
          
          // Store observer on state for cleanup
          // @ts-expect-error - temporary debugging observer
          state.resizeObserver = observer;
        }}
      >
        <MainScene
          screenZ={screenZ}
          marginTopPx={marginTopPx}
          marginRightPx={marginRightPx}
          marginBottomPx={marginBottomPx}
          marginLeftPx={marginLeftPx}
          scanlineStrength={scanlineStrength}
          lineSpacing={lineSpacing}
          cornerRoundness={cornerRoundness}
          bubbleSize={bubbleSize}
          edgeTransition={edgeTransition}
          displacementAmount={displacementAmount}
          emissiveBoost={emissiveBoost}
          bloomIntensity={bloomIntensity}
          bloomKernelSize={bloomKernelSize}
          bloomLuminanceThreshold={bloomLuminanceThreshold}
          bloomLuminanceSmoothing={bloomLuminanceSmoothing}
          debugMode={debugMode}
          screenWorldWidth={screenWorldWidth}
          screenWorldHeight={screenWorldHeight}
          cutoutRadius={cutoutRadius}
          bevelSize={bevelSize}
          frameNoiseScale={frameNoiseScale}
          frameNoiseStrength={frameNoiseStrength}
          keyLightIntensity={keyLightIntensity}
          keyLightXRel={keyLightXRel}
          keyLightYRel={keyLightYRel}
          keyLightZRel={keyLightZRel}
          keyLightDistanceRel={keyLightDistanceRel}
          ledRadiusPx={ledRadiusPx}
          // surroundRadius={surroundRadius}
          ledInset={ledInset}
          checkerboardSize={checkerboardSize}
          domTexture={domTexture}
          enableGlassOverlay={enableGlassOverlay}
          glassOpacity={glassOpacity}
          refractionIndex={refractionIndex}
          reflectionStrength={reflectionStrength}
          glassTint={glassTint}
          glassThickness={glassThickness}
          fresnelPower={fresnelPower}
          glassZOffset={glassZOffset}
          reflectionClamp={reflectionClamp}
          chromaticAberrationBlackLevel={chromaticAberrationBlackLevel}
          chromaticAberrationWhiteLevel={chromaticAberrationWhiteLevel}
          chromaticAberrationRedShift={chromaticAberrationRedShift}
          chromaticAberrationGreenShift={chromaticAberrationGreenShift}
          chromaticAberrationBlueShift={chromaticAberrationBlueShift}
          chromaticAberrationStrength={chromaticAberrationStrength}
        />
      </Canvas>

      {/* Debug Controls */}
      {showDebugControls && (
        <DebugControls
          housingZ={housingZ}
          screenZ={screenZ}
          onHousingZChange={setHousingZ}
          onScreenZChange={setScreenZ}
          scanlineStrength={scanlineStrength}
          lineSpacing={lineSpacing}
          cornerRoundness={cornerRoundness}
          bubbleSize={bubbleSize}
          edgeTransition={edgeTransition}
          displacementAmount={displacementAmount}
          emissiveBoost={emissiveBoost}
          onScanlineStrengthChange={setScanlineStrength}
          onLineSpacingChange={setLineSpacing}
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
          cutoutRadius={cutoutRadius}
          bevelSize={bevelSize}
          onCutoutRadiusChange={setCutoutRadius}
          onBevelSizeChange={setBevelSize}
          frameNoiseScale={frameNoiseScale}
          frameNoiseStrength={frameNoiseStrength}
          onFrameNoiseScaleChange={setFrameNoiseScale}
          onFrameNoiseStrengthChange={setFrameNoiseStrength}
          // key light
          keyLightXRel={keyLightXRel}
          keyLightYRel={keyLightYRel}
          keyLightZRel={keyLightZRel}
          keyLightIntensity={keyLightIntensity}
          keyLightDistanceRel={keyLightDistanceRel}
          onKeyLightIntensityChange={setKeyLightIntensity}
          onKeyLightXRelChange={setKeyLightXRel}
          onKeyLightYRelChange={setKeyLightYRel}
          onKeyLightZRelChange={setKeyLightZRel}
          onKeyLightDistanceRelChange={setKeyLightDistanceRel}
          // led and surround
          ledRadiusPx={ledRadiusPx}
          surroundRadius={surroundRadius}
          onLedRadiusPxChange={setLedRadiusPx}
          onSurroundRadiusChange={setSurroundRadius}
          ledInset={ledInset}
          onLedInsetChange={setLedInset}
          checkerboardSize={checkerboardSize}
          onCheckerboardSizeChange={setCheckerboardSize}
          enableGlassOverlay={enableGlassOverlay}
          glassOpacity={glassOpacity}
          refractionIndex={refractionIndex}
          reflectionStrength={reflectionStrength}
          glassTint={glassTint}
          glassThickness={glassThickness}
          fresnelPower={fresnelPower}
          glassZOffset={glassZOffset}
          onEnableGlassOverlayChange={setEnableGlassOverlay}
          onGlassOpacityChange={setGlassOpacity}
          onRefractionIndexChange={setRefractionIndex}
          onReflectionStrengthChange={setReflectionStrength}
          onGlassTintChange={setGlassTint}
          onGlassThicknessChange={setGlassThickness}
          onFresnelPowerChange={setFresnelPower}
          onGlassZOffsetChange={setGlassZOffset}
          reflectionClamp={reflectionClamp}
          onReflectionClampChange={setReflectionClamp}
          chromaticAberrationBlackLevel={chromaticAberrationBlackLevel}
          chromaticAberrationWhiteLevel={chromaticAberrationWhiteLevel}
          chromaticAberrationRedShift={chromaticAberrationRedShift}
          chromaticAberrationGreenShift={chromaticAberrationGreenShift}
          chromaticAberrationBlueShift={chromaticAberrationBlueShift}
          onChromaticAberrationBlackLevelChange={setChromaticAberrationBlackLevel}
          onChromaticAberrationWhiteLevelChange={setChromaticAberrationWhiteLevel}
          onChromaticAberrationRedShiftChange={setChromaticAberrationRedShift}
          onChromaticAberrationGreenShiftChange={setChromaticAberrationGreenShift}
          onChromaticAberrationBlueShiftChange={setChromaticAberrationBlueShift}
          chromaticAberrationStrength={chromaticAberrationStrength}
          onChromaticAberrationStrengthChange={setChromaticAberrationStrength}
        />
      )}



      {/* Terminal overlay - now with visibility control */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="pointer-events-auto">
          <TerminalController
            entries={entries}
            onCurrentInputChange={setCurrentInput}
            onTypingStateChange={setIsTyping}
            onUserSubmit={handleUserSubmit}
            hideVisualContent={hideTerminalOverlay}
            yOffset={terminalYOffset}
          />
        </div>
      </div>
    </div>
  );
}


function AutoFitCamera({ screenWidth, screenHeight }: { screenWidth: number; screenHeight: number }) {
  const { camera: genericCamera } = useThree();
  const windowSize = useWindowSize();
  
  useEffect(() => {
    console.log('📷 AutoFitCamera: useEffect triggered', { 
      screenWidth, 
      screenHeight, 
      windowWidth: windowSize.width, 
      windowHeight: windowSize.height 
    });
    const camera = genericCamera as PerspectiveCamera;
    if (!(camera instanceof PerspectiveCamera)) return;
    
    // Validate screen dimensions to prevent NaN calculations
    const safeScreenWidth = Math.max(screenWidth || 0.001, 0.001);
    const safeScreenHeight = Math.max(screenHeight || 0.001, 0.001);
    
    // Calculate monitor diagonal in world units
    const diagonal = Math.sqrt(safeScreenWidth * safeScreenWidth + safeScreenHeight * safeScreenHeight);
    
    // Set viewing distance to a natural multiple of the diagonal
    // This simulates sitting at a proper distance from a real monitor
    const naturalViewingDistance = diagonal * 1.8; // 1.8x diagonal is a comfortable viewing distance
    
    // Set camera position
    camera.position.set(0, 0, naturalViewingDistance);
    
    // Optionally adjust FOV to keep monitor reasonably sized in view
    // But prioritize natural perspective over perfect fit
    const minFOV = 35; // Prevent too narrow FOV
    const maxFOV = 65; // Prevent too wide FOV (which causes distortion)
    
    // Calculate what FOV would be needed to show the monitor height
    const currentFOV = camera.fov;
    const vFov = (currentFOV * Math.PI) / 180;
    const distanceToFillVertically = (safeScreenHeight / 2) / Math.tan(vFov / 2);
    
    // If our natural distance is much different than what's needed to fill,
    // adjust FOV slightly, but within reasonable bounds
    if (naturalViewingDistance > distanceToFillVertically * 1.5) {
      // Monitor would be too small, decrease FOV a bit
      const newVFov = 2 * Math.atan((safeScreenHeight / 2) / naturalViewingDistance);
      const newFOVDegrees = (newVFov * 180) / Math.PI;
      camera.fov = Math.max(minFOV, Math.min(maxFOV, newFOVDegrees));
    } else if (naturalViewingDistance < distanceToFillVertically * 0.7) {
      // Monitor would be too large, increase FOV a bit
      const newVFov = 2 * Math.atan((safeScreenHeight / 2) / naturalViewingDistance);
      const newFOVDegrees = (newVFov * 180) / Math.PI;
      camera.fov = Math.max(minFOV, Math.min(maxFOV, newFOVDegrees));
    } else {
      // Keep the current FOV if it's reasonable
      camera.fov = Math.max(minFOV, Math.min(maxFOV, currentFOV));
    }
    
    camera.updateProjectionMatrix();
  }, [genericCamera, windowSize.width, windowSize.height, screenWidth, screenHeight]);
  return null;
}