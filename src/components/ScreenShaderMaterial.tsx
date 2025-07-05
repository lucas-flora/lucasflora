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
varying float vDisplacementMap;

uniform float curvatureAmount;

void main() {
  vUv = uv;
  
  // Create displacement map based on distance from center
  vec2 center = vec2(0.5, 0.5);
  float distFromCenter = distance(uv, center);
  
  // For debugging, let's just use the raw distance
  // This should give us 0 at center, ~0.707 at corners
  // We'll scale it to 0-1 range for visualization
  float displacementMap = distFromCenter / 0.707;
  
  // Apply displacement along normal (Z direction for flat plane)
  float displacement = displacementMap * curvatureAmount;
  vec3 displaced = position + normal * displacement;
  
  // Pass displacement map to fragment shader for visualization
  vDisplacementMap = displacementMap;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
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

// Scanline effect
float scanline(vec2 uv, float strength) {
  float yLine = floor(uv.y * 480.0);
  float dim = mod(yLine, 2.0) < 1.0 ? 1.0 - strength : 1.0;
  return dim;
}

// Calculate distance from nearest edge (0 = at edge, 0.5 = at center)
float edgeDistance(vec2 uv) {
  // Distance from each edge
  float distFromLeft = uv.x;
  float distFromRight = 1.0 - uv.x;
  float distFromTop = uv.y;
  float distFromBottom = 1.0 - uv.y;
  
  // Minimum distance to any edge
  float minEdgeDist = min(min(distFromLeft, distFromRight), min(distFromTop, distFromBottom));
  return minEdgeDist;
}

void main() {
  vec3 color = texture2D(screenTex, vUv).rgb;
  float scan = scanline(vUv, scanlineStrength);

  if (debugMode == 1) {
    // Show displacement map based on distance from edges
    float edgeDist = edgeDistance(vUv);
    
    // Create a single smooth gradient with controllable falloff
    // Normalize edge distance to 0-1 range (0 = edge, 1 = center)
    float normalizedDist = edgeDist / 0.5;
    
    // Create a smooth falloff that's sharp near edges, soft in middle
    // Use a combination of two functions for control
    float sharpFalloff = 1.0 - pow(normalizedDist, 1.0 / edgeHarshness);
    float softFalloff = 1.0 - pow(normalizedDist, centerSoftness);
    
    // Blend between sharp and soft based on distance
    float blendFactor = smoothstep(0.0, edgeWidth * 2.0, normalizedDist);
    float displacementMap = mix(sharpFalloff, softFalloff, blendFactor);
    
    gl_FragColor = vec4(vec3(displacementMap), 1.0);
    return;
  } else if (debugMode == 2) {
    // Show scanlines only
    gl_FragColor = vec4(vec3(scan), 1.0);
    return;
  }

  // Normal: terminal color * scanline, add displacement map for subtle edge effects
  vec3 finalColor = color * scan + vDisplacementMap * 0.1;
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

extend({ ShaderMaterial });

interface ScreenShaderMaterialProps {
  debugMode?: number;
  scanlineStrength?: number;
  curvatureAmount?: number;
  edgeHarshness?: number;
  edgeWidth?: number;
  centerSoftness?: number;
  testTexture?: Texture;
  [key: string]: unknown;
}

export default function ScreenShaderMaterial({
  debugMode = 0,
  scanlineStrength = 0.15,
  curvatureAmount = 0.03,
  edgeHarshness = 2.0,
  edgeWidth = 0.2,
  centerSoftness = 0.5,
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
          curvatureAmount: { value: curvatureAmount },
          debugMode: { value: debugMode },
          edgeHarshness: { value: edgeHarshness },
          edgeWidth: { value: edgeWidth },
          centerSoftness: { value: centerSoftness },
        },
        vertexShader,
        fragmentShader,
      }),
    [checkerboard, testTexture, scanlineStrength, curvatureAmount, debugMode, edgeHarshness, edgeWidth, centerSoftness]
  );

  // Update uniforms on prop change
  material.uniforms.scanlineStrength.value = scanlineStrength;
  material.uniforms.curvatureAmount.value = curvatureAmount;
  material.uniforms.debugMode.value = debugMode;
  material.uniforms.edgeHarshness.value = edgeHarshness;
  material.uniforms.edgeWidth.value = edgeWidth;
  material.uniforms.centerSoftness.value = centerSoftness;
  if (testTexture) material.uniforms.screenTex.value = testTexture;

  return <primitive object={material} attach="material" {...props} />;
} 