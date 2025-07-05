'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import ScreenShaderMaterial from './ScreenShaderMaterial';

interface ScreenMeshProps {
  width: number;
  height: number;
  yOffset: number;
  debugMode?: number; // 0 = normal, 1 = displacement map, 2 = scanlines
  edgeHarshness?: number;
  edgeWidth?: number;
  centerSoftness?: number;
  cornerRoundness?: number;
  bubbleSize?: number;
  edgeTransition?: number;
}

export default function ScreenMesh({ 
  width, 
  height, 
  yOffset, 
  debugMode = 0,
  edgeHarshness = 5.4,
  edgeWidth = 0.22,
  centerSoftness = 0.1,
  cornerRoundness = 1.0,
  bubbleSize = 0.8,
  edgeTransition = 0.1
}: ScreenMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create flat plane geometry - no curvature for now
  const flatGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(width, height, 1, 1);
  }, [width, height]);

  return (
    <mesh 
      ref={meshRef}
      geometry={flatGeometry}
      position={[0, yOffset, 0]}
      castShadow={false}
      receiveShadow={false}
    >
      <ScreenShaderMaterial 
        debugMode={debugMode}
        edgeHarshness={edgeHarshness}
        edgeWidth={edgeWidth}
        centerSoftness={centerSoftness}
        cornerRoundness={cornerRoundness}
        bubbleSize={bubbleSize}
        edgeTransition={edgeTransition}
      />
    </mesh>
  );
} 