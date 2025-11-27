import { sanityFetch } from '@/lib/sanity';
import { urlFor } from '@/lib/sanity';
import Image from 'next/image';
import Model3DViewer from '@/components/Model3DViewer';

async function getModel(slug: string) {
  return await sanityFetch<any>(`
    *[_type == "model3d" && defined(publishedAt) && slug.current == $slug][0] {
      title,
      description,
      modelFile,
      previewImage,
      category,
      downloadCount,
      publishedAt
    }
  `, { slug });
}

export default async function ModelPage({
  params: { slug },
}: {
  params: { slug: string };
}) {
  const model = await getModel(slug);

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Hero Section */}
          <div className="relative h-[40vh] min-h-[300px]">
            {model?.previewImage && (
              <Image
                src={urlFor(model.previewImage).url()}
                alt={model.title}
                fill
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <h1 className="text-4xl font-bold text-white mb-2">{model?.title}</h1>
              <div className="flex items-center gap-4">
                {model?.category && <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                  {model.category}
                </span>}
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8">
            <div className="max-w-4xl mx-auto">
              {/* 3D Viewer */}
              <div className="mb-8">
                <Model3DViewer modelUrl={model?.modelFile} />
              </div>

              {/* Description */}
              <div className="prose max-w-none">
                <h2 className="text-2xl font-bold mb-4">About this model</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{model?.description}</p>
              </div>

              {/* Download Button */}
              <div className="mt-8">
                <a
                  href={model?.modelFile}
                  download
                  className="inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-lg font-semibold gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Model
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
