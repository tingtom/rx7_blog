'use client';

import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { Suspense } from 'react';

function Model({ url }: { url: string }) {
  const geometry = useLoader(STLLoader, url);

  if (!geometry) {
    console.error('No geometry loaded');
    return null;
  }

  // Center the geometry
  geometry.center();
  // Compute the bounding box
  geometry.computeBoundingBox();
  
  // Calculate scale to make the model a reasonable size
  const box = geometry.boundingBox;
  const size = box?.max.sub(box.min);
  const maxDim = Math.max(size?.x || 1, size?.y || 1, size?.z || 1);
  const scale = 5 / maxDim; // Scale to make the largest dimension 5 units

  return (
    <mesh geometry={geometry} scale={scale}>
      <meshStandardMaterial color="#ff4444" roughness={0.5} metalness={0.5} />
    </mesh>
  );
}

export default function Scene({ modelUrl }: { modelUrl: string }) {
  return (
    <div className="w-full h-[500px] bg-gray-100 rounded-lg">
      <Canvas>
        <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={50} />
        <ambientLight intensity={0.8} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <Suspense fallback={null}>
          <Model url={modelUrl} />
        </Suspense>
        <OrbitControls enableDamping dampingFactor={0.05} autoRotate autoRotateSpeed={2} />
        <gridHelper args={[20, 20]} />
      </Canvas>
    </div>
  );
}
