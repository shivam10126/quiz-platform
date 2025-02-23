// app/layout.tsx
import type React from 'react';
import './globals.css';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Interactive Quiz Platform',
  description: 'Test your knowledge with our interactive quizzes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-foreground flex flex-col min-h-screen`}>
        <Header />
        <main className="container mx-auto px-4 py-8 flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
