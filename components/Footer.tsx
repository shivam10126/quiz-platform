'use client';

import Link from 'next/link';
import { Github } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith('/quiz/')) return null;

  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h2 className="text-xl font-bold">Quiz Platform</h2>
            <p className="mt-2 text-muted-foreground">Test your knowledge, challenge your mind.</p>
            <p className="mt-2 text-sm text-muted-foreground">Results, profiles and custom quizzes are stored only in this browser.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Explore</h3>
            <nav className="flex flex-col space-y-2 text-muted-foreground" aria-label="Footer">
              <Link href="/" className="hover:text-foreground">Quizzes</Link>
              <Link href="/create" className="hover:text-foreground">Create a quiz</Link>
              <Link href="/history" className="hover:text-foreground">History</Link>
              <Link href="/profile" className="hover:text-foreground">Profile and badges</Link>
            </nav>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Source</h3>
            <a
              href="https://github.com/shivam10126/quiz-platform"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Github size={20} /> View on GitHub
            </a>
          </div>
        </div>
        <div className="mt-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Quiz Platform. Built with Next.js.
        </div>
      </div>
    </footer>
  );
}
