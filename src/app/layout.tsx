import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RX7 FD3S Blog',
  description: 'A blog about the Mazda RX7 FD3S, featuring blog posts and 3D printable models',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <main className="bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  );
}
