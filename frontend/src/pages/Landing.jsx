import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import Pricing from '../components/Pricing.jsx';
import Contact from '../components/Contact.jsx';

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-mint shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-3a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 8-8M21 7v6h-6" />
    </svg>
  );
}

const mailFeatures = [
  'Archive, delete, and mark spam in one click',
  "Undo send, so a typo doesn't have to go out",
  'Rich formatting for the body of every message',
  "Attach files up to your organization's limit",
  'Search across every folder at once',
];

const chatFeatures = [
  'Direct messages with any teammate',
  'Create and manage groups for a project or a team',
  'Admins can mute a group or remove a message',
  'React with emoji, share files inline',
  "Delete your own messages, edit before it's seen",
];

const assurances = [
  'No credit card to start',
  'Invite your team in minutes',
  'Cancel anytime',
];

const stats = [
  { label: 'Teams onboarded', value: '500+', icon: <UsersIcon />, tint: 'cobalt' },
  { label: 'Messages sent daily', value: '2M+', icon: <MailIcon />, tint: 'mint' },
  { label: 'Uptime', value: '99.9%', icon: <TrendIcon />, tint: 'cobalt' },
  { label: 'Support', value: '24/7', icon: <ClockIcon />, tint: 'mint' },
];

function Landing() {
  return (
    <div className="min-h-screen bg-paper font-body">
      <Navbar />

      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="font-mono text-xs tracking-widest text-cobalt uppercase mb-4">
            One login, two ways to talk
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-navy leading-tight">
            Mail for the record.
            <br />
            Chat for the moment.
          </h1>
          <p className="mt-6 text-slate text-lg max-w-md">
            Seam gives your team a proper inbox and a live group chat under
            one roof, so nothing important gets lost between two different
            tools.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/register"
              className="bg-navy text-white px-6 py-3 rounded-md font-medium shadow-sm hover:bg-navy/90 hover:shadow-md transition-all"
            >
              Create your workspace
            </Link>
            <Link
              to="/login"
              className="border border-navy/20 text-navy px-6 py-3 rounded-md font-medium hover:bg-navy/5 transition-colors"
            >
              Log in
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
            {assurances.map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-slate">
                <CheckIcon />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="grid grid-cols-2 rounded-xl overflow-hidden shadow-xl border border-navy/10">
            <div className="bg-navy text-white p-6 min-h-[280px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-mint"></span>
                    <span className="font-mono text-xs text-white/70">INBOX</span>
                  </div>
                  <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 pb-3 border-b border-white/10">
                    <div className="w-7 h-7 rounded-full bg-cobalt/40 flex items-center justify-center font-mono text-[10px] shrink-0">
                      PM
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">Priya Menon</p>
                      <p className="text-xs text-white/50 truncate">Q3 numbers are in, quick look?</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pb-3 border-b border-white/10">
                    <div className="w-7 h-7 rounded-full bg-mint/30 flex items-center justify-center font-mono text-[10px] shrink-0">
                      DT
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">Dev Team</p>
                      <p className="text-xs text-white/50 truncate">Deploy scheduled for Friday 6pm</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-mono text-[10px] shrink-0">
                      AR
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">Aditi Rao</p>
                      <p className="text-xs text-white/50 truncate">Signed off on the contract</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 mt-4 border-t border-white/10">
                <svg className="w-4 h-4 text-mint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 10-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <p className="font-mono text-xs text-white/50">Q3-report.pdf attached</p>
              </div>
            </div>

            <div className="bg-white p-6 min-h-[280px] flex flex-col justify-between border-l-2 border-dashed border-navy/20">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cobalt"></span>
                    <span className="font-mono text-xs text-slate">#design-team</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate/50">6 members</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-end gap-2">
                    <div className="w-6 h-6 rounded-full bg-navy/10 shrink-0"></div>
                    <div className="bg-navy/5 rounded-lg rounded-bl-none px-3 py-2 max-w-[80%]">
                      <p className="text-xs text-navy">can we push the mockups today?</p>
                    </div>
                  </div>

                  <div className="flex items-end gap-2 justify-end">
                    <div className="bg-cobalt/10 rounded-lg rounded-br-none px-3 py-2 max-w-[80%]">
                      <p className="text-xs text-navy">on it, giving them one more pass</p>
                    </div>
                  </div>

                  <div className="flex items-end gap-2">
                    <div className="w-6 h-6 rounded-full bg-mint/30 shrink-0"></div>
                    <div className="bg-navy/5 rounded-lg rounded-bl-none px-3 py-2 max-w-[70%]">
                      <p className="text-xs text-navy">🔥 love the new palette</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 mt-4 border-t border-navy/10">
                <div className="flex -space-x-1.5">
                  <div className="w-5 h-5 rounded-full bg-cobalt/30 border-2 border-white"></div>
                  <div className="w-5 h-5 rounded-full bg-mint/40 border-2 border-white"></div>
                  <div className="w-5 h-5 rounded-full bg-navy/20 border-2 border-white"></div>
                </div>
                <p className="font-mono text-xs text-slate/60">3 people typing</p>
              </div>
            </div>
          </div>

          <p className="text-center font-mono text-xs text-slate/60 mt-4">
            the same account, the same people, two ways of reaching them
          </p>
        </div>
      </section>

      <section className="border-y border-navy/10 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  stat.tint === 'cobalt' ? 'bg-cobalt/10 text-cobalt' : 'bg-mint/10 text-mint'
                }`}
              >
                {stat.icon}
              </div>
              <div>
                <p className="font-display text-2xl font-semibold text-navy leading-none">{stat.value}</p>
                <p className="text-xs text-slate mt-1.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="feature" className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <p className="font-mono text-xs tracking-widest text-cobalt uppercase mb-3">What's inside</p>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-navy mb-2">
            Everything each tool already does well
          </h2>
          <p className="text-slate mb-12 max-w-xl">
            Seam doesn't reinvent mail or chat, it just puts both where your
            team actually works.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-paper rounded-xl border border-navy/10 p-8 hover:border-navy/20 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-lg bg-cobalt/10 text-cobalt flex items-center justify-center mb-5">
                <MailIcon />
              </div>
              <h3 className="font-display font-semibold text-lg text-navy mb-4">Mail</h3>
              <ul className="space-y-3">
                {mailFeatures.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-slate text-sm">
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-paper rounded-xl border border-navy/10 p-8 hover:border-navy/20 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-lg bg-mint/10 text-mint flex items-center justify-center mb-5">
                <ChatIcon />
              </div>
              <h3 className="font-display font-semibold text-lg text-navy mb-4">Chat</h3>
              <ul className="space-y-3">
                {chatFeatures.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-slate text-sm">
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="roles" className="max-w-6xl mx-auto px-6 py-20">
        <p className="font-mono text-xs tracking-widest text-cobalt uppercase mb-3">Who does what</p>
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-navy mb-12">
          Built around two roles
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-8 rounded-xl bg-navy text-white shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-white/10 text-mint flex items-center justify-center mb-5">
              <ShieldIcon />
            </div>
            <span className="font-mono text-xs text-mint uppercase tracking-widest">Admin</span>
            <h3 className="font-display text-xl font-semibold mt-2 mb-4">Runs the workspace</h3>
            <p className="text-white/70">
              Creates groups, manages membership, and keeps conversations on
              track, including the ability to mute a group or step in when
              needed.
            </p>
          </div>
          <div className="p-8 rounded-xl bg-white border border-navy/10 hover:shadow-sm transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-cobalt/10 text-cobalt flex items-center justify-center mb-5">
              <UsersIcon />
            </div>
            <span className="font-mono text-xs text-cobalt uppercase tracking-widest">Employee</span>
            <h3 className="font-display text-xl font-semibold text-navy mt-2 mb-4">Gets things done</h3>
            <p className="text-slate">
              Sends and receives mail, joins the groups they're added to, and
              talks with teammates directly, with all the same everyday
              tools.
            </p>
          </div>
        </div>
      </section>

      <section id="stack" className="bg-white border-y border-navy/10">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <p className="font-mono text-xs tracking-widest text-cobalt uppercase mb-3">Under the hood</p>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-navy mb-8">
            How it's built
          </h2>
          <div className="flex flex-wrap gap-3 font-mono text-sm">
            {['React', 'Tailwind CSS', 'Node.js', 'REST API', 'PostgreSQL', 'Render'].map((item) => (
              <span
                key={item}
                className="px-4 py-2 bg-paper border border-navy/10 rounded-md text-slate"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="rounded-2xl bg-navy px-8 py-14 text-center sm:px-16 shadow-lg">
          <div className="inline-flex items-center gap-2 text-mint font-mono text-xs uppercase tracking-widest mb-4">
            <BoltIcon />
            Ready when you are
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-white">
            Bring mail and chat into one workspace
          </h2>
          <p className="text-white/70 mt-3 max-w-md mx-auto">
            Set up your workspace in minutes and invite the rest of your team
            right after.
          </p>
          <Link
            to="/register"
            className="inline-block mt-7 bg-mint text-navy px-6 py-3 rounded-md font-medium shadow-sm hover:bg-mint/90 hover:shadow-md transition-all"
          >
            Create your workspace
          </Link>
        </div>
      </section>

      <Pricing />
      <Contact />

      <Footer />
    </div>
  );
}

export default Landing;