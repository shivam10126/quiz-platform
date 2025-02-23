'use client';

import Link from "next/link"
import { Facebook, Twitter, Instagram } from "lucide-react"
import { usePathname } from 'next/navigation';

export default function Footer() {
    const pathname = usePathname();
      const showNavAndFooter = pathname === '/' || pathname === '/history';
    
      if (!showNavAndFooter) return null;
  return (
    <footer className="bg-primary text-primary-foreground w-full">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h2 className="text-2xl font-bold">Quiz Platform</h2>
            <p className="mt-2">Test your knowledge, challenge your mind!</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Quick Links</h3>
            <nav className="flex flex-col space-y-2">
              <Link href="/" className="hover:text-secondary-foreground transition-colors">
                Home
              </Link>
              <Link href="/history" className="hover:text-secondary-foreground transition-colors">
                History
              </Link>
            </nav>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Connect With Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-secondary-foreground transition-colors">
                <Facebook size={24} />
              </a>
              <a href="#" className="hover:text-secondary-foreground transition-colors">
                <Twitter size={24} />
              </a>
              <a href="#" className="hover:text-secondary-foreground transition-colors">
                <Instagram size={24} />
              </a>
            </div>
            <p className="mt-4">Contact: support@quizplatform.com</p>
          </div>
        </div>
        <div className="mt-8 text-center">
          <p>&copy; {new Date().getFullYear()} Quiz Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

