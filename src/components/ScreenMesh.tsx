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
}

export default function ScreenMesh({ 
  width, 
  height, 
  yOffset, 
  debugMode = 0,
  cornerRoundness = 0.4,
  bubbleSize = 0.98,
  edgeTransition = 0.06
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
        cornerRoundness={cornerRoundness}
        bubbleSize={bubbleSize}
        edgeTransition={edgeTransition}
      />
    </mesh>
  );
} 