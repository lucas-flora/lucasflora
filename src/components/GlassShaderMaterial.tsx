import { useMemo } from 'react';
import { ShaderMaterial, CubeTexture, Texture } from 'three';
import { extend } from '@react-three/fiber';
import { useEffect } from 'react';

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

// Chromatic aberration uniforms
uniform sampler2D screenTexture;
uniform float chromaticAberrationBlackLevel;
uniform float chromaticAberrationWhiteLevel;
uniform float chromaticAberrationRedShift;
uniform float chromaticAberrationGreenShift;
uniform float chromaticAberrationBlueShift;
uniform float chromaticAberrationStrength;

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
  
  // Calculate bubble map using the same parameters as displacement
  float cornerRadius = mix(0.01, 0.3, cornerRoundness);
  float bubbleMap = bubbleMapWorld(vWorldPos, cornerRadius, bubbleSize, edgeTransition, screenWidth, screenHeight);
  
  // Invert the bubble map so effects are stronger at edges (where glass is curved)
  float invertedBubbleMap = 1.0 - bubbleMap;
  
  // LAYER 1: BASE TRANSMISSION (controlled by glassOpacity)
  vec3 baseTransmission = glassTint * (1.0 - glassOpacity);
  
  // LAYER 2: CHROMATIC ABERRATION (independent of glass opacity)
  vec3 chromaticColor = vec3(0.0);
  if (chromaticAberrationStrength > 0.001) {
    // Create aberration map using inverted bubble map
    float aberrationMap = (invertedBubbleMap - chromaticAberrationBlackLevel) / (chromaticAberrationWhiteLevel - chromaticAberrationBlackLevel);
    aberrationMap = clamp(aberrationMap, 0.0, 1.0);
    
    // Calculate base shift amounts for smearing direction
    float effectiveStrength = chromaticAberrationStrength * aberrationMap * 0.01;
    vec2 redShift = effectiveStrength * chromaticAberrationRedShift * vec2(1.0, 0.0);
    vec2 greenShift = effectiveStrength * chromaticAberrationGreenShift * vec2(1.0, 0.0);
    vec2 blueShift = effectiveStrength * chromaticAberrationBlueShift * vec2(1.0, 0.0);
    
    // Sample each channel with concentrated bleeding effect
    // Use strength to control blur radius - more concentrated samples for stronger bleeding
    float blurRadius = chromaticAberrationStrength * aberrationMap * 0.005; // Tighter radius control
    
    // Red channel bleeding - concentrated near center with sharp falloff
    float red = 0.0;
    red += texture2D(screenTexture, vUv).r * 0.6;  // Center sample, very strong
    red += texture2D(screenTexture, vUv + redShift * 0.3).r * 0.25;  // Close to center
    red += texture2D(screenTexture, vUv + redShift * 0.7).r * 0.1;   // Moderate distance
    red += texture2D(screenTexture, vUv + redShift).r * 0.05;        // Full shift, very weak
    
    // Green channel bleeding
    float green = 0.0;
    green += texture2D(screenTexture, vUv).g * 0.6;
    green += texture2D(screenTexture, vUv + greenShift * 0.3).g * 0.25;
    green += texture2D(screenTexture, vUv + greenShift * 0.7).g * 0.1;
    green += texture2D(screenTexture, vUv + greenShift).g * 0.05;
    
    // Blue channel bleeding
    float blue = 0.0;
    blue += texture2D(screenTexture, vUv).b * 0.6;
    blue += texture2D(screenTexture, vUv + blueShift * 0.3).b * 0.25;
    blue += texture2D(screenTexture, vUv + blueShift * 0.7).b * 0.1;
    blue += texture2D(screenTexture, vUv + blueShift).b * 0.05;
    
    chromaticColor = vec3(red, green, blue);
  }
  
  // LAYER 3: ENVIRONMENT REFLECTIONS (independent of glass opacity)
  vec3 viewDir = normalize(cameraPosition - vPosition);
  vec3 reflectDir = reflect(-viewDir, normalize(vNormal));
  vec3 envColor = textureCube(envMap, reflectDir).rgb;
  
  // Use clamped inverted bubble map to control reflection strength
  float clampedBubbleMap = max(invertedBubbleMap, reflectionClamp);
  float reflectionAmount = clampedBubbleMap * reflectionStrength * (0.5 + 0.5 * fresnel);
  
  // Calculate reflection color without extra boost
  vec3 reflectionColor = envColor * reflectionAmount;
  
  // LAYER 4: COMPOSITE ALL LAYERS
  vec3 finalColor = vec3(0.0);
  
  // Start with base transmission (preserves background color)
  finalColor = baseTransmission;
  
  // If we have chromatic aberration, blend it carefully to preserve background
  if (chromaticAberrationStrength > 0.001) {
    // Only apply chromatic aberration where there's actual content
    // Use the luminance of the chromatic color to determine blend amount
    float chromaticLuminance = dot(chromaticColor, vec3(0.299, 0.587, 0.114));
    float blendAmount = chromaticLuminance * 0.8; // Scale down the blend
    
    // Blend chromatic aberration over the background, preserving background where content is dark
    finalColor = mix(baseTransmission, chromaticColor, blendAmount);
  }
  
  // Add reflections on top (PRESERVE REFLECTIONS!)
  finalColor += reflectionColor;
  
  // LAYER 5: FINAL ALPHA - Glass material visibility (NOT transmission)
  // This should be high enough to see the effects, independent of transmission
  float materialAlpha = 0.9; // Increase to ensure visibility
  
  gl_FragColor = vec4(finalColor, materialAlpha);
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
  // Chromatic aberration props
  screenTexture?: Texture;
  chromaticAberrationBlackLevel?: number;
  chromaticAberrationWhiteLevel?: number;
  chromaticAberrationRedShift?: number;
  chromaticAberrationGreenShift?: number;
  chromaticAberrationBlueShift?: number;
  chromaticAberrationStrength?: number;
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
  // Chromatic aberration defaults
  screenTexture,
  chromaticAberrationBlackLevel = 0.0,
  chromaticAberrationWhiteLevel = 1.0,
  chromaticAberrationRedShift = -1.0,
  chromaticAberrationGreenShift = 0.0,
  chromaticAberrationBlueShift = 1.0,
  chromaticAberrationStrength = 0.0,
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
          // Chromatic aberration uniforms
          screenTexture: { value: screenTexture || null },
          chromaticAberrationBlackLevel: { value: chromaticAberrationBlackLevel },
          chromaticAberrationWhiteLevel: { value: chromaticAberrationWhiteLevel },
          chromaticAberrationRedShift: { value: chromaticAberrationRedShift },
          chromaticAberrationGreenShift: { value: chromaticAberrationGreenShift },
          chromaticAberrationBlueShift: { value: chromaticAberrationBlueShift },
          chromaticAberrationStrength: { value: chromaticAberrationStrength },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        side: 2, // DoubleSide for glass effect
      }),
    [cornerRoundness, bubbleSize, edgeTransition, displacementAmount, screenWidth, screenHeight, glassOpacity, refractionIndex, reflectionStrength, glassTint, glassThickness, fresnelPower, envMap, reflectionClamp, screenTexture, chromaticAberrationBlackLevel, chromaticAberrationWhiteLevel, chromaticAberrationRedShift, chromaticAberrationGreenShift, chromaticAberrationBlueShift, chromaticAberrationStrength]
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
  // Update chromatic aberration uniforms
  material.uniforms.screenTexture.value = screenTexture || null;
  material.uniforms.chromaticAberrationBlackLevel.value = chromaticAberrationBlackLevel;
  material.uniforms.chromaticAberrationWhiteLevel.value = chromaticAberrationWhiteLevel;
  material.uniforms.chromaticAberrationRedShift.value = chromaticAberrationRedShift;
  material.uniforms.chromaticAberrationGreenShift.value = chromaticAberrationGreenShift;
  material.uniforms.chromaticAberrationBlueShift.value = chromaticAberrationBlueShift;
  material.uniforms.chromaticAberrationStrength.value = chromaticAberrationStrength;

  // Guard and update envMap only when it changes
  useEffect(() => {
    if (envMap && material.uniforms.envMap.value !== envMap) {
      material.uniforms.envMap.value = envMap;
      material.uniformsNeedUpdate = true;
    }
  }, [material, envMap]);

  return <primitive object={material} attach="material" key={envMap?.uuid} {...props} />;
} 