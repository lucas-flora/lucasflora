'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

interface SimpleCameraControllerProps {
  z: number;
}

export default function SimpleCameraController({ z }: SimpleCameraControllerProps) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.z = z;
  }, [camera, z]);

  return null;
} 