'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { PerspectiveCamera } from 'three';
import ScreenMesh from './ScreenMesh';
import * as THREE from 'three';
import { RoundedBoxGeometry } from '@react-three/drei';
import { TerminalEntry } from '../lib/terminal-types';
import { useTerminalCanvas } from '../utils/useTerminalCanvas';
// Fixed thickness of monitor housing (front face to back)
const HOUSING_DEPTH = 0.3;

interface Monitor3DProps {
  screenZ?: number;
  marginTopPx: number;
  marginRightPx: number;
  marginBottomPx: number;
  marginLeftPx: number;
  scanlineStrength?: number;
  lineSpacing?: number;
  cornerRoundness?: number;
  bubbleSize?: number;
  edgeTransition?: number;
  displacementAmount?: number;
  emissiveBoost?: number;
  terminalEntries?: TerminalEntry[];
  currentInput?: string;
  isTyping?: boolean;
  debugMode?: number;
}

// Adjustable bump map intensity
const bumpScale = 2.0; // Increase for more pronounced texture
const filletRadius = 0.02; // Fillet radius for rounded edges
const filletSmoothness = 6; // Number of segments for smoothness

// Utility to generate a simple noise texture for bump mapping
function generateNoiseTexture(size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture(); // fallback: empty texture
  const imgData = ctx.createImageData(size, size);
  for (let i = 0; i < size * size * 4; i += 4) {
    const val = Math.floor(Math.random() * 64) + 192; // subtle noise
    imgData.data[i] = val;
    imgData.data[i + 1] = val;
    imgData.data[i + 2] = val;
    imgData.data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  return texture;
}

export default function Monitor3D({ 
  screenZ = -0.05, 
  marginTopPx, 
  marginRightPx, 
  marginBottomPx, 
  marginLeftPx,
  scanlineStrength = 0.4,
  lineSpacing = 800.0,
  cornerRoundness = 0.4,
  bubbleSize = 0.99,
  edgeTransition = 0.15,
  displacementAmount = 0.07,
  emissiveBoost = 1.2,
  terminalEntries = [],
  currentInput = '',
  isTyping = false,
  debugMode = 0
}: Monitor3DProps) {
  const monitorRef = useRef<THREE.Group>(null);

  // Track window size for world-unit calculation
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const onResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Compute world-units-per-CSS-pixel at the front face depth
  const { camera: genericCamera } = useThree();
  const camera = genericCamera as PerspectiveCamera;
  const fovRad = (camera.fov * Math.PI) / 180;
  // distance from camera to enclosure front face at Z=0
  const dist = camera.position.z;
  // world units per CSS pixel so geometry will fill view
  // Add safety check to prevent division by zero and ensure reasonable values
  const safeWindowHeight = Math.max(windowSize.height, 1); // Minimum 1px to prevent division by zero
  const worldPx = (2 * dist * Math.tan(fovRad / 2)) / safeWindowHeight;
  
  // Validate worldPx to ensure it's a reasonable finite number
  const safeWorldPx = (isFinite(worldPx) && worldPx > 0) ? worldPx : 0.001; // Fallback to small positive value

  // Calculate screen dimensions with validation
  const rawScreenWidth = windowSize.width - marginLeftPx - marginRightPx;
  const rawScreenHeight = windowSize.height - marginTopPx - marginBottomPx;
  
  // Ensure screen dimensions are positive (minimum 1px each)
  const safeScreenPxWidth = Math.max(rawScreenWidth, 1);
  const safeScreenPxHeight = Math.max(rawScreenHeight, 1);
  
  const screenWorldWidth = safeScreenPxWidth * safeWorldPx;
  const screenWorldHeight = safeScreenPxHeight * safeWorldPx;
  
  // Calculate frame dimensions with minimum thresholds
  const minFramePx = 8; // Minimum 8 pixels for any frame dimension
  const safeMarginLeft = Math.max(marginLeftPx, minFramePx);
  const safeMarginRight = Math.max(marginRightPx, minFramePx);
  const safeMarginTop = Math.max(marginTopPx, minFramePx);
  const safeMarginBottom = Math.max(marginBottomPx, minFramePx);
  
  const frameLeft = safeMarginLeft * safeWorldPx;
  const frameRight = safeMarginRight * safeWorldPx;
  const frameTop = safeMarginTop * safeWorldPx;
  const frameBottom = safeMarginBottom * safeWorldPx;

  // Center offsets so inner edges align with margins
  const xOffset = (frameRight - frameLeft) / 2;
  const yOffset = (frameBottom - frameTop) / 2;

  // Mesh dimensions: add slight padding if desired
  const screenMeshWidth = screenWorldWidth + 0.01;
  const screenMeshHeight = screenWorldHeight + 0.01;

  // Power LED: 8px radius LED at 48px from edges, at housing front depth
  // variables for power LED position with safe calculations
  const ledXoffset = 8;
  const ledYoffset = -18;
  const ledRadius = 6;
  const ledRadiusWorld = Math.max(ledRadius * safeWorldPx, 0.001); // Ensure minimum LED size
  const ledX = screenWorldWidth / 2 - ledXoffset * safeWorldPx;
  const ledY = -screenWorldHeight / 2 + ledYoffset * safeWorldPx;
  const ledZ = HOUSING_DEPTH / 2;

  // Memoize the plastic material for the frame
  const frameMaterial = useMemo(() => {
    const bumpMap = generateNoiseTexture();
    return new THREE.MeshPhysicalMaterial({
      color: '#2a2a2a',
      roughness: 0.45,
      metalness: 0.05,
      clearcoat: 0.05,
      clearcoatRoughness: 0.5,
      bumpMap,
      bumpScale,
    });
  }, []);

  // Generate terminal texture using canvas rendering with safe dimensions
  const terminalTexture = useTerminalCanvas(terminalEntries, {
    width: safeScreenPxWidth,
    height: safeScreenPxHeight,
    backgroundColor: '#000000',
    textColor: '#ffffff',
    fontSize: 16,
    fontFamily: 'monospace',
    lineHeight: 1.2,
    padding: 16,
    spaceBetweenEntries: 4,
    currentInput,
    isTyping
  });

  // Make frame pieces much thicker to ensure no gaps at screen edges
  const thicknessFactor = 5; // Make frame pieces 5x thicker than the margins
  const thickFrameTop = frameTop * thicknessFactor;
  const thickFrameBottom = frameBottom * thicknessFactor;
  const thickFrameLeft = frameLeft * thicknessFactor;
  const thickFrameRight = frameRight * thicknessFactor;

  // Ensure all geometry dimensions are valid and above minimum thresholds
  // RoundedBoxGeometry requires dimensions > 0 and radius < smallest dimension / 2
  const minGeometrySize = 0.001; // Minimum geometry dimension in world units
  const safeRadius = Math.min(filletRadius, 
    Math.min(thickFrameTop, thickFrameBottom, thickFrameLeft, thickFrameRight, HOUSING_DEPTH) / 3
  );

  // Validate all frame dimensions
  const safeThickFrameTop = Math.max(thickFrameTop, minGeometrySize);
  const safeThickFrameBottom = Math.max(thickFrameBottom, minGeometrySize);
  const safeThickFrameLeft = Math.max(thickFrameLeft, minGeometrySize);
  const safeThickFrameRight = Math.max(thickFrameRight, minGeometrySize);
  const safeScreenWorldWidth = Math.max(screenWorldWidth, minGeometrySize);
  const safeScreenWorldHeight = Math.max(screenWorldHeight, minGeometrySize);

  return (
    <group ref={monitorRef} position={[xOffset, yOffset, 0 - HOUSING_DEPTH / 2]}>
      {/* Top frame */}
      <mesh position={[0, safeScreenWorldHeight / 2 + safeThickFrameTop / 2, 0]} castShadow={true} receiveShadow={true}>
        <RoundedBoxGeometry
          args={[
            safeScreenWorldWidth + safeThickFrameLeft + safeThickFrameRight,
            safeThickFrameTop,
            HOUSING_DEPTH
          ]}
          radius={safeRadius}
          smoothness={filletSmoothness}
        />
        <primitive object={frameMaterial} attach="material" />
      </mesh>
      {/* Bottom frame */}
      <mesh position={[0, -safeScreenWorldHeight / 2 - safeThickFrameBottom / 2, 0]} castShadow={true} receiveShadow={true}>
        <RoundedBoxGeometry
          args={[
            safeScreenWorldWidth + safeThickFrameLeft + safeThickFrameRight,
            safeThickFrameBottom,
            HOUSING_DEPTH
          ]}
          radius={safeRadius}
          smoothness={filletSmoothness}
        />
        <primitive object={frameMaterial} attach="material" />
      </mesh>
      {/* Left frame */}
      <mesh position={[-safeScreenWorldWidth / 2 - safeThickFrameLeft / 2, 0, 0]} castShadow={true} receiveShadow={true}>
        <RoundedBoxGeometry
          args={[
            safeThickFrameLeft,
            safeScreenWorldHeight + safeThickFrameTop + safeThickFrameBottom,
            HOUSING_DEPTH
          ]}
          radius={safeRadius}
          smoothness={filletSmoothness}
        />
        <primitive object={frameMaterial} attach="material" />
      </mesh>
      {/* Right frame */}
      <mesh position={[safeScreenWorldWidth / 2 + safeThickFrameRight / 2, 0, 0]} castShadow={true} receiveShadow={true}>
        <RoundedBoxGeometry
          args={[
            safeThickFrameRight,
            safeScreenWorldHeight + safeThickFrameTop + safeThickFrameBottom,
            HOUSING_DEPTH
          ]}
          radius={safeRadius}
          smoothness={filletSmoothness}
        />
        <primitive object={frameMaterial} attach="material" />
      </mesh>
      {/* Screen area - RECESSED into housing */}
      <group position={[0, 0, screenZ]}>
        <ScreenMesh
          width={Math.max(screenMeshWidth, minGeometrySize)}
          height={Math.max(screenMeshHeight, minGeometrySize)}
          yOffset={0}
          debugMode={debugMode}
          scanlineStrength={scanlineStrength}
          lineSpacing={lineSpacing}
          cornerRoundness={cornerRoundness}
          bubbleSize={bubbleSize}
          edgeTransition={edgeTransition}
          displacementAmount={displacementAmount}
          emissiveBoost={emissiveBoost}
          terminalTexture={terminalTexture}
        />
      </group>
      {/* Lighting */}
      {/* Key light */}
      <pointLight
        position={[-1,1,3]}
        color="#ffb59c"
        intensity={4}
        distance={10}
        decay={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {/* Power LED */}
      <group position={[ledX, ledY, ledZ]}>
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <sphereGeometry args={[ledRadiusWorld, 36, 36]} />
          <meshPhysicalMaterial
            color="#fff0c7"
            emissive="#fff0c7"
            emissiveIntensity={1.0}
            roughness={0.32}
            metalness={0.0}
            clearcoat={0.2}
            clearcoatRoughness={0.3}
          />
        </mesh>
        <pointLight
          color="#fff0c7"
          intensity={0.01}
          distance={0}
          decay={2}
          castShadow={true}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          position={[0, 0, .1]}
        />
      </group>
    </group>
  );
}