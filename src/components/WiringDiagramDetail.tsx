'use client';

import { getWireColorInfo, WireColorInfo } from '@/lib/wireColorUtils';

interface WiringDiagram {
  _id: string;
  title: string;
  slug: { current: string };
  description?: string;
  category?: string;
  yearRange?: string;
  wireColors?: string[];
  components?: string[];
  connectors?: string[];
  ecuPins?: string[];
  notes?: string;
  imageUrl?: string;
}

export default function WiringDiagramDetail({ diagram }: { diagram: WiringDiagram }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Diagram Image */}
        <div className="lg:col-span-2">
          <div className="relative rounded-lg shadow-lg overflow-hidden bg-white">
            {diagram.imageUrl ? (
              <img
                src={diagram.imageUrl}
                alt={diagram.title}
                className="w-full h-auto"
              />
            ) : (
              <div className="flex items-center justify-center h-96 text-gray-400">
                No image available
              </div>
            )}
          </div>
        </div>

        {/* Metadata Panel */}
        <div className="space-y-6">
          {/* Title & badges */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{diagram.title}</h1>
            <div className="flex flex-wrap gap-2">
              {diagram.category && (
                <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                  {diagram.category}
                </span>
              )}
              {diagram.yearRange && (
                <span className="inline-block bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm">
                  {diagram.yearRange}
                </span>
              )}
            </div>
          </div>

          {/* Description - no heading, inline style */}
          {diagram.description && (
            <p className="text-gray-600 mb-6">{diagram.description}</p>
          )}

           {/* Wire Colors */}
           {diagram.wireColors && diagram.wireColors.length > 0 && (
             <div>
               <h3 className="font-semibold mb-2 text-lg">Wire Colors</h3>
               <div className="flex flex-wrap gap-2">
                 {diagram.wireColors.map((color, i) => {
                   const { className, style } = getWireColorInfo(color);
                   return (
                     <span
                       key={i}
                       className={`px-3 py-1 rounded-full text-sm font-medium ${className}`}
                       style={style}
                     >
                       {color}
                     </span>
                   );
                 })}
               </div>
             </div>
           )}

          {/* Components */}
          {diagram.components && diagram.components.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-lg">Components</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1 bg-gray-50 p-4 rounded-lg">
                {diagram.components.map((component, i) => (
                  <li key={i}>{component}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Connectors */}
          {diagram.connectors && diagram.connectors.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-lg">Connectors</h3>
              <div className="flex flex-wrap gap-2">
                {diagram.connectors.map((connector, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm font-mono"
                  >
                    {connector}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ECU Pins */}
          {diagram.ecuPins && diagram.ecuPins.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-lg">ECU Pins</h3>
              <div className="flex flex-wrap gap-2">
                {diagram.ecuPins.map((pin, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-mono"
                  >
                    {pin}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {diagram.notes && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="font-semibold mb-2 text-lg">Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{diagram.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
