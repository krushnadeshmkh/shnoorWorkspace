import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from './Logo.jsx';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: '#feature', label: 'Features' },
    { href: '#roles', label: 'Roles' },
    { href: '#stack', label: "How it's built" },
    { href: '#pricing', label: 'Pricing' },
    { href: '#contact', label: 'Contact' },
  ];

  return (
    <header className="w-full border-b border-navy/10 bg-paper/80 backdrop-blur sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3.5">
        <Link
          to="/"
          className="flex items-center gap-2.5"
          onClick={() => setIsOpen(false)}
        >
          <Logo className="w-9 h-9 shrink-0" />
          <span className="font-display font-semibold text-lg text-navy tracking-tight">
            Shnoor Workspace<span className="text-cobalt">.</span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-8 text-sm font-body text-slate">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative py-1 hover:text-navy transition-colors after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-0 after:bg-cobalt after:transition-all hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-body font-medium text-navy px-4 py-2 rounded-md hover:bg-navy/5 transition-colors"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="text-sm font-body font-medium text-white bg-cobalt px-4 py-2 rounded-md shadow-sm hover:bg-cobalt/90 hover:shadow-md transition-all"
          >
            Register
          </Link>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden text-navy p-2 -mr-2 rounded-md hover:bg-navy/5 transition-colors"
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 border-t border-navy/10' : 'max-h-0'
        }`}
      >
        <div className="flex flex-col px-6 py-4 gap-1 bg-paper">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="text-sm font-body text-slate hover:text-navy py-3 border-b border-navy/5 transition-colors"
            >
              {link.label}
            </a>
          ))}

          <div className="flex flex-col gap-2 mt-4">
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="text-sm font-body font-medium text-navy text-center px-4 py-2.5 rounded-md border border-navy/10 hover:bg-navy/5 transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/register"
              onClick={() => setIsOpen(false)}
              className="text-sm font-body font-medium text-white bg-cobalt text-center px-4 py-2.5 rounded-md hover:bg-cobalt/90 transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;