'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';

interface ScreenMeshProps {
  width: number;
  height: number;
  yOffset: number;
}

export default function ScreenMesh({ width, height, yOffset }: ScreenMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create flat plane geometry - no curvature for now
  const flatGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(width, height, 1, 1);
  }, [width, height]);

  // Basic material for now - will be replaced with canvas texture later
  const screenMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#00FFFF', // DEBUG: Bright cyan for screen
      side: THREE.FrontSide,
    });
  }, []);

  return (
    <mesh 
      ref={meshRef}
      geometry={flatGeometry}
      material={screenMaterial}
      position={[0, yOffset, 0]}
    />
  );
} 