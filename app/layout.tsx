import type React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ToastProvider } from '@/components/ui/toast';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ProfileProvider } from '@/components/ProfileProvider';
import { THEME_INIT_SCRIPT } from '@/lib/settings';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Quiz Platform',
    template: '%s | Quiz Platform',
  },
  description:
    'Timed quizzes across science, programming, maths, geography and history. Build your own quizzes, track streaks and earn badges. Everything stays in your browser.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${inter.className} bg-background text-foreground flex flex-col min-h-screen`}>
        <ThemeProvider>
          <ToastProvider>
            <ProfileProvider>
              <Header />
              <main className="container mx-auto px-4 py-8 flex-grow">{children}</main>
              <Footer />
            </ProfileProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
