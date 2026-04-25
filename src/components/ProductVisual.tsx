import React from 'react';

const GRADIENTS = [
  'from-indigo-500 via-violet-500 to-purple-600',
  'from-cyan-500 via-sky-500 to-blue-600',
  'from-emerald-500 via-teal-500 to-cyan-600',
  'from-fuchsia-500 via-pink-500 to-rose-600',
  'from-amber-500 via-orange-500 to-red-600',
  'from-blue-500 via-indigo-500 to-violet-600',
  'from-violet-500 via-purple-500 to-fuchsia-600',
  'from-teal-500 via-emerald-500 to-green-600',
];

function pickGradient(seed: number): string {
  return GRADIENTS[Math.abs(seed) % GRADIENTS.length];
}

export function getProductInitials(name: string): string {
  const cleaned = name.trim().replace(/[^A-Za-z0-9 ]/g, ' ').replace(/\s+/g, ' ');
  if (!cleaned) return 'KS';
  const parts = cleaned.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

interface Props {
  name: string;
  seed?: number;
  className?: string;
  initialsClassName?: string;
  showOrb?: boolean;
}

export const ProductVisual: React.FC<Props> = ({
  name,
  seed = 0,
  className = 'h-24 sm:h-36',
  initialsClassName = 'text-2xl sm:text-4xl',
  showOrb = true,
}) => {
  const gradient = pickGradient(seed);
  const initials = getProductInitials(name);
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} ${className}`}>
      {showOrb && (
        <>
          <div className="pointer-events-none absolute -top-6 -left-6 w-24 h-24 rounded-full bg-white/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-black/30 blur-2xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.18),transparent_60%)]" />
        </>
      )}
      <div className="relative w-full h-full flex items-center justify-center">
        <span className={`font-extrabold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] ${initialsClassName}`}>
          {initials}
        </span>
      </div>
    </div>
  );
};

export const BrandMark: React.FC<{ className?: string; rounded?: boolean }> = ({
  className = 'w-8 h-8',
  rounded = true,
}) => (
  <span
    className={`inline-block overflow-hidden bg-black ring-1 ring-white/10 shadow-[0_4px_18px_-4px_rgba(0,217,255,0.35)] ${
      rounded ? 'rounded-xl' : ''
    } ${className}`}
  >
    <img
      src="/kity-logo.jpg"
      alt="KITY GAMER"
      className="w-full h-full object-cover select-none"
      draggable={false}
    />
  </span>
);

interface KityGamerBadgeProps {
  size?: 'sm' | 'md';
  className?: string;
}

export const KityGamerBadge: React.FC<KityGamerBadgeProps> = ({
  size = 'sm',
  className = '',
}) => {
  const sizeCls =
    size === 'md'
      ? 'px-3 py-1.5 text-xs gap-2'
      : 'px-2.5 py-1 text-[11px] gap-1.5';
  const iconCls = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';
  return (
    <a
      href="https://t.me/kitygamer"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open @kitygamer on Telegram"
      className={`inline-flex items-center align-middle rounded-full font-semibold leading-none tracking-tight text-white bg-gradient-to-r from-[#2AABEE] to-[#229ED9] hover:from-[#34B7F1] hover:to-[#1D94CF] ring-1 ring-white/20 shadow-[0_4px_14px_-4px_rgba(34,158,217,0.65)] hover:shadow-[0_6px_18px_-4px_rgba(34,158,217,0.8)] transition-all duration-150 hover:-translate-y-px no-underline whitespace-nowrap ${sizeCls} ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className={iconCls}
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M21.94 4.36 18.76 19.4c-.24 1.07-.88 1.33-1.78.83l-4.92-3.62-2.37 2.28c-.26.26-.48.48-.99.48l.35-5.01 9.13-8.25c.4-.35-.09-.55-.61-.2L7.27 12.99 2.4 11.47c-1.06-.33-1.08-1.06.22-1.57L20.58 3c.88-.32 1.65.21 1.36 1.36z" />
      </svg>
      <span>@kitygamer</span>
    </a>
  );
};

export default ProductVisual;
