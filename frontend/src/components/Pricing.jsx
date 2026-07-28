function Pricing() {
  const plans = [
    {
      name: 'Starter',
      price: '$0',
      period: '/mo',
      tagline: 'For small teams getting going',
      features: ['Up to 10 members', 'Shared inbox', 'Unlimited groups', 'Basic search'],
      highlight: false,
    },
    {
      name: 'Team',
      price: '$12',
      period: '/user/mo',
      tagline: 'For teams who live in this every day',
      features: [
        'Unlimited members',
        'Admin controls & muting',
        'File attachments up to 5GB',
        'Priority support',
      ],
      highlight: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      tagline: 'For organizations with real scale',
      features: [
        'SSO & advanced security',
        'Dedicated onboarding',
        'Custom retention policies',
        'SLA-backed support',
      ],
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="max-w-6xl mx-auto px-6 py-20 border-t border-navy/10">
      <h2 className="font-display text-2xl md:text-3xl font-semibold text-navy mb-2">
        Simple pricing, no surprises
      </h2>
      <p className="text-slate mb-12 max-w-xl">
        Start free, upgrade when your team actually needs more room.
      </p>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-xl p-8 border transition-all ${
              plan.highlight
                ? 'bg-navy text-white border-navy shadow-lg md:-translate-y-2'
                : 'bg-white border-navy/10 hover:border-navy/20 hover:shadow-sm'
            }`}
          >
            {plan.highlight && (
              <span className="font-mono text-xs text-mint uppercase tracking-widest">
                Most popular
              </span>
            )}
            <h3
              className={`font-display font-semibold text-lg mt-2 ${
                plan.highlight ? 'text-white' : 'text-navy'
              }`}
            >
              {plan.name}
            </h3>
            <p className={`text-sm mt-1 mb-6 ${plan.highlight ? 'text-white/70' : 'text-slate'}`}>
              {plan.tagline}
            </p>
            <div className="mb-6">
              <span className="font-display text-3xl font-semibold">{plan.price}</span>
              <span className={`text-sm ${plan.highlight ? 'text-white/60' : 'text-slate'}`}>
                {plan.period}
              </span>
            </div>
            <ul className={`space-y-3 text-sm mb-8 ${plan.highlight ? 'text-white/80' : 'text-slate'}`}>
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <svg
                    className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlight ? 'text-mint' : 'text-cobalt'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <button
              className={`w-full py-2.5 rounded-md font-medium transition-colors ${
                plan.highlight
                  ? 'bg-white text-navy hover:bg-white/90'
                  : 'bg-navy text-white hover:bg-navy/90'
              }`}
            >
              Get started
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Pricing;