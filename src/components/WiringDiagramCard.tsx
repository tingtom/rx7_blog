interface WiringDiagram {
  _id: string;
  title: string;
  slug: { current: string };
  description?: string;
  category?: string;
  yearRange?: string;
  wireColors?: string[];
  connectors?: string[];
  ecuPins?: string[];
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

export default function WiringDiagramCard({ diagram }: { diagram: WiringDiagram }) {
  return (
    <a
      href={`/wiring/${diagram.slug.current}`}
      className="block bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Image */}
      <div className="h-48 bg-gray-100 overflow-hidden relative">
        {diagram.imageUrl ? (
          <img
            src={diagram.imageUrl}
            alt={diagram.title}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No image
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold line-clamp-2">{diagram.title}</h3>
        </div>
        
        {/* Year range */}
        {diagram.yearRange && (
          <p className="text-sm text-gray-600 mb-2">{diagram.yearRange}</p>
        )}
        
         {/* Wire colors preview */}
         {diagram.wireColors && diagram.wireColors.length > 0 && (
           <div className="flex flex-wrap gap-1 mb-2">
             {diagram.wireColors.slice(0, 4).map((color, i) => {
               const { className, style } = getWireColorInfo(color);
               return (
                 <span
                   key={i}
                   className={`text-xs px-2 py-0.5 rounded ${className}`}
                   style={style}
                 >
                   {color}
                 </span>
               );
             })}
             {diagram.wireColors.length > 4 && (
               <span className="text-xs text-gray-500">
                 +{diagram.wireColors.length - 4} more
               </span>
             )}
           </div>
         )}
        
        {/* Category badge */}
        {diagram.category && (
          <span className="inline-block text-xs bg-red-100 text-red-800 px-2 py-1 rounded mt-2">
            {diagram.category}
          </span>
        )}
      </div>
    </a>
  );
}
