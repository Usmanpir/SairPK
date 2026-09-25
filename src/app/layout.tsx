import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Fraunces } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { PublicChrome } from '@/components/layout/PublicChrome';

const sans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  style: ['normal', 'italic'],
  display: 'swap'
});

export const metadata: Metadata = {
  title: {
    default: 'Sair Pakistan — Explore Pakistan Like Never Before',
    template: '%s | Sair Pakistan'
  },
  description:
    'Book hotels, tours, activities, transport and guides across Pakistan — Hunza, Skardu, Swat, Naran, Gwadar and more.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <Providers>
          <PublicChrome>{children}</PublicChrome>
        </Providers>
      </body>
    </html>
  );
}
