function Logo({ className = 'w-10 h-10' }) {
  return (
    <svg viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" className="fill-navy" />
      <path
        d="M10 14.2c0-1 .8-1.8 1.8-1.8h16.4c1 0 1.8.8 1.8 1.8v9.6c0 1-.8 1.8-1.8 1.8H19l-4.6 3.8v-3.8h-2.6c-1 0-1.8-.8-1.8-1.8v-9.6z"
        className="fill-paper"
      />
      <path
        d="M10.6 14l9.4 6.6 9.4-6.6"
        className="stroke-cobalt"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="29" cy="10.5" r="3" className="fill-mint" />
    </svg>
  );
}

export default Logo;