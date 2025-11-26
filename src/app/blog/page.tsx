import { sanityFetch } from '@/lib/sanity';
import BlogPostPreview from '@/components/BlogPostPreview';

export default async function BlogPage() {
  const posts = await sanityFetch<any[]>(`
    *[_type == "post"] | order(publishedAt desc) {
      title,
      slug,
      mainImage,
      publishedAt,
      excerpt
    }
  `);

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl md:text-5xl font-bold mb-12 text-gray-900">
        Latest Posts
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <BlogPostPreview key={post.slug.current} {...post} />
        ))}
      </div>
    </div>
  );
}
