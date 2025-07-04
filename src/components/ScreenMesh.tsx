'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';

// interface ScreenMeshProps {
//   // Future: will accept canvas texture
// }

export default function ScreenMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // Listen for window resize events - SAME AS Monitor3D
  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    // Set initial size
    updateWindowSize();
    
    // Add resize listener
    window.addEventListener('resize', updateWindowSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', updateWindowSize);
  }, []);
  
  // Screen dimensions based on camera frustum (matches Monitor3D)
  const screenDimensions = useMemo(() => {
    if (windowSize.width === 0) return { width: 4, height: 3 }; // Default until ready

    const windowAspectRatio = windowSize.width / windowSize.height;

    // Camera parameters (keep in sync with page.tsx)
    const cameraZ = 2.6;
    const screenZ = -0.05; // Same default
    const cameraFovDeg = 50;
    const verticalFovRad = THREE.MathUtils.degToRad(cameraFovDeg);

    const zDistance = cameraZ - screenZ;
    const visibleHeight = 2 * zDistance * Math.tan(verticalFovRad / 2);
    const visibleWidth = visibleHeight * windowAspectRatio;

    // Margin in pixels (should match frame thickness in Monitor3D)
    const marginPx = 24;
    const unitsPerPixel = visibleHeight / windowSize.height;
    const marginWorld = unitsPerPixel * marginPx;

    return {
      width: visibleWidth - 2 * marginWorld,
      height: visibleHeight - 2 * marginWorld,
    };
  }, [windowSize]);

  // Create flat plane geometry - no curvature for now
  const flatGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(
      screenDimensions.width, 
      screenDimensions.height, 
      1, // Simple flat plane
      1  // Simple flat plane
    );
    
    return geometry;
  }, [screenDimensions]);

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
      position={[0, 0, 0]}
    />
  );
} 