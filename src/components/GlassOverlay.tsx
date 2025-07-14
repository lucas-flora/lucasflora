'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import GlassShaderMaterial from './GlassShaderMaterial';

interface GlassOverlayProps {
  width: number;
  height: number;
  yOffset: number;
  cornerRoundness?: number;
  bubbleSize?: number;
  edgeTransition?: number;
  displacementAmount?: number;
  glassOpacity?: number;
  refractionIndex?: number;
  reflectionStrength?: number;
  glassTint?: [number, number, number];
  glassThickness?: number;
  fresnelPower?: number;
  glassZOffset?: number; // How far in front of screen to place glass
  envMap?: THREE.CubeTexture;
  reflectionClamp?: number;
  // Chromatic aberration props
  screenTexture?: THREE.Texture;
  chromaticAberrationBlackLevel?: number;
  chromaticAberrationWhiteLevel?: number;
  chromaticAberrationRedShift?: number;
  chromaticAberrationGreenShift?: number;
  chromaticAberrationBlueShift?: number;
  chromaticAberrationStrength?: number;
}

export default function GlassOverlay({ 
  width, 
  height, 
  yOffset, 
  cornerRoundness = 0.4,
  bubbleSize = 0.99,
  edgeTransition = 0.15,
  displacementAmount = 0.07,
  glassOpacity = 0.1,
  refractionIndex = 1.5,
  reflectionStrength = 0.3,
  glassTint = [0.9, 0.95, 1.0],
  glassThickness = 0.01,
  fresnelPower = 2.0,
  glassZOffset = 0.005, // Small offset in front of screen
  envMap,
  reflectionClamp,
  // Chromatic aberration defaults
  screenTexture,
  chromaticAberrationBlackLevel = 0.0,
  chromaticAberrationWhiteLevel = 1.0,
  chromaticAberrationRedShift = -1.0,
  chromaticAberrationGreenShift = 0.0,
  chromaticAberrationBlueShift = 1.0,
  chromaticAberrationStrength = 0.0,
}: GlassOverlayProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create extruded geometry for glass with thickness
  const glassGeometry = useMemo(() => {
    // Create a shape that matches the screen dimensions
    const shape = new THREE.Shape();
    const w = width;
    const h = height;
    
    // Create rectangular shape
    shape.moveTo(-w / 2, -h / 2);
    shape.lineTo(w / 2, -h / 2);
    shape.lineTo(w / 2, h / 2);
    shape.lineTo(-w / 2, h / 2);
    shape.lineTo(-w / 2, -h / 2);
    
    // Extrude the shape to give it thickness
    // const extrudeSettings = {
    //   depth: glassThickness,
    //   bevelEnabled: false,
    //   curveSegments: 12,
    // };
    
    // const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    
    // Add subdivision for smooth displacement - convert to BufferGeometry with more vertices
    const subdivisionLevel = 64; // Matching screen mesh subdivision
    // const planeGeometry = new THREE.PlaneGeometry(width, height, subdivisionLevel, subdivisionLevel);
    const planeGeometry = new THREE.BoxGeometry(width, height, glassThickness, subdivisionLevel, subdivisionLevel, 1);
    // For now, use the subdivided plane geometry instead of extruded
    // This ensures we have the same vertex distribution as the screen mesh
    return planeGeometry;
  }, [width, height, glassThickness]);

  return (
    <mesh 
      ref={meshRef}
      geometry={glassGeometry}
      position={[0, yOffset, glassZOffset + glassThickness / 2]}
      castShadow={false}
      receiveShadow={false}
    >
      <GlassShaderMaterial 
        cornerRoundness={cornerRoundness}
        bubbleSize={bubbleSize}
        edgeTransition={edgeTransition}
        displacementAmount={displacementAmount}
        screenWidth={width}
        screenHeight={height}
        glassOpacity={glassOpacity}
        refractionIndex={refractionIndex}
        reflectionStrength={reflectionStrength}
        glassTint={glassTint}
        glassThickness={glassThickness}
        fresnelPower={fresnelPower}
        envMap={envMap}
        reflectionClamp={reflectionClamp}
        screenTexture={screenTexture}
        chromaticAberrationBlackLevel={chromaticAberrationBlackLevel}
        chromaticAberrationWhiteLevel={chromaticAberrationWhiteLevel}
        chromaticAberrationRedShift={chromaticAberrationRedShift}
        chromaticAberrationGreenShift={chromaticAberrationGreenShift}
        chromaticAberrationBlueShift={chromaticAberrationBlueShift}
        chromaticAberrationStrength={chromaticAberrationStrength}
      />
    </mesh>
  );
} 