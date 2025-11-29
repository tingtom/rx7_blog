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
        <div className="bg-gradient-to-b from-gray-50 to-gray-100">
          <main>
            {children}
          </main>
          <footer className="border-t-2 border-gray-900 bg-gray-950 text-gray-300">
            <div className="flex flex-col items-center py-6 space-y-4">
              <div className="flex space-x-6">
                <a
                  href="https://cults3d.com/en/users/rx7pro/3d-models"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-transform hover:scale-110"
                >
                  <img
                    src="/logos/cults3d.png"
                    alt="Cults3D Logo"
                    className="h-8"
                  />
                </a>
                <a
                  href="https://www.printables.com/@rx7pro_225433"
                  className="transition-transform hover:scale-110"
                >
                  <img
                    src="/logos/printables.png"
                    alt="Printables Logo"
                    className="h-8"
                  />
                </a>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
