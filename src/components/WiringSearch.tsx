interface WiringSearchProps {
  initialQuery?: string;
  initialCategory?: string;
  initialWireColor?: string;
  initialComponent?: string;
  initialConnector?: string;
  categories: string[];
  wireColors: string[];
  components: string[];
  connectors: string[];
}

export default function WiringSearch({
  initialQuery = '',
  initialCategory = 'all',
  initialWireColor = '',
  initialComponent = '',
  initialConnector = '',
  categories,
  wireColors,
  components,
  connectors,
}: WiringSearchProps) {
  return (
    <form action="/wiring" method="get" className="flex flex-col gap-4 mb-8">
      <div className="flex flex-col md:flex-row gap-2">
        {/* Search input */}
        <input
          type="text"
          name="q"
          defaultValue={initialQuery}
          placeholder="Search wire colors, components, pins, connectors..."
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        />

         {/* Category filter */}
         <select
           name="category"
           defaultValue={initialCategory}
           onChange={(e) => e.target.form?.submit()}
           className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
         >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

         {/* Wire Color filter */}
         <select
           name="wireColor"
           defaultValue={initialWireColor}
           onChange={(e) => e.target.form?.submit()}
           className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
         >
          <option value="">All Wire Colors</option>
          {wireColors.map(wc => (
            <option key={wc} value={wc}>{wc}</option>
          ))}
        </select>

         {/* Component filter */}
         <select
           name="component"
           defaultValue={initialComponent}
           onChange={(e) => e.target.form?.submit()}
           className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
         >
          <option value="">All Components</option>
          {components.map(comp => (
            <option key={comp} value={comp}>{comp}</option>
          ))}
        </select>

         {/* Connector filter */}
         <select
           name="connector"
           defaultValue={initialConnector}
           onChange={(e) => e.target.form?.submit()}
           className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
         >
          <option value="">All Connectors</option>
          {connectors.map(conn => (
            <option key={conn} value={conn}>{conn}</option>
          ))}
        </select>
      </div>
    </form>
  );
}
