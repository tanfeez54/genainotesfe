import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'NoteGen AI — Turn Any URL into Study Notes',
    template: '%s | NoteGen AI',
  },
  description:
    'Paste a URL, choose your settings, and get structured AI-powered study notes in seconds. Perfect for exam prep, revision, and deep learning.',
  keywords: ['AI notes', 'study notes generator', 'URL to notes', 'AI study tool'],
  openGraph: {
    title: 'NoteGen AI — Turn Any URL into Study Notes',
    description: 'AI-powered study notes from any web page',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
