import { sanityFetch } from '@/lib/sanity';
import WiringDiagramCard from '@/components/WiringDiagramCard';
import WiringSearch from '@/components/WiringSearch';

interface DiagramWithImage {
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

export default async function WiringPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string };
}) {
  const query = searchParams.q || '';
  const categoryFilter = searchParams.category || 'all';
  
  // Fetch all distinct categories for the dropdown
  const allCategories: string[] = await sanityFetch(`
    *[_type == "wiringDiagram" && defined(category)] | distinct(category)
  `);
  
  // Build GROQ query with dynamic search across multiple fields
  const conditions: string[] = [];
  if (query) {
    conditions.push(`(
      title match $query ||
      description match $query ||
      [].concat(wireColors)[*] match $query ||
      [].concat(components)[*] match $query ||
      [].concat(connectors)[*] match $query ||
      [].concat(ecuPins)[*] match $query
    )`);
  }
  if (categoryFilter !== 'all') {
    conditions.push(`category == $category`);
  }
  
  // Fetch diagrams with their image URLs
  const diagrams: DiagramWithImage[] = await sanityFetch(`
    *[_type == "wiringDiagram" ${conditions.length ? '&& ' + conditions.join(' && ') : ''}] {
      _id,
      title,
      slug,
      description,
      category,
      yearRange,
      wireColors,
      components,
      connectors,
      ecuPins,
      "imageUrl": diagramImage.asset->url
    } | order(publishedAt desc, title asc)
  `, { 
    query: `*${query}*`, 
    category: categoryFilter 
  });

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Wiring Diagrams</h1>
      </div>
      
      {/* Search & Filter */}
      <WiringSearch
        initialQuery={query}
        initialCategory={categoryFilter}
        categories={allCategories}
      />
      
      {/* Results */}
      {diagrams.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No wiring diagrams found.</p>
          {(query || categoryFilter !== 'all') && (
            <p className="text-gray-500 mt-2">
              Try adjusting your search or filter criteria.
            </p>
          )}
        </div>
      ) : (
        <>
          <p className="text-gray-600 mb-6">
            Showing {diagrams.length} diagram{diagrams.length !== 1 ? 's' : ''}
            {query && ` matching "${query}"`}
            {categoryFilter !== 'all' && ` in category "${categoryFilter}"`}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {diagrams.map((diagram) => (
              <WiringDiagramCard key={diagram._id} diagram={diagram} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Generate static params for all diagrams (for SSG)
export async function generateStaticParams() {
  const diagrams = await sanityFetch<Array<{ slug: { current: string } }>>(`
    *[_type == "wiringDiagram"] {
      slug
    }
  `);
  
  return diagrams.map((diagram) => ({
    slug: diagram.slug.current,
  }));
}