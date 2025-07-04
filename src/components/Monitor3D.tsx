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
        frame: { left: 0.1, right: 0.1, top: 0.15, bottom: 0.25 },
      };
    }
    
    // Get window aspect ratio (not camera-dependent)
    const windowAspectRatio = windowSize.width / windowSize.height;
    
    // Camera parameters (must match <Canvas camera={...} />)
    const cameraZ = 2.6;           // Distance of camera from origin (z-axis)
    const cameraFovDeg = 50;       // Vertical FOV in degrees – keep in sync with page.tsx

    // Vertical size of the view frustum at the Z depth of the screen
    const zDistance = cameraZ - screenZ; // screenZ is slightly negative, so distance > cameraZ
    const verticalFovRad = THREE.MathUtils.degToRad(cameraFovDeg);
    const visibleHeight = 2 * zDistance * Math.tan(verticalFovRad / 2);
    const visibleWidth  = visibleHeight * windowAspectRatio;

    // Frame thickness in pixels (change this to your liking)
    const frameThicknessPx = 24;
    // World units per pixel at this camera setup
    const unitsPerPixel = visibleHeight / windowSize.height;
    const frameThicknessWorld = unitsPerPixel * frameThicknessPx;

    // The screen fills the view except for the frame thickness on each side
    const screenWidth = visibleWidth - 2 * frameThicknessWorld;
    const screenHeight = visibleHeight - 2 * frameThicknessWorld;

    // Use this for all four frame pieces
    const leftFrameWidth = frameThicknessWorld;
    const rightFrameWidth = frameThicknessWorld;
    const topFrameHeight = frameThicknessWorld;
    const bottomFrameHeight = frameThicknessWorld;

    // Use fixed housing dimensions and calculated bezel
    const housingDepth = 0.4;
    const bezelThickness = 0.05; // Fixed bezel thickness
    const bezelDepth = 0.08;
    
    const dims = {
      screen: { width: screenWidth, height: screenHeight },
      frame: { left: leftFrameWidth, right: rightFrameWidth, top: topFrameHeight, bottom: bottomFrameHeight },
      housing: {
        width: screenWidth + 0.1 + 0.1,
        height: screenHeight + 0.25 + 0.25,
        depth: housingDepth,
      },
      bezel: { thickness: bezelThickness, depth: bezelDepth },
      radius: Math.min(screenWidth + 0.1 + 0.1, screenHeight + 0.25 + 0.25) * 0.04,
    };
    
    // DEBUG: Log dimensions
    console.log('Monitor dimensions (STABLE):', dims, 'Window:', windowSize, 'Aspect:', windowAspectRatio, 'Screen size:', { screenWidth, screenHeight });
    
    return dims;
  }, [windowSize, screenZ]); // Depends on windowSize and screenZ - will update on resize!

  return (
    <group ref={monitorRef}>
      {/* Housing Frame with CUTOUT - made of separate pieces - DIFFERENT SHADES */}
      {/* Back panel (solid) - orange */}
      <mesh position={[0, 0, housingZ - dimensions.housing.depth / 2]}>
        <boxGeometry args={[dimensions.housing.width, dimensions.housing.height, 0.02]} />
        <meshBasicMaterial color="#CC5500" />
      </mesh>
      
      {/* Dynamic FRAME around the screen */}
      {/* Top frame */}
      <mesh position={[0, dimensions.screen.height / 2 + dimensions.frame.top / 2, housingZ]}>
        <boxGeometry args={[dimensions.housing.width, dimensions.frame.top, dimensions.housing.depth]} />
        <meshBasicMaterial color="#1155FF" />
      </mesh>
      
      {/* Bottom frame */}
      <mesh position={[0, -dimensions.screen.height / 2 - dimensions.frame.bottom / 2, housingZ]}>
        <boxGeometry args={[dimensions.housing.width, dimensions.frame.bottom, dimensions.housing.depth]} />
        <meshBasicMaterial color="#00FF55" />
      </mesh>
      
      {/* Left frame */}
      <mesh position={[-dimensions.screen.width / 2 - dimensions.frame.left / 2, 0, housingZ]}>
        <boxGeometry args={[dimensions.frame.left, dimensions.housing.height, dimensions.housing.depth]} />
        <meshBasicMaterial color="#FF1177" />
      </mesh>
      
      {/* Right frame */}
      <mesh position={[dimensions.screen.width / 2 + dimensions.frame.right / 2, 0, housingZ]}>
        <boxGeometry args={[dimensions.frame.right, dimensions.housing.height, dimensions.housing.depth]} />
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