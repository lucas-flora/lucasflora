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
varying float vFresnel;

uniform float curvatureAmount;

void main() {
  vUv = uv;
  // Convex displacement (bubble effect)
  float curve = sin(uv.x * 3.14159) * sin(uv.y * 3.14159) * curvatureAmount;
  vec3 displaced = position + normal * curve;
  // Fresnel: stronger at edges
  vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
  float fresnel = pow(1.0 - dot(viewDir, normal), 2.0);
  vFresnel = fresnel;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
varying float vFresnel;

uniform sampler2D screenTex;
uniform float scanlineStrength;
uniform int debugMode;

// Scanline effect
float scanline(vec2 uv, float strength) {
  float yLine = floor(uv.y * 480.0);
  float dim = mod(yLine, 2.0) < 1.0 ? 1.0 - strength : 1.0;
  return dim;
}

void main() {
  vec3 color = texture2D(screenTex, vUv).rgb;
  float scan = scanline(vUv, scanlineStrength);
  float fresnel = vFresnel;

  if (debugMode == 1) {
    gl_FragColor = vec4(vec3(fresnel), 1.0);
    return;
  } else if (debugMode == 2) {
    gl_FragColor = vec4(vec3(scan), 1.0);
    return;
  }

  // Normal: terminal color * scanline, add fresnel for subtle edge glow
  vec3 finalColor = color * scan + fresnel * 0.15;
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

extend({ ShaderMaterial });

interface ScreenShaderMaterialProps {
  debugMode?: number;
  scanlineStrength?: number;
  curvatureAmount?: number;
  testTexture?: Texture;
  [key: string]: unknown;
}

export default function ScreenShaderMaterial({
  debugMode = 0,
  scanlineStrength = 0.15,
  curvatureAmount = 0.03,
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
        },
        vertexShader,
        fragmentShader,
      }),
    [checkerboard, testTexture, scanlineStrength, curvatureAmount, debugMode]
  );

  // Update uniforms on prop change
  material.uniforms.scanlineStrength.value = scanlineStrength;
  material.uniforms.curvatureAmount.value = curvatureAmount;
  material.uniforms.debugMode.value = debugMode;
  if (testTexture) material.uniforms.screenTex.value = testTexture;

  return <primitive object={material} attach="material" {...props} />;
} 