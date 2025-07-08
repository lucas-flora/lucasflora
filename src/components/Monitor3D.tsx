'use client';

import { useRef, useMemo, useState, useEffect, useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { PerspectiveCamera } from 'three';
import ScreenMesh from './ScreenMesh';
// import MonitorShaderMaterial from './MonitorShaderMaterial';
import * as THREE from 'three';

// Utility to generate a simple noise texture for bump mapping
function generateNoiseTexture(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(size, size);
  for (let i = 0; i < size * size * 4; i += 4) {
    // full-range noise 0–255
    const val = Math.floor(Math.random() * 256);
    imgData.data[i] = val;
    imgData.data[i + 1] = val;
    imgData.data[i + 2] = val;
    imgData.data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}
// import { RoundedBoxGeometry } from '@react-three/drei';
import { TerminalEntry } from '../lib/terminal-types';
import { useTerminalCanvas } from '../utils/useTerminalCanvas';
import { Geometry, Base, Subtraction } from '@react-three/csg';
// Fixed thickness of monitor housing (front face to back)
const HOUSING_DEPTH = 0.3;

interface Monitor3DProps {
  screenZ?: number;
  marginTopPx: number;
  marginRightPx: number;
  marginBottomPx: number;
  marginLeftPx: number;
  scanlineStrength?: number;
  lineSpacing?: number;
  cornerRoundness?: number;
  bubbleSize?: number;
  edgeTransition?: number;
  displacementAmount?: number;
  emissiveBoost?: number;
  terminalEntries?: TerminalEntry[];
  currentInput?: string;
  isTyping?: boolean;
  debugMode?: number;
  cutoutRadius?: number;
  bevelSize?: number;
  frameNoiseScale: number;
  frameNoiseStrength: number;
  // Key light relative position ratios
  keyLightIntensity: number;
  keyLightXRel: number;
  keyLightYRel: number;
  keyLightZRel: number;
}

// Adjustable bump map intensity
// const bumpScale = 2.0; // Increase for more pronounced texture
// const filletRadius = 0.02; // Fillet radius for rounded edges
// const filletSmoothness = 6; // Number of segments for smoothness

// // Utility to generate a simple noise texture for bump mapping
// function generateNoiseTexture(size = 128) {
//   const canvas = document.createElement('canvas');
//   canvas.width = canvas.height = size;
//   const ctx = canvas.getContext('2d');
//   if (!ctx) return new THREE.Texture(); // fallback: empty texture
//   const imgData = ctx.createImageData(size, size);
//   for (let i = 0; i < size * size * 4; i += 4) {
//     const val = Math.floor(Math.random() * 64) + 192; // subtle noise
//     imgData.data[i] = val;
//     imgData.data[i + 1] = val;
//     imgData.data[i + 2] = val;
//     imgData.data[i + 3] = 255;
//   }
//   ctx.putImageData(imgData, 0, 0);
//   const texture = new THREE.Texture(canvas);
//   texture.needsUpdate = true;
//   texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
//   texture.repeat.set(8, 8);
//   return texture;
// }

export default function Monitor3D({
  screenZ = -0.05,
  marginTopPx,
  marginRightPx,
  marginBottomPx,
  marginLeftPx,
  scanlineStrength = 0.4,
  lineSpacing = 800.0,
  cornerRoundness = 0.4,
  bubbleSize = 0.99,
  edgeTransition = 0.15,
  displacementAmount = 0.07,
  emissiveBoost = 1.2,
  terminalEntries = [],
  currentInput = '',
  isTyping = false,
  debugMode = 0,
  cutoutRadius = 0.05,
  bevelSize = 0.01,
  frameNoiseScale,
  frameNoiseStrength,
  keyLightIntensity = 4,
  keyLightXRel = -0.33,
  keyLightYRel = 0.412,
  keyLightZRel = 1.923,
}: Monitor3DProps) {
  const monitorRef = useRef<THREE.Group>(null);
  const frameMeshRef = useRef<THREE.Mesh>(null);

  // Track window size for world-unit calculation
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const onResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Compute world-units-per-CSS-pixel at the front face depth
  const { camera: genericCamera } = useThree();
  const camera = genericCamera as PerspectiveCamera;
  const fovRad = (camera.fov * Math.PI) / 180;
  // distance from camera to enclosure front face at Z=0
  const dist = camera.position.z;
  // world units per CSS pixel so geometry will fill view
  // Add safety check to prevent division by zero and ensure reasonable values
  const safeWindowHeight = Math.max(windowSize.height, 1); // Minimum 1px to prevent division by zero
  const worldPx = (2 * dist * Math.tan(fovRad / 2)) / safeWindowHeight;
  
  // Validate worldPx to ensure it's a reasonable finite number
  const safeWorldPx = (isFinite(worldPx) && worldPx > 0) ? worldPx : 0.001; // Fallback to small positive value

  // Calculate screen dimensions with validation
  const rawScreenWidth = windowSize.width - marginLeftPx - marginRightPx;
  const rawScreenHeight = windowSize.height - marginTopPx - marginBottomPx;
  
  // Ensure screen dimensions are positive (minimum 1px each)
  const safeScreenPxWidth = Math.max(rawScreenWidth, 1);
  const safeScreenPxHeight = Math.max(rawScreenHeight, 1);
  
  const screenWorldWidth = safeScreenPxWidth * safeWorldPx;
  const screenWorldHeight = safeScreenPxHeight * safeWorldPx;
  
  // Calculate frame dimensions with minimum thresholds
  const minFramePx = 8; // Minimum 8 pixels for any frame dimension
  const safeMarginLeft = Math.max(marginLeftPx, minFramePx);
  const safeMarginRight = Math.max(marginRightPx, minFramePx);
  const safeMarginTop = Math.max(marginTopPx, minFramePx);
  const safeMarginBottom = Math.max(marginBottomPx, minFramePx);
  
  const frameLeft = safeMarginLeft * safeWorldPx;
  const frameRight = safeMarginRight * safeWorldPx;
  const frameTop = safeMarginTop * safeWorldPx;
  const frameBottom = safeMarginBottom * safeWorldPx;

  // Center offsets so inner edges align with margins
  const xOffset = (frameRight - frameLeft) / 2;
  const yOffset = (frameBottom - frameTop) / 2;

  // Mesh dimensions: add slight padding if desired
  const screenMeshWidth = screenWorldWidth + 0.01;
  const screenMeshHeight = screenWorldHeight + 0.01;

  // Power LED: 8px radius LED at 48px from edges, at housing front depth
  // variables for power LED position with safe calculations
  const ledXoffset = 8;
  const ledYoffset = -18;
  const ledRadius = 6;
  const ledRadiusWorld = Math.max(ledRadius * safeWorldPx, 0.001); // Ensure minimum LED size
  const ledX = screenWorldWidth / 2 - ledXoffset * safeWorldPx;
  const ledY = -screenWorldHeight / 2 + ledYoffset * safeWorldPx;
  const ledZ = HOUSING_DEPTH / 2;

  // Frame material with a true noise bump map (sampled via world-space UVs)
  const frameMaterial = useMemo(() => {
    const bumpMap = generateNoiseTexture(512);
    bumpMap.repeat.set(1, 1);
    const mat = new THREE.MeshPhysicalMaterial({
      color: '#2a2a2a',
      roughness: 0.45,
      metalness: 0.05,
      clearcoat: 0.05,
      clearcoatRoughness: 0.5,
      bumpMap,
      bumpScale: frameNoiseStrength,
    });
    return mat;
  }, [frameNoiseStrength]);

  // Generate terminal texture using canvas rendering with safe dimensions
  const terminalTexture = useTerminalCanvas(terminalEntries, {
    width: safeScreenPxWidth,
    height: safeScreenPxHeight,
    backgroundColor: '#000000',
    textColor: '#ffffff',
    fontSize: 16,
    fontFamily: 'monospace',
    lineHeight: 1.2,
    padding: 16,
    spaceBetweenEntries: 4,
    currentInput,
    isTyping
  });

  // Make frame pieces much thicker to ensure no gaps at screen edges
  const thicknessFactor = 5; // Make frame pieces 5x thicker than the margins
  const thickFrameTop = frameTop * thicknessFactor;
  const thickFrameBottom = frameBottom * thicknessFactor;
  const thickFrameLeft = frameLeft * thicknessFactor;
  const thickFrameRight = frameRight * thicknessFactor;

  // Ensure all geometry dimensions are valid and above minimum thresholds
  // RoundedBoxGeometry requires dimensions > 0 and radius < smallest dimension / 2
  const minGeometrySize = 0.001; // Minimum geometry dimension in world units
  // const safeRadius = Math.min(filletRadius, 
  //   Math.min(thickFrameTop, thickFrameBottom, thickFrameLeft, thickFrameRight, HOUSING_DEPTH) / 3
  // );

  // Validate all frame dimensions
  const safeThickFrameTop = Math.max(thickFrameTop, minGeometrySize);
  const safeThickFrameBottom = Math.max(thickFrameBottom, minGeometrySize);
  const safeThickFrameLeft = Math.max(thickFrameLeft, minGeometrySize);
  const safeThickFrameRight = Math.max(thickFrameRight, minGeometrySize);
  const safeScreenWorldWidth = Math.max(screenWorldWidth, minGeometrySize);
  const safeScreenWorldHeight = Math.max(screenWorldHeight, minGeometrySize);
  // Compute full housing dims for light positioning
  const fullFrameWidth = safeScreenWorldWidth + safeThickFrameLeft + safeThickFrameRight;
  const fullFrameHeight = safeScreenWorldHeight + safeThickFrameTop + safeThickFrameBottom;

  // Memoize the extruded screen cutout geometry for the CSG subtraction
  const screenCutoutShape = useMemo(() => {
    const shape = new THREE.Shape();
    const w = safeScreenWorldWidth;
    const h = safeScreenWorldHeight;
    const r = Math.min(cutoutRadius, Math.min(w, h) / 2); // Rounded corner radius in world units

    shape.moveTo(-w / 2 + r, -h / 2);
    shape.lineTo(w / 2 - r, -h / 2);
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    shape.lineTo(w / 2, h / 2 - r);
    shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    shape.lineTo(-w / 2 + r, h / 2);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    shape.lineTo(-w / 2, -h / 2 + r);
    shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: HOUSING_DEPTH * 5,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: bevelSize,
      bevelThickness: bevelSize,
    });
    geometry.translate(0, 0, -HOUSING_DEPTH * 2.5);
    return geometry;
    
  }, [safeScreenWorldWidth, safeScreenWorldHeight, cutoutRadius, bevelSize]);

  // Compute world-space UVs for the frame mesh after mount/update
  useLayoutEffect(() => {
    const mesh = frameMeshRef.current;
    if (!mesh) return;
    // Ensure world transform is up-to-date
    mesh.updateMatrixWorld(true);
    const geom = mesh.geometry as THREE.BufferGeometry;
    const posAttr = geom.attributes.position as THREE.BufferAttribute;
    if (!posAttr) return;
    const uvArray = new Float32Array(posAttr.count * 2);
    // Reusable vectors for CPU-side world transform
    const localPos = new THREE.Vector3();
    const worldPos = new THREE.Vector3();
    for (let i = 0; i < posAttr.count; i++) {
      // Read local vertex position
      localPos.set(
        posAttr.getX(i),
        posAttr.getY(i),
        posAttr.getZ(i)
      );
      // Transform to world space
      worldPos.copy(localPos).applyMatrix4(mesh.matrixWorld);
      // Use world X/Y for absolute UVs
      uvArray[2 * i]     = worldPos.x * frameNoiseScale;
      uvArray[2 * i + 1] = worldPos.y * frameNoiseScale;
    }
    geom.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
    geom.attributes.uv.needsUpdate = true;
    // Ensure bumpMap repeats and uses the UVs
    const mat = mesh.material as THREE.MeshPhysicalMaterial;
    if (mat && mat.bumpMap) {
      mat.bumpMap.wrapS = mat.bumpMap.wrapT = THREE.RepeatWrapping;
    }
  // Re-run whenever scale or the underlying CSG geometry changes
  }, [frameNoiseScale, safeScreenWorldWidth, safeScreenWorldHeight, screenCutoutShape]);

  return (
    <group ref={monitorRef} position={[xOffset, yOffset, 0 - HOUSING_DEPTH / 2]}>
      {/* Frame using CSG subtraction */}
      <mesh ref={frameMeshRef} castShadow receiveShadow>
        <Geometry>
          <Base>
            <boxGeometry
              args={[
                safeScreenWorldWidth + safeThickFrameLeft + safeThickFrameRight,
                safeScreenWorldHeight + safeThickFrameTop + safeThickFrameBottom,
                HOUSING_DEPTH,
              ]}
            />
          </Base>
          <Subtraction>
            <primitive object={screenCutoutShape} />
          </Subtraction>
        </Geometry>
        <primitive object={frameMaterial} attach="material" />
      </mesh>
      {/* Screen area - RECESSED into housing */}
      <group position={[0, 0, screenZ]}>
        <ScreenMesh
          width={Math.max(screenMeshWidth, minGeometrySize)}
          height={Math.max(screenMeshHeight, minGeometrySize)}
          yOffset={0}
          debugMode={debugMode}
          scanlineStrength={scanlineStrength}
          lineSpacing={lineSpacing}
          cornerRoundness={cornerRoundness}
          bubbleSize={bubbleSize}
          edgeTransition={edgeTransition}
          displacementAmount={displacementAmount}
          emissiveBoost={emissiveBoost}
          terminalTexture={terminalTexture}
        />
      </group>
      {/* Lighting */}
      {/* Key light */}
      <pointLight
        // Position the light relative to current frame and camera size:
        position={[
          fullFrameWidth * keyLightXRel,
          fullFrameHeight * keyLightYRel,
          (camera as THREE.PerspectiveCamera).position.z * keyLightZRel,
        ]}
        color="#ffffff"
        intensity={keyLightIntensity}
        distance={10}
        decay={1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {/* Power LED */}
      <group position={[ledX, ledY, ledZ]}>
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <sphereGeometry args={[ledRadiusWorld, 36, 36]} />
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