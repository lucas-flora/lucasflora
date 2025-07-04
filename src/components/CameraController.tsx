'use client';

import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';

interface CameraControllerProps {
  position: [number, number, number];
}

export default function CameraController({ position }: CameraControllerProps) {
  const { camera, set } = useThree();
  const targetPosition = useRef(position);

  // Update target position when prop changes
  useEffect(() => {
    targetPosition.current = position;
  }, [position]);

  // Use useFrame to ensure we maintain control every frame
  useFrame(() => {
    const [x, y, z] = targetPosition.current;
    
    // Only update if position actually changed to avoid unnecessary updates
    if (camera.position.x !== x || camera.position.y !== y || camera.position.z !== z) {
      camera.position.set(x, y, z);
      camera.lookAt(0, 0, 0); // Always look at center
      camera.updateProjectionMatrix();
      
      // Debug logging (remove later)
      console.log(`Camera moved to: ${x}, ${y}, ${z}`);
    }
  });

  // Disable automatic camera updates
  useEffect(() => {
    set({ camera });
    return () => {
      // Cleanup if needed
    };
  }, [camera, set]);

  return null; // This component doesn't render anything
} 