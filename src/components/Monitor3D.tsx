'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import ScreenMesh from './ScreenMesh';
// import { RoundedBox } from '@react-three/drei'; // Not needed for frame-based housing
import * as THREE from 'three';

interface Monitor3DProps {
  screenZ?: number;
  marginTopPx: number;
  marginRightPx: number;
  marginBottomPx: number;
  marginLeftPx: number;
}

export default function Monitor3D({ screenZ = -0.05, marginTopPx, marginRightPx, marginBottomPx, marginLeftPx }: Monitor3DProps) {
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
        topFrameY: 1.5 - 0.15 / 2, // (visibleHeight/2) - (topFrameHeight/2) for default
        bottomFrameY: -1.5 + 0.25 / 2, // -(visibleHeight/2) + (bottomFrameHeight/2) for default
        screenYOffset: 0,
        led: { x: 1, y: -1, z: 0 },
        unitsPerPixel: 1,
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

    // World units per pixel at this camera setup
    const unitsPerPixelY = visibleHeight / windowSize.height;
    const unitsPerPixelX = visibleWidth / windowSize.width;
    const marginTopWorld = unitsPerPixelY * marginTopPx;
    const marginRightWorld = unitsPerPixelX * marginRightPx;
    const marginBottomWorld = unitsPerPixelY * marginBottomPx;
    const marginLeftWorld = unitsPerPixelX * marginLeftPx;

    // The screen fills the view except for the margins on each side
    const screenWidth = visibleWidth - marginLeftWorld - marginRightWorld;
    const screenHeight = visibleHeight - marginTopWorld - marginBottomWorld;

    // Use these for all four frame pieces
    const leftFrameWidth = marginLeftWorld;
    const rightFrameWidth = marginRightWorld;
    const topFrameHeight = marginTopWorld;
    const bottomFrameHeight = marginBottomWorld;

    // Use fixed housing dimensions and calculated bezel
    const housingDepth = 0.1;
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
      topFrameY: 1.5 - 0.15 / 2, // (visibleHeight/2) - (topFrameHeight/2) for default
      bottomFrameY: -1.5 + 0.25 / 2, // -(visibleHeight/2) + (bottomFrameHeight/2) for default
      screenYOffset: 0,
      led: { x: 1, y: -1, z: 0 },
      unitsPerPixel: 1,
    };
    
    // LED offsets in pixels
    const ledRightPx = 72;
    const ledBottomPx = 32;
    const ledRightWorld = unitsPerPixelX * ledRightPx;
    const ledBottomWorld = unitsPerPixelY * ledBottomPx;

    // LED world position (from window edge, using same frustum logic as screen margin)
    const ledX = (visibleWidth / 2) - ledRightWorld;
    const ledY = -(visibleHeight / 2) + ledBottomWorld;
    const ledZ = (housingDepth / 2); // flush with front face of frame
    // const ledZ = ; // flush with front face of frame

    // Calculate top and bottom frame Y positions using visibleHeight
    const topFrameY = (visibleHeight / 2) - (topFrameHeight / 2);
    const bottomFrameY = -(visibleHeight / 2) + (bottomFrameHeight / 2);
    
    const screenYOffset = (marginBottomWorld - marginTopWorld) / 2;
    
    return { ...dims, topFrameY, bottomFrameY, screenYOffset, led: { x: ledX, y: ledY, z: ledZ } };
  }, [windowSize, screenZ, marginTopPx, marginRightPx, marginBottomPx, marginLeftPx]); // Depends on windowSize and screenZ - will update on resize!

  return (
    <group ref={monitorRef}>
      {/* Housing Frame with CUTOUT - made of separate pieces - DIFFERENT SHADES */}
      
      {/* Dynamic FRAME around the screen */}
      {/* Top frame */}
      <mesh position={[0, dimensions.topFrameY, 0]}>
        <boxGeometry args={[
          dimensions.screen.width + dimensions.frame.left + dimensions.frame.right,
          dimensions.frame.top,
          dimensions.housing.depth
        ]} />
        <meshBasicMaterial color="#1155FF" />
      </mesh>
      
      {/* Bottom frame */}
      <mesh position={[0, dimensions.bottomFrameY, 0]}>
        <boxGeometry args={[
          dimensions.screen.width + dimensions.frame.left + dimensions.frame.right,
          dimensions.frame.bottom,
          dimensions.housing.depth
        ]} />
        <meshBasicMaterial color="#1155FF" />
      </mesh>
      
      {/* Left frame */}
      <mesh position={[-dimensions.screen.width / 2 - dimensions.frame.left / 2, 0, 0]}>
        <boxGeometry args={[dimensions.frame.left, dimensions.screen.height + dimensions.frame.top + dimensions.frame.bottom, dimensions.housing.depth]} />
        <meshBasicMaterial color="#1155FF" />
      </mesh>
      
      {/* Right frame */}
      <mesh position={[dimensions.screen.width / 2 + dimensions.frame.right / 2, 0, 0]}>
        <boxGeometry args={[dimensions.frame.right, dimensions.screen.height + dimensions.frame.top + dimensions.frame.bottom, dimensions.housing.depth]} />
        <meshBasicMaterial color="#1155FF" />
      </mesh>

      {/* Screen area - RECESSED into housing */}
      <group position={[0, dimensions.screenYOffset, screenZ]}>
        <ScreenMesh
          width={dimensions.screen.width}
          height={dimensions.screen.height}
          yOffset={0}
        />
      </group>

      {/* Basic Lighting */}
      <ambientLight intensity={0.1} />
      <directionalLight 
        position={[2, 2, 2]} 
        intensity={0.3}
        castShadow={false}
      />

      {/* Power LED - dome, positioned by pixel offset from right/bottom, flush with frame */}
        <mesh position={[dimensions.led.x, dimensions.led.y, dimensions.led.z]}>
        <sphereGeometry args={[0.025,36,36]} />
        <meshBasicMaterial color="#00FF00" toneMapped={false} />
      </mesh>
    </group>
  );
} 