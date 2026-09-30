import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-heading',
});

export const metadata: Metadata = {
  title: {
    default: 'NoteGen Academic — AI Teacher Lesson Suite & Board Exam Engine',
    template: '%s | NoteGen Academic',
  },
  description:
    'Transform physical textbooks into complete 7-Core Teacher Lesson Suites, compulsory student notes, homework sets, and CBSE/ICSE board examination papers.',
  keywords: ['AI lesson plans', 'CBSE exam papers', 'textbook OCR', 'teacher lesson suite', 'NoteGen Academic'],
  openGraph: {
    title: 'NoteGen Academic — AI Teacher Lesson Suite & Board Exam Engine',
    description: 'Transform physical textbooks into complete 7-Core Teacher Lesson Suites & CBSE/ICSE exam papers.',
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
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
