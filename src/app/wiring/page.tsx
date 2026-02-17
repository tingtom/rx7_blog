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
  components?: string[];
  connectors?: string[];
  ecuPins?: string[];
  imageUrl?: string;
}

export default async function WiringPage({
  searchParams,
}: {
  searchParams: { 
    q?: string; 
    category?: string;
    wireColor?: string;
    component?: string;
    connector?: string;
  };
}) {
  const query = searchParams.q || '';
  const categoryFilter = searchParams.category || 'all';
  const wireColorFilter = searchParams.wireColor || '';
  const componentFilter = searchParams.component || '';
  const connectorFilter = searchParams.connector || '';

  // Fetch distinct values for filters (deduplicated)
  const [allCategories, allWireColors, allComponents, allConnectors] = await Promise.allSettled([
    sanityFetch<string[]>(`distinct(*[_type == "wiringDiagram"].category)`),
    sanityFetch<string[]>(`distinct(*[_type == "wiringDiagram"].wireColors[])`),
    sanityFetch<string[]>(`distinct(*[_type == "wiringDiagram"].components[])`),
    sanityFetch<string[]>(`distinct(*[_type == "wiringDiagram"].connectors[])`),
  ]);

  const categories = allCategories.status === 'fulfilled' ? allCategories.value.sort() : [];
  const wireColors = allWireColors.status === 'fulfilled' ? allWireColors.value.sort() : [];
  const components = allComponents.status === 'fulfilled' ? allComponents.value.sort() : [];
  const connectors = allConnectors.status === 'fulfilled' ? allConnectors.value.sort() : [];

  // Log errors if any fetch failed
  if (allCategories.status === 'rejected') console.error('Categories fetch failed:', allCategories.reason);
  if (allWireColors.status === 'rejected') console.error('Wire colors fetch failed:', allWireColors.reason);
  if (allComponents.status === 'rejected') console.error('Components fetch failed:', allComponents.reason);
  if (allConnectors.status === 'rejected') console.error('Connectors fetch failed:', allConnectors.reason);

  // Build GROQ query with dynamic filters across multiple fields
  const conditions: string[] = [];

  // General text search across multiple fields
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

  // Exact filters (use 'in' operator for arrays)
  if (categoryFilter !== 'all') {
    conditions.push(`category == $category`);
  }
  if (wireColorFilter) {
    conditions.push(`$wireColor in wireColors`);
  }
  if (componentFilter) {
    conditions.push(`$component in components`);
  }
  if (connectorFilter) {
    conditions.push(`$connector in connectors`);
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
    category: categoryFilter,
    wireColor: wireColorFilter,
    component: componentFilter,
    connector: connectorFilter,
  });

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Wiring Diagrams</h1>
      </div>

      {/* Search & Filters */}
      <WiringSearch
        initialQuery={query}
        initialCategory={categoryFilter}
        initialWireColor={wireColorFilter}
        initialComponent={componentFilter}
        initialConnector={connectorFilter}
        categories={categories}
        wireColors={wireColors}
        components={components}
        connectors={connectors}
      />

      {/* Results */}
      {diagrams.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No wiring diagrams found.</p>
          {(query || categoryFilter !== 'all' || wireColorFilter || componentFilter || connectorFilter) && (
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
            {wireColorFilter && ` with wire color "${wireColorFilter}"`}
            {componentFilter && ` with component "${componentFilter}"`}
            {connectorFilter && ` with connector "${connectorFilter}"`}
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
