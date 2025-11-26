'use client';

import dynamic from 'next/dynamic';
import React, { Suspense } from 'react';

// Dynamically import Three.js components with no SSR
const Scene = dynamic(() => import('./Scene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-gray-500">Loading 3D viewer...</div>
    </div>
  ),
});

export default function Model3DViewer({ modelUrl }: { modelUrl: string }) {
  return <Scene modelUrl={modelUrl} />;
}
