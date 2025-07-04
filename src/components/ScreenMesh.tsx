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
  
  // Screen dimensions based on WINDOW - MATCH Monitor3D exactly
  const screenDimensions = useMemo(() => {
    if (windowSize.width === 0) return { width: 4, height: 3 }; // Default until ready
    
    // Must match Monitor3D calculations exactly
    const windowAspectRatio = windowSize.width / windowSize.height;
    const screenWidth = Math.min(windowSize.width * 0.004, 8); // SAME as Monitor3D
    const screenHeight = screenWidth / windowAspectRatio; // SAME as Monitor3D
    
    return {
      width: screenWidth,
      height: screenHeight,
    };
  }, [windowSize]); // Depends on windowSize - will update on resize!

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