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
    default: 'ExamPrep AI — Turn Any Curriculum into Exam Papers',
    template: '%s | ExamPrep AI',
  },
  description:
    'Paste a curriculum, choose your settings, and get structured AI-powered examination papers in seconds. Perfect for teachers and schools.',
  keywords: ['AI exam papers', 'exam generator', 'test paper generator', 'AI school tool'],
  openGraph: {
    title: 'ExamPrep AI — Turn Any Curriculum into Exam Papers',
    description: 'AI-powered examination papers from any syllabus',
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
