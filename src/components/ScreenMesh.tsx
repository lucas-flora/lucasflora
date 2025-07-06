'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import ScreenShaderMaterial from './ScreenShaderMaterial';

interface ScreenMeshProps {
  width: number;
  height: number;
  yOffset: number;
  debugMode?: number; // 0 = normal, 1 = bubble map, 2 = scanlines, 3 = checkerboard, 4 = scanline test
  scanlineStrength?: number;
  scanlineScale?: number;
  cornerRoundness?: number;
  bubbleSize?: number;
  edgeTransition?: number;
  displacementAmount?: number;
  emissiveBoost?: number;
  terminalTexture?: THREE.Texture | null;
}

export default function ScreenMesh({ 
  width, 
  height, 
  yOffset, 
  debugMode = 0,
  scanlineStrength = 0.4,
  scanlineScale = 800.0,
  cornerRoundness = 0.4,
  bubbleSize = 0.99,
  edgeTransition = 0.15,
  displacementAmount = 0.07,
  emissiveBoost = 1.2,
  terminalTexture
}: ScreenMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create subdivided plane geometry for smooth displacement
  const subdivisionGeometry = useMemo(() => {
    // Use enough subdivisions for smooth curves - 128x128 should be plenty
    const segments = 128;
    return new THREE.PlaneGeometry(width, height, segments, segments);
  }, [width, height]);

  return (
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
        scanlineScale={scanlineScale}
        cornerRoundness={cornerRoundness}
        bubbleSize={bubbleSize}
        edgeTransition={edgeTransition}
        displacementAmount={displacementAmount}
        emissiveBoost={emissiveBoost}
        terminalTexture={terminalTexture || undefined}
      />
    </mesh>
  );
} 