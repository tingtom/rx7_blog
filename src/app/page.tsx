import { sanityFetch } from '@/lib/sanity';
import BlogPostPreview from '@/components/BlogPostPreview';
import Model3DPreview from '@/components/Model3DPreview';

async function getLatestContent() {
  const posts = await sanityFetch<any[]>(`
    *[_type == "post"] | order(publishedAt desc)[0...3] {
      title,
      slug,
      mainImage,
      publishedAt,
      excerpt
    }
  `);

  const models = await sanityFetch<any[]>(`
    *[_type == "model3d" && defined(publishedAt)] | order(publishedAt desc)[0...3] {
      title,
      slug,
      previewImage,
      description,
      category,
      downloadCount
    }
  `);

  return { posts, models };
}

export default async function Home() {
  const { posts, models } = await getLatestContent();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-black">
        <div 
          className="absolute inset-0 bg-[url('/images/rx7-bg.jpg')] bg-cover bg-center bg-no-repeat z-0"
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/80 z-10"></div>
        <div className="container mx-auto px-4 relative z-20 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white tracking-tighter">
            rx7<span className="text-red-500">.pro</span>
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-gray-200 max-w-3xl mx-auto">
            The ultimate resource for FD3S owners and enthusiasts.<br/>
            Featuring guides, 3D printed parts, and community knowledge.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/blog" className="inline-block px-8 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-lg font-semibold">
              Read Blog Posts
            </a>
            <a href="/models" className="inline-block px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-colors text-lg font-semibold border border-white/30">
              Explore 3D Models
            </a>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Latest Blog Posts */}
        <section className="mb-24">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Latest Blog Posts
            </h2>
            <a href="/blog" className="text-red-600 hover:text-red-700 font-semibold flex items-center gap-2">
              View All Posts
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <BlogPostPreview key={post.slug.current} {...post} />
            ))}
          </div>
        </section>

        {/* Featured 3D Models */}
        <section className="mb-16">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Featured 3D Models
            </h2>
            <a href="/models" className="text-red-600 hover:text-red-700 font-semibold flex items-center gap-2">
              View All Models
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {models.map((model) => (
              <Model3DPreview key={model.slug.current} {...model} />
            ))}
            {models.length === 0 && (
              <p className="text-gray-600">No 3D models have been added yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
