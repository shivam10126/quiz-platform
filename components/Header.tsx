'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, Sun, Moon, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';
import { useProfile } from '@/components/ProfileProvider';

const links = [
  { href: '/', label: 'Home' },
  { href: '/create', label: 'Create' },
  { href: '/history', label: 'History' },
  { href: '/profile', label: 'Profile' },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { resolved, toggle } = useTheme();
  const { active, ready } = useProfile();

  useEffect(() => setOpen(false), [pathname]);

  // Keep the quiz itself distraction-free: no nav while a quiz is in progress.
  if (pathname.startsWith('/quiz/')) return null;

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  const themeButton = (
    <button
      type="button"
      onClick={toggle}
      aria-label={resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="rounded-full p-2 hover:bg-accent transition-colors"
    >
      {resolved === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );

  const profileChip = (
    <Link
      href="/profile"
      className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
      aria-label="Open profile"
    >
      <span aria-hidden="true">{ready ? active.avatar : '👤'}</span>
      <span className="max-w-[8rem] truncate">{ready ? active.name : 'Profile'}</span>
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          Quiz Platform
        </Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? 'page' : undefined}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent',
                isActive(l.href) && 'bg-primary/10 text-primary'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {themeButton}
          {profileChip}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          {themeButton}
          <button
            type="button"
            className="rounded-full p-2 hover:bg-accent"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden border-t border-border" aria-label="Main">
          <ul className="container mx-auto flex flex-col gap-1 p-3">
            <li className="mb-1">{profileChip}</li>
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isActive(l.href) ? 'page' : undefined}
                  className={cn('block rounded-lg px-3 py-2 hover:bg-accent', isActive(l.href) && 'bg-primary/10 text-primary font-semibold')}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
