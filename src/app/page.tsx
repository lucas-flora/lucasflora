'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWebGPU } from '../utils/useWebGPU';
import TerminalController from '../components/TerminalController';
import FallbackPage from '../components/FallbackPage';
import { TerminalEntry } from '../lib/terminal-types';

// Dynamically import Canvas to avoid SSR issues
const Canvas = dynamic(() => import('@react-three/fiber').then(mod => ({ default: mod.Canvas })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white">Loading 3D scene...</div>
    </div>
  ),
});

// Temporary 3D scene component for testing
function TestScene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>
    </>
  );
}

export default function Home() {
  const [entries, setEntries] = useState<TerminalEntry[]>([]);
  const { supported: webGPUSupported, loading: webGPULoading } = useWebGPU();

  const handleEntriesChange = (newEntries: TerminalEntry[]) => {
    setEntries(newEntries);
    console.log('Entries updated:', newEntries);
  };

  // Show loading state while checking WebGPU support
  if (webGPULoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Checking WebGPU support...</div>
      </div>
    );
  }

  // Show fallback page if WebGPU is not supported
  if (!webGPUSupported) {
    return <FallbackPage entries={entries} />;
  }

  // Show the 3D experience if WebGPU is supported
  return (
    <div className="min-h-screen bg-black relative">
      {/* R3F Canvas - will use WebGPU when available */}
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
        }}
        camera={{ position: [0, 0, 5] }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <TestScene />
      </Canvas>
      
      {/* Terminal overlay for now - will be integrated into 3D scene later */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="pointer-events-auto">
          <TerminalController onEntriesChange={handleEntriesChange} />
        </div>
      </div>
    </div>
  );
}
