import { sanityFetch } from '@/lib/sanity';
import { PortableText } from '@portabletext/react';
import Image from 'next/image';
import { urlFor } from '@/lib/sanity';

interface Post {
  title: string;
  mainImage: any;
  body: any[];
  publishedAt: string;
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await sanityFetch<Post>(`
    *[_type == "post" && slug.current == $slug][0] {
      title,
      mainImage,
      body,
      publishedAt
    }
  `, { slug: params.slug });

  if (!post) {
    return <div>Post not found</div>;
  }

  return (
    <article className="container mx-auto px-4 py-16 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
          {post.title}
        </h1>
        <time className="text-gray-600">
          {new Date(post.publishedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </time>
      </header>

      {post.mainImage && (
        <div className="relative w-full h-[400px] mb-8">
          <Image
            src={urlFor(post.mainImage).url()}
            alt={post.title}
            fill
            className="object-cover rounded-lg"
            priority
          />
        </div>
      )}

      <div className="prose prose-lg max-w-none">
        <PortableText value={post.body} />
      </div>
    </article>
  );
}

// Generate static params for all blog posts
export async function generateStaticParams() {
  const posts = await sanityFetch<Array<{ slug: { current: string } }>>(`
    *[_type == "post"] {
      slug
    }
  `);

  return posts.map((post) => ({
    slug: post.slug.current,
  }));
}
