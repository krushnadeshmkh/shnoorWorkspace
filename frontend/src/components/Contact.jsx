function Contact() {
  return (
    <section id="contact" className="max-w-6xl mx-auto px-6 py-20 border-t border-navy/10">
      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-navy mb-2">
            Get in touch
          </h2>
          <p className="text-slate mb-8 max-w-md">
            Questions about pricing, setup, or migrating your team over?
            We're happy to help.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-cobalt/10 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-cobalt" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-mono text-slate">support@shnoor.com</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-cobalt/10 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-cobalt" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <p className="text-sm font-mono text-slate">+91 98765 43210</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-cobalt/10 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-cobalt" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-sm font-mono text-slate">Business Bay, Dubai / Kuppam, India</p>
            </div>
          </div>
        </div>

        <form className="bg-white rounded-xl border border-navy/10 p-8 space-y-4 shadow-sm">
          <div>
            <label className="text-sm font-medium text-navy block mb-1.5">Name</label>
            <input
              type="text"
              placeholder="Your name"
              className="w-full px-3 py-2 rounded-md border border-navy/10 text-sm text-navy placeholder:text-slate/50 focus:outline-none focus:ring-2 focus:ring-cobalt/30 focus:border-cobalt/40 transition-colors"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-navy block mb-1.5">Email</label>
            <input
              type="email"
              placeholder="you@company.com"
              className="w-full px-3 py-2 rounded-md border border-navy/10 text-sm text-navy placeholder:text-slate/50 focus:outline-none focus:ring-2 focus:ring-cobalt/30 focus:border-cobalt/40 transition-colors"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-navy block mb-1.5">Message</label>
            <textarea
              rows="4"
              placeholder="How can we help?"
              className="w-full px-3 py-2 rounded-md border border-navy/10 text-sm text-navy placeholder:text-slate/50 focus:outline-none focus:ring-2 focus:ring-cobalt/30 focus:border-cobalt/40 transition-colors resize-none"
            />
          </div>
          <button
            type="button"
            className="w-full bg-navy text-white py-2.5 rounded-md font-medium shadow-sm hover:bg-navy/90 hover:shadow-md transition-all"
          >
            Send message
          </button>
        </form>
      </div>
    </section>
  );
}

export default Contact;