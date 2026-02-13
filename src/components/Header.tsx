'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-gray-900 text-white">
      <nav className="container mx-auto px-4 py-5">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tighter">
            rx7<span className="text-red-500">.pro</span>
          </Link>
          
          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Desktop menu */}
          <div className="hidden md:flex space-x-8">
            <Link href="/blog" className="hover:text-red-500 transition-colors">
              Blog
            </Link>
            <Link href="/models" className="hover:text-red-500 transition-colors">
              3D Models
            </Link>
            <Link href="/wiring" className="hover:text-red-500 transition-colors">
              Wiring
            </Link>
            <Link href="/about" className="hover:text-red-500 transition-colors">
              About
            </Link>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 space-y-4">
            <Link
              href="/blog"
              className="block hover:text-red-500 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Blog
            </Link>
            <Link
              href="/models"
              className="block hover:text-red-500 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              3D Models
            </Link>
            <Link
              href="/wiring"
              className="block hover:text-red-500 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Wiring
            </Link>
            <Link
              href="/about"
              className="block hover:text-red-500 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}