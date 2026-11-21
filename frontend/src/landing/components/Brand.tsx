/** Identité visuelle : logo (bouclier + cadenas) et nom de marque. */

export function Logo({ size = 46 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 60 66" aria-hidden="true">
      <defs>
        <linearGradient id="fl-lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F8C446" /><stop offset="1" stopColor="#C98A0B" />
        </linearGradient>
      </defs>
      <path d="M30 2 L56 11 V32 C56 48 44 60 30 64 C16 60 4 48 4 32 V11 Z" fill="url(#fl-lg)" />
      <path d="M30 7 L51 14 V32 C51 45 41 55 30 59 C19 55 9 45 9 32 V14 Z" fill="#0B5D2A" />
      <path d="M22 29 V24 a8 8 0 0 1 16 0 V29" fill="none" stroke="#F8C446" strokeWidth="3" strokeLinecap="round" />
      <rect x="19" y="29" width="22" height="16" rx="3" fill="#F8C446" />
      <circle cx="30" cy="36" r="2.6" fill="#0B5D2A" /><rect x="29" y="37" width="2" height="5" rx="1" fill="#0B5D2A" />
    </svg>
  );
}

export function BrandName() {
  return <span className="fl-brand-name">FASO<b>LOCK</b></span>;
}