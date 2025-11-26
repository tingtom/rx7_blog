'use client';

import Image from 'next/image';
import Link from 'next/link';
import { urlFor } from '@/lib/sanity';
import { format } from 'date-fns';

interface BlogPostPreviewProps {
  title: string;
  slug: { current: string };
  mainImage: any;
  publishedAt: string;
  excerpt: string;
}

export default function BlogPostPreview({
  title,
  slug,
  mainImage,
  publishedAt,
  excerpt,
}: BlogPostPreviewProps) {
  return (
    <article className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-[1.02] transition-transform">
      <Link href={`/blog/${slug.current}`}>
        <div className="relative h-48 w-full">
          {mainImage && (
            <Image
              src={urlFor(mainImage).url()}
              alt={title}
              fill
              className="object-cover"
            />
          )}
        </div>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-2 text-gray-900">{title}</h2>
          <time className="text-sm text-gray-600 mb-4 block">
            {format(new Date(publishedAt), 'MMMM d, yyyy')}
          </time>
          <p className="text-gray-700">{excerpt}</p>
          <div className="mt-4">
            <span className="text-red-600 hover:text-red-800 font-medium">
              Read more →
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
