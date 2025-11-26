export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl md:text-5xl font-bold mb-8 text-gray-900">
        About rx7.pro
      </h1>
      <div className="prose prose-lg max-w-4xl">
        <p className="text-xl text-gray-700 mb-8">
          rx7.pro is the ultimate resource for FD3S RX7 enthusiasts, providing high-quality content,
          technical guides, and 3D printable parts for the community.
        </p>
        
        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Our Mission</h2>
        <p className="text-gray-700 mb-8">
          To create and share knowledge, tools, and resources that help FD3S owners maintain,
          modify, and enjoy their vehicles while building a supportive community.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">What We Offer</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-4 mb-8">
          <li>Detailed technical guides and documentation</li>
          <li>3D printable parts and modifications</li>
          <li>Community knowledge sharing</li>
          <li>Regular updates and new content</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Get Involved</h2>
        <p className="text-gray-700">
          We&apos;re always looking for contributors and community members. If you&apos;d like to share your
          knowledge or contribute 3D models, please reach out to us.
        </p>
      </div>
    </div>
  );
}
