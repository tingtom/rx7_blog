'use client';

import Image from 'next/image';
import Link from 'next/link';
import { urlFor } from '@/lib/sanity';

interface Model3DPreviewProps {
  title: string;
  slug: { current: string };
  previewImage: any;
  description: string;
  category: string;
  downloadCount: number;
}

export default function Model3DPreview({
  title,
  slug,
  previewImage,
  description,
  category,
  downloadCount,
}: Model3DPreviewProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-[1.02] transition-transform">
      <Link href={`/models/${slug.current}`}>
        <div className="relative h-48 w-full">
          {previewImage && (
            <Image
              src={urlFor(previewImage).url()}
              alt={title}
              fill
              className="object-cover"
            />
          )}
        </div>
        <div className="p-6">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold mb-2 text-gray-900">{title}</h2>
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
              {category}
            </span>
          </div>
          <p className="text-gray-700 text-sm mb-4">{description}</p>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">
            </span>
            <span className="text-red-600 hover:text-red-800 font-medium">
              View Model →
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
