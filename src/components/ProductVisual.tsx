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

export default ProductVisual;
