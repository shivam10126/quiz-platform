'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const showNavAndFooter = pathname === '/' || pathname === '/history';

  if (!showNavAndFooter) return null;

  return (
    <>
      <header className="bg-primary text-primary-foreground p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            Quiz Platform
          </Link>
          <nav className="hidden md:block">
            <ul className="flex space-x-4">
              <li>
                <Link href="/" className="hover:text-secondary-foreground">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/history" className="hover:text-secondary-foreground">
                  History
                </Link>
              </li>
            </ul>
          </nav>
          <div className="md:hidden">
            <Menu className="cursor-pointer" />
          </div>
        </div>
      </header>
    </>
  );
}
