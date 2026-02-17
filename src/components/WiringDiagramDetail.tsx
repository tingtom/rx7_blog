'use client';

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

interface WireColorInfo {
  className: string;
  style?: React.CSSProperties;
}

function getWireColorInfo(color: string): WireColorInfo {
  const colorMap: Record<string, { bgClass: string; textClass: string; hex: string }> = {
    red: { bgClass: 'bg-red-600', textClass: 'text-white', hex: '#dc2626' },
    black: { bgClass: 'bg-gray-900', textClass: 'text-white', hex: '#171717' },
    yellow: { bgClass: 'bg-yellow-400', textClass: 'text-black', hex: '#facc15' },
    green: { bgClass: 'bg-green-600', textClass: 'text-white', hex: '#16a34a' },
    white: { bgClass: 'bg-gray-200', textClass: 'text-gray-900', hex: '#e5e7eb' },
    blue: { bgClass: 'bg-blue-600', textClass: 'text-white', hex: '#2563eb' },
    brown: { bgClass: 'bg-amber-700', textClass: 'text-white', hex: '#b45309' },
    orange: { bgClass: 'bg-orange-500', textClass: 'text-white', hex: '#ea580c' },
    purple: { bgClass: 'bg-purple-600', textClass: 'text-white', hex: '#a855f7' },
    pink: { bgClass: 'bg-pink-500', textClass: 'text-white', hex: '#ec4899' },
  };

  const findKey = (s: string): string | null => {
    s = s.toLowerCase();
    for (const k of Object.keys(colorMap)) {
      if (s.includes(k)) return k;
    }
    return null;
  };

  // Check for split colors (e.g., "Red/Black", "Green-White", "Blue|White")
  const sepMatch = /[\/\-|]/.exec(color);
  if (sepMatch) {
    const parts = color.split(sepMatch[0]).map(p => p.trim());
    if (parts.length >= 2) {
      const k1 = findKey(parts[0]);
      const k2 = findKey(parts[1]);
      if (k1 && k2 && k1 !== k2) {
        const h1 = colorMap[k1].hex;
        const h2 = colorMap[k2].hex;
        const text = colorMap[k1].textClass; // use first color for text
        return {
          className: text,
          style: { background: 'linear-gradient(135deg, ' + h1 + ' 50%, ' + h2 + ' 50%)' }
        };
      }
    }
  }

  // Single color
  const k = findKey(color);
  if (k) {
    const { bgClass, textClass } = colorMap[k];
    return { className: `${bgClass} ${textClass}` };
  }

  return { className: 'bg-gray-200 text-gray-800' };
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
