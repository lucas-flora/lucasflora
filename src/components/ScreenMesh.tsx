'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import ScreenShaderMaterial from './ScreenShaderMaterial';
import GlassOverlay from './GlassOverlay';

interface ScreenMeshProps {
  width: number;
  height: number;
  yOffset: number;
  debugMode?: number; // 0 = normal, 1 = bubble map, 2 = scanlines, 3 = checkerboard, 4 = scanline test
  scanlineStrength?: number;
  lineSpacing?: number;
  cornerRoundness?: number;
  bubbleSize?: number;
  edgeTransition?: number;
  displacementAmount?: number;
  emissiveBoost?: number;
  checkerboardSize?: number;
  terminalTexture?: THREE.Texture | null;
  // Glass overlay properties
  enableGlassOverlay?: boolean;
  glassOpacity?: number;
  refractionIndex?: number;
  reflectionStrength?: number;
  glassTint?: [number, number, number];
  glassThickness?: number;
  fresnelPower?: number;
  glassZOffset?: number;
  envMap?: THREE.CubeTexture;
  reflectionClamp?: number;
}

export default function ScreenMesh({ 
  width, 
  height, 
  yOffset, 
  debugMode = 0,
  scanlineStrength = 0.4,
  lineSpacing = 25, // Pixel-units that get converted to world units
  cornerRoundness = 0.4,
  bubbleSize = 0.99,
  edgeTransition = 0.15,
  displacementAmount = 0.07,
  emissiveBoost = 1.2,
  checkerboardSize = 0.1,
  terminalTexture,
  // Glass overlay properties
  enableGlassOverlay = true,
  glassOpacity = 0.1,
  refractionIndex = 1.5,
  reflectionStrength = 0.3,
  glassTint = [0.9, 0.95, 1.0],
  glassThickness = 0.01,
  fresnelPower = 2.0,
  glassZOffset = 0.005,
  envMap,
  reflectionClamp = 1.0,
}: ScreenMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create subdivided plane geometry for smooth displacement
  const subdivisionGeometry = useMemo(() => {
    // Use enough subdivisions for smooth curves - 128x128 should be plenty
    const segments = 128;
    return new THREE.PlaneGeometry(width, height, segments, segments);
  }, [width, height]);

  return (
    <group>
      {/* Main screen mesh */}
      <mesh 
        ref={meshRef}
        geometry={subdivisionGeometry}
        position={[0, yOffset, 0]}
        castShadow={false}
        receiveShadow={false}
      >
        <ScreenShaderMaterial 
          debugMode={debugMode}
          scanlineStrength={scanlineStrength}
          lineSpacing={lineSpacing}
          cornerRoundness={cornerRoundness}
          bubbleSize={bubbleSize}
          edgeTransition={edgeTransition}
          displacementAmount={displacementAmount}
          emissiveBoost={emissiveBoost}
          terminalTexture={terminalTexture || undefined}
          screenWidth={width}
          screenHeight={height}
          checkerboardSize={checkerboardSize}
        />
      </mesh>
      
      {/* Glass overlay mesh */}
      {enableGlassOverlay && (
        <GlassOverlay
          width={width}
          height={height}
          yOffset={yOffset}
          cornerRoundness={cornerRoundness}
          bubbleSize={bubbleSize}
          edgeTransition={edgeTransition}
          displacementAmount={displacementAmount}
          glassOpacity={glassOpacity}
          refractionIndex={refractionIndex}
          reflectionStrength={reflectionStrength}
          glassTint={glassTint}
          glassThickness={glassThickness}
          fresnelPower={fresnelPower}
          glassZOffset={glassZOffset}
          envMap={envMap}
          reflectionClamp={reflectionClamp}
        />
      )}
    </group>
  );
} 