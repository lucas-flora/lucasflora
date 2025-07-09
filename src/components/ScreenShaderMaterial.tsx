import { useMemo } from 'react';
import { ShaderMaterial, Texture, RepeatWrapping, NearestFilter } from 'three';
import { extend } from '@react-three/fiber';

// Helper to create a checkerboard texture for testing
function createCheckerboardTexture(size = 64, squares = 8) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context');
  for (let y = 0; y < squares; y++) {
    for (let x = 0; x < squares; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#fff' : '#000';
      ctx.fillRect(
        (x * size) / squares,
        (y * size) / squares,
        size / squares,
        size / squares
      );
    }
  }
  const texture = new Texture(canvas);
  texture.needsUpdate = true;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  return texture;
}

// GLSL shader for prototyping (replace with WGSL when WebGPU is ready)
const vertexShader = `
varying vec2 vUv;
varying vec2 vWorldPos;

uniform float cornerRoundness;
uniform float bubbleSize;
uniform float edgeTransition;
uniform float displacementAmount;
uniform float screenWidth;
uniform float screenHeight;

// Bubble displacement map generator using world coordinates
float bubbleMapWorld(vec2 worldPos, float cornerRadius, float size, float transition, float screenW, float screenH) {
  // Convert world position to centered coordinates
  vec2 pos = worldPos;
  
  // Scale the rectangle size based on size parameter - use world dimensions
  vec2 rectSize = vec2(screenW, screenH) * 0.5 * size;
  
  // Calculate distance to rounded rectangle
  vec2 q = abs(pos) - rectSize + cornerRadius;
  float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - cornerRadius;
  
  // Create smooth transition from bubble zone to edges
  return 1.0 - smoothstep(-transition, transition, dist);
}

void main() {
  vUv = uv;
  
  // Use the actual vertex position coordinates which should be in correct world space
  // PlaneGeometry creates vertices positioned correctly based on width/height parameters
  vWorldPos = position.xy;
  
  // Calculate bubble displacement using world coordinates
  float cornerRadius = mix(0.01, 0.3, cornerRoundness);
  float displacement = bubbleMapWorld(vWorldPos, cornerRadius, bubbleSize, edgeTransition, screenWidth, screenHeight);
  
  // Apply displacement along normal (Z direction for flat plane)
  vec3 displaced = position + normal * displacement * displacementAmount;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
varying vec2 vWorldPos;

uniform sampler2D screenTex;
uniform float scanlineStrength;
uniform float lineSpacing;
uniform float checkerboardSize;
uniform int debugMode;
uniform float cornerRoundness;
uniform float bubbleSize;
uniform float edgeTransition;
uniform float displacementAmount;
uniform float emissiveBoost;
uniform float screenWidth;
uniform float screenHeight;

// Bubble displacement map generator using world coordinates
float bubbleMapWorld(vec2 worldPos, float cornerRadius, float size, float transition, float screenW, float screenH) {
  // Use world position directly
  vec2 pos = worldPos;
  
  // Scale the rectangle size based on size parameter - use world dimensions
  vec2 rectSize = vec2(screenW, screenH) * 0.5 * size;
  
  // Calculate distance to rounded rectangle
  vec2 q = abs(pos) - rectSize + cornerRadius;
  float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - cornerRadius;
  
  // Create smooth transition from bubble zone to edges
  return 1.0 - smoothstep(-transition, transition, dist);
}

void main() {
  // Debug modes for viewing individual maps
  if (debugMode == 1) {
    // Show bubble map using world coordinates
    float bubble = bubbleMapWorld(vWorldPos, mix(0.01, 0.3, cornerRoundness), bubbleSize, edgeTransition, screenWidth, screenHeight);
    gl_FragColor = vec4(vec3(bubble), 1.0);
    return;
  } else if (debugMode == 2) {
    // Show scanline map using EXACTLY the same pattern as checkerboard
    // Use the same calculation method that works for checkerboard
    vec2 lineGrid = floor(vWorldPos / lineSpacing);
    float yLine = lineGrid.y;
    float scanlines = mod(yLine, 2.0) < 1.0 ? 1.0 - scanlineStrength : 1.0;
    gl_FragColor = vec4(vec3(scanlines), 1.0);
    return;
  } else if (debugMode == 3) {
    // Show checkerboard map using configurable world coordinates
    // Use configurable world square size, completely independent of screen dimensions
    vec2 grid = floor(vWorldPos / checkerboardSize);
    float checkerboard = mod(grid.x + grid.y, 2.0);
    gl_FragColor = vec4(vec3(checkerboard), 1.0);
    return;
  } else if (debugMode == 4) {
    // Show white screen with scanlines for testing using EXACTLY the same pattern as checkerboard
    vec3 white = vec3(1.0);
    vec2 lineGrid = floor(vWorldPos / lineSpacing);
    float yLine = lineGrid.y;
    float scanlines = mod(yLine, 2.0) < 1.0 ? 1.0 - scanlineStrength : 1.0;
    vec3 scannedWhite = white * scanlines;
    gl_FragColor = vec4(scannedWhite, 1.0);
    return;
  }

  // Normal rendering: build up effects in proper order
  vec3 baseColor = texture2D(screenTex, vUv).rgb;
  
  // Apply content effects here (none for now)
  vec3 contentColor = baseColor;
  
  // Add subtle monitor glow - slight gray background instead of pure black
  // This simulates the phosphor coating glow that CRT monitors have
  vec3 monitorGlow = vec3(0.007, 0.007, 0.005); // Subtle cool gray-blue tint
  vec3 glowColor = max(contentColor, monitorGlow);
  
  // Make the screen emissive for bloom - configurable boost
  // CRT screens are bright light sources, not just reflective surfaces
  vec3 emissiveColor = glowColor * emissiveBoost; // Configurable boost for bloom
  
  // Apply scanlines AFTER emissive boost - using EXACTLY the same pattern as checkerboard
  vec2 lineGrid = floor(vWorldPos / lineSpacing);
  float yLine = lineGrid.y;
  float finalScanlines = mod(yLine, 2.0) < 1.0 ? 1.0 - scanlineStrength : 1.0;
  vec3 finalColor = emissiveColor * finalScanlines;
  
  // Future effects like channel shifting or blur would go here
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

extend({ ShaderMaterial });

interface ScreenShaderMaterialProps {
  debugMode?: number;
  scanlineStrength?: number;
  lineSpacing?: number;
  cornerRoundness?: number;
  bubbleSize?: number;
  edgeTransition?: number;
  displacementAmount?: number;
  emissiveBoost?: number;
  testTexture?: Texture;
  terminalTexture?: Texture | null;
  screenWidth?: number;
  screenHeight?: number;
  checkerboardSize?: number;
  [key: string]: unknown;
}

export default function ScreenShaderMaterial({
  debugMode = 0,
  scanlineStrength = 0.4,
  lineSpacing = 25, // Pixel-units that get converted to world units
  cornerRoundness = 0.4,
  bubbleSize = 0.99,
  edgeTransition = 0.15,
  displacementAmount = 0.07,
  emissiveBoost = 1.2,
  testTexture,
  terminalTexture,
  screenWidth = 1.0,
  screenHeight = 1.0,
  checkerboardSize = 0.1, // Default checkerboard size
  ...props
}: ScreenShaderMaterialProps) {
  // Use a static checkerboard texture for now
  const checkerboard = useMemo(() => createCheckerboardTexture(), []);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          screenTex: { value: terminalTexture || testTexture || checkerboard },
          scanlineStrength: { value: scanlineStrength },
          lineSpacing: { value: lineSpacing },
          debugMode: { value: debugMode },
          cornerRoundness: { value: cornerRoundness },
          bubbleSize: { value: bubbleSize },
          edgeTransition: { value: edgeTransition },
          displacementAmount: { value: displacementAmount },
          emissiveBoost: { value: emissiveBoost },
          screenWidth: { value: screenWidth },
          screenHeight: { value: screenHeight },
          checkerboardSize: { value: checkerboardSize },
        },
        vertexShader,
        fragmentShader,
        toneMapped: false, // Allow bright values for bloom
      }),
    [checkerboard, testTexture, terminalTexture, scanlineStrength, lineSpacing, debugMode, cornerRoundness, bubbleSize, edgeTransition, displacementAmount, emissiveBoost, screenWidth, screenHeight, checkerboardSize]
  );

  // Update uniforms on prop change
  material.uniforms.scanlineStrength.value = scanlineStrength;
  material.uniforms.lineSpacing.value = lineSpacing;
  material.uniforms.debugMode.value = debugMode;
  material.uniforms.cornerRoundness.value = cornerRoundness;
  material.uniforms.bubbleSize.value = bubbleSize;
  material.uniforms.edgeTransition.value = edgeTransition;
  material.uniforms.displacementAmount.value = displacementAmount;
  material.uniforms.emissiveBoost.value = emissiveBoost;
  material.uniforms.screenWidth.value = screenWidth;
  material.uniforms.screenHeight.value = screenHeight;
  material.uniforms.checkerboardSize.value = checkerboardSize;
  
  // Update texture - priority: terminalTexture > testTexture > checkerboard
  if (terminalTexture) {
    material.uniforms.screenTex.value = terminalTexture;
  } else if (testTexture) {
    material.uniforms.screenTex.value = testTexture;
  } else {
    material.uniforms.screenTex.value = checkerboard;
  }

  return <primitive object={material} attach="material" {...props} />;
} 