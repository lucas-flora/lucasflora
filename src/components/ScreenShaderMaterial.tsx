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
uniform float cornerRoundness;
uniform float bubbleSize;
uniform float edgeTransition;

// Scanline effect
float scanline(vec2 uv, float strength) {
  float yLine = floor(uv.y * 480.0);
  float dim = mod(yLine, 2.0) < 1.0 ? 1.0 - strength : 1.0;
  return dim;
}

// Calculate distance from nearest edge (0 = at center, 1 = at edges)
float edgeDistance(vec2 uv) {
  // Distance from each edge
  float distFromLeft = uv.x;
  float distFromRight = 1.0 - uv.x;
  float distFromTop = uv.y;
  float distFromBottom = 1.0 - uv.y;
  
  // Minimum distance to any edge
  float minEdgeDist = min(min(distFromLeft, distFromRight), min(distFromTop, distFromBottom));
  
  // Convert to 0 = center, 1 = edges
  // Max distance from center to edge is 0.5
  return 1.0 - (minEdgeDist / 0.5);
}

// Calculate circular distance from center (0 = at center, 1 = at edges)
float circularDistance(vec2 uv) {
  vec2 center = vec2(0.5, 0.5);
  float dist = distance(uv, center);
  
  // Normalize to 0-1 range (0 = center, 1 = edges)
  // Max distance from center to corner is ~0.707
  return dist / 0.707;
}

// Rounded rectangle distance function - now for defining bubble zone
float roundedRectDistance(vec2 uv, float cornerRadius, float size) {
  // Convert UV to centered coordinates (-0.5 to 0.5)
  vec2 pos = uv - 0.5;
  
  // Scale the rectangle size based on bubbleSize parameter
  vec2 rectSize = vec2(0.5, 0.5) * size;
  
  // Calculate distance to rounded rectangle
  vec2 q = abs(pos) - rectSize + cornerRadius;
  float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - cornerRadius;
  
  // Return raw distance (negative = inside, positive = outside)
  return dist;
}

void main() {
  vec3 color = texture2D(screenTex, vUv).rgb;
  float scan = scanline(vUv, scanlineStrength);

  if (debugMode == 1) {
    // Define bubble zone with rounded rectangle
    float cornerRadius = mix(0.01, 0.3, cornerRoundness);
    float distToRect = roundedRectDistance(vUv, cornerRadius, bubbleSize);
    
    // Create smooth transition from bubble zone to edges
    // Negative distance = inside bubble (white)
    // Positive distance = outside bubble (black)
    float displacementMap = 1.0 - smoothstep(-edgeTransition, edgeTransition, distToRect);
    
    // Result: 1 (white) inside bubble = maximum displacement toward camera
    //         0 (black) at edges = no displacement = stays put
    //         Smooth transition controlled by edgeTransition
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
  cornerRoundness?: number;
  testTexture?: Texture;
  bubbleSize?: number;
  edgeTransition?: number;
  [key: string]: unknown;
}

export default function ScreenShaderMaterial({
  debugMode = 0,
  scanlineStrength = 0.15,
  curvatureAmount = 0.03,
  edgeHarshness = 5.4,
  edgeWidth = 0.22,
  centerSoftness = 0.1,
  cornerRoundness = 1.0,
  testTexture,
  bubbleSize = 1.0,
  edgeTransition = 0.1,
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
          cornerRoundness: { value: cornerRoundness },
          bubbleSize: { value: bubbleSize },
          edgeTransition: { value: edgeTransition },
        },
        vertexShader,
        fragmentShader,
      }),
    [checkerboard, testTexture, scanlineStrength, curvatureAmount, debugMode, edgeHarshness, edgeWidth, centerSoftness, cornerRoundness, bubbleSize, edgeTransition]
  );

  // Update uniforms on prop change
  material.uniforms.scanlineStrength.value = scanlineStrength;
  material.uniforms.curvatureAmount.value = curvatureAmount;
  material.uniforms.debugMode.value = debugMode;
  material.uniforms.edgeHarshness.value = edgeHarshness;
  material.uniforms.edgeWidth.value = edgeWidth;
  material.uniforms.centerSoftness.value = centerSoftness;
  material.uniforms.cornerRoundness.value = cornerRoundness;
  material.uniforms.bubbleSize.value = bubbleSize;
  material.uniforms.edgeTransition.value = edgeTransition;
  if (testTexture) material.uniforms.screenTex.value = testTexture;

  return <primitive object={material} attach="material" {...props} />;
} 