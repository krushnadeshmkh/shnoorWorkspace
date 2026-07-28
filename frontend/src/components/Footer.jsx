import Logo from './Logo.jsx';

function Footer() {
  return (
    <footer className="border-t border-navy/10 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2.5 mb-4">
            <Logo className="w-9 h-9" />
            <p className="font-display font-semibold text-navy text-lg">
              Shnoor Workspace<span className="text-cobalt">.</span>
            </p>
          </div>
          <p className="text-sm text-slate leading-relaxed">
            Next-gen workspace tools for modern, chat-and-inbox-driven teams.
          </p>
        </div>

        <div>
          <p className="font-display font-semibold text-navy mb-4">Quick Links</p>
          <ul className="space-y-2 text-sm text-slate">
            <li><a href="/" className="hover:text-cobalt transition-colors">Home</a></li>
            <li><a href="#feature" className="hover:text-cobalt transition-colors">Features</a></li>
            <li><a href="#pricing" className="hover:text-cobalt transition-colors">Pricing</a></li>
            <li><a href="#contact" className="hover:text-cobalt transition-colors">Contact</a></li>
          </ul>
        </div>

        <div>
          <p className="font-display font-semibold text-navy mb-4">Account</p>
          <ul className="space-y-2 text-sm text-slate">
            <li><a href="/login" className="hover:text-cobalt transition-colors">Login</a></li>
            <li><a href="/register" className="hover:text-cobalt transition-colors">Register</a></li>
          </ul>
        </div>

        <div>
          <p className="font-display font-semibold text-navy mb-4">Contact Us</p>
          <ul className="space-y-2 text-sm text-slate font-mono">
            <li>support@shnoor.com</li>
            <li>+91 98765 43210</li>
            <li>Business Bay, Dubai / Kuppam, India</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-navy/10">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-sm text-slate">
            &copy; {new Date().getFullYear()} Shnoor Workspace. All rights reserved.
          </p>
          <p className="text-xs font-mono text-slate">
            built for teams who live in their inbox and their chat, at once
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;