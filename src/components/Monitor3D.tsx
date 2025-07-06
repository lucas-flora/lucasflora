'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import ScreenMesh from './ScreenMesh';
// import { RoundedBox } from '@react-three/drei'; // Not needed for frame-based housing
import * as THREE from 'three';
import { RoundedBoxGeometry } from '@react-three/drei';

interface Monitor3DProps {
  screenZ?: number;
  marginTopPx: number;
  marginRightPx: number;
  marginBottomPx: number;
  marginLeftPx: number;
  scanlineStrength?: number;
  scanlineScale?: number;
  cornerRoundness?: number;
  bubbleSize?: number;
  edgeTransition?: number;
  displacementAmount?: number;
  emissiveBoost?: number;
}

// Adjustable bump map intensity
const bumpScale = 2.0; // Increase for more pronounced texture
const filletRadius = 0.02; // Fillet radius for rounded edges
const filletSmoothness = 6; // Number of segments for smoothness

// Utility to generate a simple noise texture for bump mapping
function generateNoiseTexture(size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture(); // fallback: empty texture
  const imgData = ctx.createImageData(size, size);
  for (let i = 0; i < size * size * 4; i += 4) {
    const val = Math.floor(Math.random() * 64) + 192; // subtle noise
    imgData.data[i] = val;
    imgData.data[i + 1] = val;
    imgData.data[i + 2] = val;
    imgData.data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  return texture;
}

export default function Monitor3D({ 
  screenZ = -0.05, 
  marginTopPx, 
  marginRightPx, 
  marginBottomPx, 
  marginLeftPx,
  scanlineStrength = 0.4,
  scanlineScale = 800.0,
  cornerRoundness = 0.4,
  bubbleSize = 0.99,
  edgeTransition = 0.15,
  displacementAmount = 0.07,
  emissiveBoost = 1.2
}: Monitor3DProps) {
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
        screenMeshWidth: 4, // match default screen width
        screenMeshHeight: 3, // match default screen height
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

    // Move fudge and mesh size calculation outside useMemo so they are in scope for render
    const fudgeW = 0.05;
    const fudgeH = 0.05;

    // Calculate screen size WITHOUT fudge for frame/housing
    const screenWidth = visibleWidth - marginLeftWorld - marginRightWorld;
    const screenHeight = visibleHeight - marginTopWorld - marginBottomWorld;

    // Use these for the mesh only
    const screenMeshWidth = screenWidth + fudgeW;
    const screenMeshHeight = screenHeight + fudgeH;

    // Debugging output
    console.log('[Monitor3D] visibleWidth:', visibleWidth, 'visibleHeight:', visibleHeight);
    console.log('[Monitor3D] marginLeftWorld:', marginLeftWorld, 'marginRightWorld:', marginRightWorld, 'marginTopWorld:', marginTopWorld, 'marginBottomWorld:', marginBottomWorld);
    console.log('[Monitor3D] screenWidth:', screenWidth, 'screenHeight:', screenHeight);
    // Log the values passed to ScreenMesh
    console.log('[Monitor3D] Passing to ScreenMesh width:', screenMeshWidth, 'height:', screenMeshHeight);

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
    const ledRightPx = 48;
    const ledBottomPx = 24;
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
    
    return { ...dims, topFrameY, bottomFrameY, screenYOffset, led: { x: ledX, y: ledY, z: ledZ }, screenMeshWidth, screenMeshHeight };
  }, [windowSize, screenZ, marginTopPx, marginRightPx, marginBottomPx, marginLeftPx]); // Depends on windowSize and screenZ - will update on resize!

  // Memoize the plastic material for the frame
  const frameMaterial = useMemo(() => {
    const bumpMap = generateNoiseTexture();
    return new THREE.MeshPhysicalMaterial({
      color: '#2a2a2a', // beige
      roughness: 0.45,
      metalness: 0.05,
      clearcoat: 0.05,
      clearcoatRoughness: 0.5,
      bumpMap,
      bumpScale,
    });
  }, []);

  return (
    <group ref={monitorRef}>
      {/* Housing Frame with CUTOUT - made of separate pieces - DIFFERENT SHADES */}
      
      {/* Dynamic FRAME around the screen */}
      {/* Top frame */}
      <mesh position={[0, dimensions.topFrameY, 0]} castShadow={true} receiveShadow={true}>
        <RoundedBoxGeometry
          args={[
            dimensions.screen.width + dimensions.frame.left + dimensions.frame.right,
            dimensions.frame.top,
            dimensions.housing.depth
          ]}
          radius={filletRadius}
          smoothness={filletSmoothness}
        />
        <primitive object={frameMaterial} attach="material" />
      </mesh>
      
      {/* Bottom frame */}
      <mesh position={[0, dimensions.bottomFrameY, 0]} castShadow={true} receiveShadow={true}>
        <RoundedBoxGeometry
          args={[
            dimensions.screen.width + dimensions.frame.left + dimensions.frame.right,
            dimensions.frame.bottom,
            dimensions.housing.depth
          ]}
          radius={filletRadius}
          smoothness={filletSmoothness}
        />
        <primitive object={frameMaterial} attach="material" />
      </mesh>
      
      {/* Left frame */}
      <mesh position={[-dimensions.screen.width / 2 - dimensions.frame.left / 2, 0, 0]} castShadow={true} receiveShadow={true}>
        <RoundedBoxGeometry
          args={[
            dimensions.frame.left,
            dimensions.screen.height + dimensions.frame.top + dimensions.frame.bottom,
            dimensions.housing.depth
          ]}
          radius={filletRadius}
          smoothness={filletSmoothness}
        />
        <primitive object={frameMaterial} attach="material" />
      </mesh>
      
      {/* Right frame */}
      <mesh position={[dimensions.screen.width / 2 + dimensions.frame.right / 2, 0, 0]} castShadow={true} receiveShadow={true}>
        <RoundedBoxGeometry
          args={[
            dimensions.frame.right,
            dimensions.screen.height + dimensions.frame.top + dimensions.frame.bottom,
            dimensions.housing.depth
          ]}
          radius={filletRadius}
          smoothness={filletSmoothness}
        />
        <primitive object={frameMaterial} attach="material" />
      </mesh>

      {/* Screen area - RECESSED into housing */}
      <group position={[0, dimensions.screenYOffset, screenZ]}>
        <ScreenMesh
          width={dimensions.screenMeshWidth}
          height={dimensions.screenMeshHeight}
          yOffset={0}
          debugMode={0}
          scanlineStrength={scanlineStrength}
          scanlineScale={scanlineScale}
          cornerRoundness={cornerRoundness}
          bubbleSize={bubbleSize}
          edgeTransition={edgeTransition}
          displacementAmount={displacementAmount}
          emissiveBoost={emissiveBoost}
        />
      </group>

      {/* Lighting: Remove/reduce ambient, add point light for highlights */}
      <pointLight
        position={[-1,1,3]}
        intensity={2}
        distance={10}
        decay={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Power LED - simple emissive sphere for realistic indicator effect */}
      <group position={[dimensions.led.x, dimensions.led.y, dimensions.led.z]}>
        {/* Emissive outer sphere */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.02, 36, 36]} />
          <meshPhysicalMaterial
            color="#fff0c7"
            emissive="#fff0c7"
            emissiveIntensity={1.0}
            roughness={0.32}
            metalness={0.0}
            clearcoat={0.2}
            clearcoatRoughness={0.3}
          />
        </mesh>
        {/* Subtle point light to simulate LED lighting the frame */}
        <pointLight
          color="#fff0c7"
          intensity={0.01}
          distance={0}
          decay={2}
          castShadow={true}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          position={[0, 0, .1]}
        />
      </group>
    </group>
  );
} 