interface WiringSearchProps {
  initialQuery?: string;
  initialCategory?: string;
  categories: string[];
}

export default function WiringSearch({
  initialQuery = '',
  initialCategory = 'all',
  categories
}: WiringSearchProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8">
      {/* Search form */}
      <form action="/wiring" method="get" className="flex-1 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={initialQuery}
          placeholder="Search wire colors, components, pins, connectors..."
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        {initialQuery && (
          <button
            type="submit"
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          >
            Clear
          </button>
        )}
      </form>
      
      {/* Category filter */}
      <form action="/wiring" method="get" className="flex gap-2">
        {initialQuery && <input type="hidden" name="q" value={initialQuery} />}
        <select
          name="category"
          defaultValue={initialCategory}
          onChange="this.form.submit()"
          className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {initialCategory !== 'all' && (
          <button
            type="submit"
            name="category"
            value="all"
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          >
            Clear
          </button>
        )}
      </form>
    </div>
  );
}