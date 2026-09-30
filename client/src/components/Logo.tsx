export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
    >
      <rect width="100" height="100" rx="22" fill="var(--primary)" />
      <path
        d="M28 68 L46 32 L54 32 L72 68 M38 56 L62 56"
        stroke="white"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <Logo size={26} />
      <span className="text-[1.05rem] font-extrabold tracking-tight text-text">
        Civic<span className="text-primary">Path</span>
      </span>
    </span>
  );
}
