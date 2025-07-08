'use client';

import * as THREE from 'three';
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';

// Vertex shader string
const vertexShader = `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

// Fragment shader string
const fragmentShader = `
varying vec3 vWorldPosition;
uniform vec3 uColor;
uniform float uScale;
uniform float uStrength;

float random(vec3 p) {
  return fract(sin(dot(p ,vec3(12.9898,78.233,37.719))) * 43758.5453);
}

float noise(vec3 p){
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(mix(mix( random(i + vec3(0,0,0)),
                     random(i + vec3(1,0,0)),f.x),
                 mix( random(i + vec3(0,1,0)),
                     random(i + vec3(1,1,0)),f.x),f.y),
             mix(mix( random(i + vec3(0,0,1)),
                     random(i + vec3(1,0,1)),f.x),
                 mix( random(i + vec3(0,1,1)),
                     random(i + vec3(1,1,1)),f.x),f.y),f.z);
}

float triplanar(vec3 pos) {
  float x = noise(pos.yzx * uScale);
  float y = noise(pos.zxy * uScale);
  float z = noise(pos.xyz * uScale);
  return (x + y + z) / 3.0;
}

void main() {
  float n = triplanar(vWorldPosition);
  // Encode bump as grayscale
  float height = n * uStrength;
  gl_FragColor = vec4(uColor, 1.0);
  gl_FragColor.rgb += height;
}
`;

export default function MonitorShaderMaterial(props: {
  color?: string;
  scale?: number;
  strength?: number;
}) {
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(props.color || '#2a2a2a') },
      uScale: { value: props.scale ?? 3.0 },
      uStrength: { value: props.strength ?? 0.05 },
    },
    vertexShader,
    fragmentShader,
  }), [props.color, props.scale, props.strength]);

  useFrame((_, delta) => {
    material.uniforms.uTime.value += delta;
  });

  return <primitive object={material} attach="material" />;
}