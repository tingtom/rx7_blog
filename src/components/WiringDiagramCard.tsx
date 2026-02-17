import { getWireColorInfo, WireColorInfo } from '@/lib/wireColorUtils';

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
