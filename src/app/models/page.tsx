import { sanityFetch } from '@/lib/sanity';
import Model3DPreview from '@/components/Model3DPreview';

export default async function ModelsPage() {
  const models = await sanityFetch<any[]>(`
    *[_type == "model3d"] | order(publishedAt desc) {
      title,
      slug,
      previewImage,
      description,
      category,
      downloadCount
    }
  `);

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl md:text-5xl font-bold mb-12 text-gray-900">
        3D Models
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {models.map((model) => (
          <Model3DPreview key={model.slug.current} {...model} />
        ))}
      </div>
    </div>
  );
}
