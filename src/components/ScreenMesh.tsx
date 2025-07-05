'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import ScreenShaderMaterial from './ScreenShaderMaterial';

interface ScreenMeshProps {
  width: number;
  height: number;
  yOffset: number;
  debugMode?: number; // 0 = normal, 1 = bubble map, 2 = scanlines, 3 = checkerboard
  cornerRoundness?: number;
  bubbleSize?: number;
  edgeTransition?: number;
  displacementAmount?: number;
}

export default function ScreenMesh({ 
  width, 
  height, 
  yOffset, 
  debugMode = 0,
  cornerRoundness = 0.4,
  bubbleSize = 0.98,
  edgeTransition = 0.06,
  displacementAmount = 0.1
}: ScreenMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create subdivided plane geometry for smooth displacement
  const subdivisionGeometry = useMemo(() => {
    // Use enough subdivisions for smooth curves - 64x64 should be plenty
    const segments = 64;
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
        cornerRoundness={cornerRoundness}
        bubbleSize={bubbleSize}
        edgeTransition={edgeTransition}
        displacementAmount={displacementAmount}
      />
    </mesh>
  );
} 