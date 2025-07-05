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

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
varying float vDisplacementMap;

uniform sampler2D screenTex;
uniform float scanlineStrength;
uniform int debugMode;
uniform float edgeHarshness;
uniform float edgeWidth;
uniform float centerSoftness;
uniform float cornerRoundness;
uniform float bubbleSize;
uniform float edgeTransition;

// Scanline effect map generator
float scanlineMap(vec2 uv, float strength) {
  float yLine = floor(uv.y * 480.0);
  float dim = mod(yLine, 2.0) < 1.0 ? 1.0 - strength : 1.0;
  return dim;
}

// Bubble displacement map generator
float bubbleMap(vec2 uv, float cornerRadius, float size, float transition) {
  // Convert UV to centered coordinates (-0.5 to 0.5)
  vec2 pos = uv - 0.5;
  
  // Scale the rectangle size based on size parameter
  vec2 rectSize = vec2(0.5, 0.5) * size;
  
  // Calculate distance to rounded rectangle
  vec2 q = abs(pos) - rectSize + cornerRadius;
  float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - cornerRadius;
  
  // Create smooth transition from bubble zone to edges
  return 1.0 - smoothstep(-transition, transition, dist);
}

// Checkerboard pattern generator (moved from external function)
float checkerboardMap(vec2 uv, float squares) {
  vec2 grid = floor(uv * squares);
  float checker = mod(grid.x + grid.y, 2.0);
  return checker;
}

void main() {
  // Generate maps
  float bubble = bubbleMap(vUv, mix(0.01, 0.3, cornerRoundness), bubbleSize, edgeTransition);
  float scanlines = scanlineMap(vUv, scanlineStrength);
  float checkerboard = checkerboardMap(vUv, 8.0);
  
  // Debug modes for viewing individual maps
  if (debugMode == 1) {
    // Show bubble map
    gl_FragColor = vec4(vec3(bubble), 1.0);
    return;
  } else if (debugMode == 2) {
    // Show scanline map
    gl_FragColor = vec4(vec3(scanlines), 1.0);
    return;
  } else if (debugMode == 3) {
    // Show checkerboard map
    gl_FragColor = vec4(vec3(checkerboard), 1.0);
    return;
  }

  // Normal rendering: apply effects
  vec3 baseColor = texture2D(screenTex, vUv).rgb;
  
  // Apply scanlines to content
  vec3 finalColor = baseColor * scanlines;
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

extend({ ShaderMaterial });

interface ScreenShaderMaterialProps {
  debugMode?: number;
  scanlineStrength?: number;
  cornerRoundness?: number;
  bubbleSize?: number;
  edgeTransition?: number;
  testTexture?: Texture;
  [key: string]: unknown;
}

export default function ScreenShaderMaterial({
  debugMode = 0,
  scanlineStrength = 0.15,
  cornerRoundness = 0.4,
  bubbleSize = 0.98,
  edgeTransition = 0.06,
  testTexture,
  ...props
}: ScreenShaderMaterialProps) {
  // Use a static checkerboard texture for now
  const checkerboard = useMemo(() => createCheckerboardTexture(), []);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          screenTex: { value: testTexture || checkerboard },
          scanlineStrength: { value: scanlineStrength },
          debugMode: { value: debugMode },
          cornerRoundness: { value: cornerRoundness },
          bubbleSize: { value: bubbleSize },
          edgeTransition: { value: edgeTransition },
        },
        vertexShader,
        fragmentShader,
      }),
    [checkerboard, testTexture, scanlineStrength, debugMode, cornerRoundness, bubbleSize, edgeTransition]
  );

  // Update uniforms on prop change
  material.uniforms.scanlineStrength.value = scanlineStrength;
  material.uniforms.debugMode.value = debugMode;
  material.uniforms.cornerRoundness.value = cornerRoundness;
  material.uniforms.bubbleSize.value = bubbleSize;
  material.uniforms.edgeTransition.value = edgeTransition;
  if (testTexture) material.uniforms.screenTex.value = testTexture;

  return <primitive object={material} attach="material" {...props} />;
} 