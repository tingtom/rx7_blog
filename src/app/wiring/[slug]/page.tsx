import { notFound } from 'next/navigation';
import { sanityFetch } from '@/lib/sanity';
import WiringDiagramDetail from '@/components/WiringDiagramDetail';

interface DiagramDetail {
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
  notes?: string;
  imageUrl?: string;
}

export default async function WiringDiagramPage({
  params,
}: {
  params: { slug: string };
}) {
  const diagram = await sanityFetch<DiagramDetail>(
    `*[_type == "wiringDiagram" && slug.current == $slug][0] {
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
      notes,
      "imageUrl": diagramImage.asset->url
    }`,
    { slug: params.slug }
  );

  if (!diagram) {
    notFound();
  }

  return <WiringDiagramDetail diagram={diagram} />;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const diagram = await sanityFetch<
    Pick<DiagramDetail, 'title' | 'description'>
  >(
    `*[_type == "wiringDiagram" && slug.current == $slug][0] {
      title,
      description
    }`,
    { slug: params.slug }
  );

  if (!diagram) {
    return {};
  }

  return {
    title: `${diagram.title} - RX7 Wiring Diagrams`,
    description: diagram.description || 'RX7 FD3S wiring diagram',
  };
}

export async function generateStaticParams() {
  const diagrams = await sanityFetch<
    Array<{ slug: { current: string } }>
  >(`*[_type == "wiringDiagram"] { slug }`);

  return diagrams.map((diagram) => ({
    slug: diagram.slug.current,
  }));
}
