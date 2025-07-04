'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
// import { RoundedBox } from '@react-three/drei'; // Not needed for frame-based housing
import * as THREE from 'three';

interface Monitor3DProps {
  children?: React.ReactNode;
  housingZ?: number;
  screenZ?: number;
}

export default function Monitor3D({ children, housingZ = -0.2, screenZ = -0.05 }: Monitor3DProps) {
  const monitorRef = useRef<THREE.Group>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // Listen for window resize events
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
  
  // Dimensions based on WINDOW size - RESPONSIVE to window changes
  const dimensions = useMemo(() => {
    if (windowSize.width === 0) {
      // Default until ready
      return {
        screen: { width: 4, height: 3 },
        housing: { width: 4.32, height: 3.24, depth: 0.4 },
        bezel: { thickness: 0.08, depth: 0.08 },
        radius: 0.1,
      };
    }
    
    // Get window aspect ratio (not camera-dependent)
    const windowAspectRatio = windowSize.width / windowSize.height;
    
    // Base screen size that fills most of the window - MUCH BIGGER
    const screenWidth = Math.min(windowSize.width * 0.004, 8); // Much bigger scale
    const screenHeight = screenWidth / windowAspectRatio; // Match window aspect ratio
    
    // Housing dimensions 
    const housingWidth = screenWidth * 1.08; // Small frame around screen
    const housingHeight = screenHeight * 1.08;
    const housingDepth = 0.4;
    
    // Bezel dimensions
    const bezelThickness = screenWidth * 0.02; // Proportional to screen
    const bezelDepth = 0.08;
    
    const dims = {
      screen: { width: screenWidth, height: screenHeight },
      housing: { width: housingWidth, height: housingHeight, depth: housingDepth },
      bezel: { thickness: bezelThickness, depth: bezelDepth },
      radius: Math.min(housingWidth, housingHeight) * 0.04,
    };
    
    // DEBUG: Log dimensions
    console.log('Monitor dimensions (RESPONSIVE):', dims, 'Window:', windowSize, 'Aspect:', windowAspectRatio);
    
    return dims;
  }, [windowSize]); // Depends on windowSize - will update on resize!

  return (
    <group ref={monitorRef}>
      {/* Housing Frame with CUTOUT - made of separate pieces - DIFFERENT SHADES */}
      {/* Back panel (solid) - Darkest red */}
      <mesh position={[0, 0, housingZ - dimensions.housing.depth / 2]}>
        <boxGeometry args={[dimensions.housing.width, dimensions.housing.height, 0.02]} />
        <meshBasicMaterial color="#CC0000" />
      </mesh>
      
      {/* Top frame piece - Bright red */}
      <mesh position={[0, dimensions.screen.height / 2 + dimensions.bezel.thickness / 2, housingZ]}>
        <boxGeometry args={[
          dimensions.housing.width, 
          (dimensions.housing.height - dimensions.screen.height) / 2, 
          dimensions.housing.depth
        ]} />
        <meshBasicMaterial color="#FF0000" />
      </mesh>
      
      {/* Bottom frame piece - Pink red */}
      <mesh position={[0, -dimensions.screen.height / 2 - dimensions.bezel.thickness / 2, housingZ]}>
        <boxGeometry args={[
          dimensions.housing.width, 
          (dimensions.housing.height - dimensions.screen.height) / 2, 
          dimensions.housing.depth
        ]} />
        <meshBasicMaterial color="#FF3333" />
      </mesh>
      
      {/* Left frame piece - Orange red */}
      <mesh position={[-dimensions.screen.width / 2 - dimensions.bezel.thickness / 2, 0, housingZ]}>
        <boxGeometry args={[
          (dimensions.housing.width - dimensions.screen.width) / 2, 
          dimensions.screen.height, 
          dimensions.housing.depth
        ]} />
        <meshBasicMaterial color="#FF6600" />
      </mesh>
      
      {/* Right frame piece - Dark orange red */}
      <mesh position={[dimensions.screen.width / 2 + dimensions.bezel.thickness / 2, 0, housingZ]}>
        <boxGeometry args={[
          (dimensions.housing.width - dimensions.screen.width) / 2, 
          dimensions.screen.height, 
          dimensions.housing.depth
        ]} />
        <meshBasicMaterial color="#DD4400" />
      </mesh>

      {/* Bezel removed - screen will sit directly in enclosure */}

      {/* Power LED - DEBUG: BRIGHT GREEN */}
      <mesh 
        position={[
          dimensions.housing.width * 0.35, 
          -dimensions.housing.height * 0.35, 
          0.005
        ]}
      >
        <sphereGeometry args={[0.03, 12, 12]} /> {/* Bigger for debug */}
        <meshBasicMaterial 
          color="#00FF00" // DEBUG: Bright green LED
          toneMapped={false}
        />
      </mesh>

      {/* Screen area - RECESSED into housing */}
      <group position={[0, 0, screenZ]}>
        {children}
      </group>

      {/* Basic Lighting */}
      <ambientLight intensity={0.1} />
      <directionalLight 
        position={[2, 2, 2]} 
        intensity={0.3}
        castShadow={false}
      />
    </group>
  );
} 