import { useMemo } from 'react';
import { ShaderMaterial, CubeTexture } from 'three';
import { extend } from '@react-three/fiber';

// GLSL shader for glass overlay with same displacement as screen
const vertexShader = `
varying vec2 vUv;
varying vec2 vWorldPos;
varying vec3 vNormal;
varying vec3 vPosition;

uniform float cornerRoundness;
uniform float bubbleSize;
uniform float edgeTransition;
uniform float displacementAmount;
uniform float screenWidth;
uniform float screenHeight;

// Bubble displacement map generator using world coordinates (same as screen)
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
  vWorldPos = position.xy;
  
  // Calculate bubble displacement using world coordinates (same as screen)
  float cornerRadius = mix(0.01, 0.3, cornerRoundness);
  float displacement = bubbleMapWorld(vWorldPos, cornerRadius, bubbleSize, edgeTransition, screenWidth, screenHeight);
  
  // Apply displacement along normal (Z direction for flat plane)
  vec3 displaced = position + normal * displacement * displacementAmount;
  
  // Store displaced normal for refraction calculations
  vNormal = normalize(normalMatrix * normal);
  vPosition = displaced;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
varying vec2 vWorldPos;
varying vec3 vNormal;
varying vec3 vPosition;

uniform float glassOpacity;
uniform float refractionIndex;
uniform float reflectionStrength;
uniform vec3 glassTint;
uniform float glassThickness;
uniform float fresnelPower;
uniform samplerCube envMap;
uniform float cornerRoundness;
uniform float bubbleSize;
uniform float edgeTransition;
uniform float screenWidth;
uniform float screenHeight;
uniform float reflectionClamp;

// Bubble displacement map generator using world coordinates (same as screen and vertex shader)
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
  // Calculate fresnel effect for more realistic glass
  vec3 viewDirection = normalize(cameraPosition - vPosition);
  float fresnel = pow(1.0 - max(dot(vNormal, viewDirection), 0.0), fresnelPower);
  
  // Base glass color with tint
  vec3 baseColor = glassTint;
  
  // Calculate bubble map using the same parameters as displacement
  float cornerRadius = mix(0.01, 0.3, cornerRoundness);
  float bubbleMap = bubbleMapWorld(vWorldPos, cornerRadius, bubbleSize, edgeTransition, screenWidth, screenHeight);
  
  // Invert the bubble map so reflections are stronger at edges (where glass is curved)
  // and weaker in center (where glass is flat)
  float invertedBubbleMap = 1.0 - bubbleMap;
  
  // Clamp the inverted bubble map so it doesn't go completely black in center
  // This ensures there's still some reflection in the center (grey instead of black)
  float clampedBubbleMap = max(invertedBubbleMap, reflectionClamp);
  
  // Use clamped inverted bubble map to control reflection strength, with subtle fresnel influence
  float reflection = clampedBubbleMap * reflectionStrength * (0.5 + 0.5 * fresnel);
  
  // Mix reflection and refraction based on fresnel for opacity
  float finalOpacity = mix(glassOpacity, glassOpacity * 0.3, fresnel);
  
  // Add environment reflections
  vec3 viewDir = normalize(cameraPosition - vPosition);
  vec3 reflectDir = reflect(-viewDir, normalize(vNormal));
  vec3 envColor = textureCube(envMap, reflectDir).rgb;
  vec3 finalColor = mix(baseColor, envColor, reflection);
  
  gl_FragColor = vec4(finalColor, finalOpacity);
}
`;

extend({ ShaderMaterial });

interface GlassShaderMaterialProps {
  cornerRoundness?: number;
  bubbleSize?: number;
  edgeTransition?: number;
  displacementAmount?: number;
  screenWidth?: number;
  screenHeight?: number;
  glassOpacity?: number;
  refractionIndex?: number;
  reflectionStrength?: number;
  glassTint?: [number, number, number];
  glassThickness?: number;
  fresnelPower?: number;
  envMap?: CubeTexture;
  reflectionClamp?: number;
  [key: string]: unknown;
}

export default function GlassShaderMaterial({
  cornerRoundness = 0.4,
  bubbleSize = 0.99,
  edgeTransition = 0.15,
  displacementAmount = 0.07,
  screenWidth = 1.0,
  screenHeight = 1.0,
  glassOpacity = 0.1,
  refractionIndex = 1.5,
  reflectionStrength = 0.3,
  glassTint = [0.9, 0.95, 1.0],
  glassThickness = 0.01,
  fresnelPower = 2.0,
  envMap,
  reflectionClamp = 0.1,
  ...props
}: GlassShaderMaterialProps) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          cornerRoundness: { value: cornerRoundness },
          bubbleSize: { value: bubbleSize },
          edgeTransition: { value: edgeTransition },
          displacementAmount: { value: displacementAmount },
          screenWidth: { value: screenWidth },
          screenHeight: { value: screenHeight },
          glassOpacity: { value: glassOpacity },
          refractionIndex: { value: refractionIndex },
          reflectionStrength: { value: reflectionStrength },
          glassTint: { value: glassTint },
          glassThickness: { value: glassThickness },
          fresnelPower: { value: fresnelPower },
          envMap: { value: envMap || null },
          reflectionClamp: { value: reflectionClamp },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        side: 2, // DoubleSide for glass effect
      }),
    [cornerRoundness, bubbleSize, edgeTransition, displacementAmount, screenWidth, screenHeight, glassOpacity, refractionIndex, reflectionStrength, glassTint, glassThickness, fresnelPower, envMap, reflectionClamp]
  );

  // Update uniforms on prop change
  material.uniforms.cornerRoundness.value = cornerRoundness;
  material.uniforms.bubbleSize.value = bubbleSize;
  material.uniforms.edgeTransition.value = edgeTransition;
  material.uniforms.displacementAmount.value = displacementAmount;
  material.uniforms.screenWidth.value = screenWidth;
  material.uniforms.screenHeight.value = screenHeight;
  material.uniforms.glassOpacity.value = glassOpacity;
  material.uniforms.refractionIndex.value = refractionIndex;
  material.uniforms.reflectionStrength.value = reflectionStrength;
  material.uniforms.glassTint.value = glassTint;
  material.uniforms.glassThickness.value = glassThickness;
  material.uniforms.fresnelPower.value = fresnelPower;
  material.uniforms.envMap.value = envMap || null;
  material.uniforms.reflectionClamp.value = reflectionClamp;

  return <primitive object={material} attach="material" {...props} />;
} 