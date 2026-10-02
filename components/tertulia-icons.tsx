"use client";

import { useId, type CSSProperties } from "react";

interface Props {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/* ── Category silhouettes — bolder stroke for retail imagery ─── */

export function WineBottle({ size = 80, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M42 8 h16 v18 c0 3 1.5 5 4 8 c4.5 5 7 10 7 18 v32 c0 4 -2 6 -6 6 h-26 c-4 0 -6 -2 -6 -6 v-32 c0 -8 2.5 -13 7 -18 c2.5 -3 4 -5 4 -8 z" />
      <line x1="42" y1="8" x2="58" y2="8" />
      <rect x="34" y="52" width="32" height="22" fill="currentColor" fillOpacity="0.08" />
      <line x1="42" y1="60" x2="58" y2="60" />
      <line x1="42" y1="66" x2="58" y2="66" />
    </svg>
  );
}

export function CheeseWedge({ size = 80, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M18 68 L82 68 L50 24 z" fill="currentColor" fillOpacity="0.06" />
      <path d="M18 68 L18 76 L82 76 L82 68" />
      <line x1="50" y1="24" x2="50" y2="34" />
      <circle cx="38" cy="60" r="1.6" fill="currentColor" />
      <circle cx="54" cy="55" r="1.6" fill="currentColor" />
      <circle cx="60" cy="64" r="1.6" fill="currentColor" />
      <circle cx="45" cy="50" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function Cigar({ size = 80, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="14" y="44" width="72" height="12" rx="4" fill="currentColor" fillOpacity="0.08" />
      <rect x="14" y="44" width="72" height="12" rx="4" />
      <line x1="28" y1="44" x2="28" y2="56" />
      <line x1="34" y1="44" x2="34" y2="56" />
      <path d="M86 50 L94 46 M86 50 L94 54" />
      <path d="M18 44 c-2 -2 -3 -4 -3 -6" />
    </svg>
  );
}

export function Candle({ size = 80, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="32" y="38" width="36" height="46" rx="1.5" fill="currentColor" fillOpacity="0.08" />
      <line x1="32" y1="46" x2="68" y2="46" />
      <line x1="50" y1="38" x2="50" y2="28" />
      <path d="M50 28 c-3 -2 3 -6 0 -12 c-3 6 3 10 0 12 z" fill="currentColor" fillOpacity="0.3" />
    </svg>
  );
}

export function Hamper({ size = 80, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="20" y="40" width="60" height="42" fill="currentColor" fillOpacity="0.06" />
      <line x1="20" y1="52" x2="80" y2="52" />
      <line x1="30" y1="52" x2="30" y2="82" />
      <line x1="42" y1="52" x2="42" y2="82" />
      <line x1="58" y1="52" x2="58" y2="82" />
      <line x1="70" y1="52" x2="70" y2="82" />
      <path d="M32 40 c0 -8 6 -12 18 -12 c12 0 18 4 18 12" />
      <path d="M50 28 c-6 -6 -6 -14 0 -14 c6 0 6 8 0 14 z" fill="currentColor" fillOpacity="0.18" />
    </svg>
  );
}

export function BookOpen({ size = 80, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M14 30 c10 -4 22 -4 36 4 v46 c-14 -8 -26 -8 -36 -4 z" fill="currentColor" fillOpacity="0.06" />
      <path d="M86 30 c-10 -4 -22 -4 -36 4 v46 c14 -8 26 -8 36 -4 z" fill="currentColor" fillOpacity="0.06" />
      <line x1="22" y1="42" x2="42" y2="48" />
      <line x1="22" y1="50" x2="42" y2="56" />
      <line x1="58" y1="48" x2="78" y2="42" />
      <line x1="58" y1="56" x2="78" y2="50" />
    </svg>
  );
}

/* ── Monogram T ───────────────────────────────────────────────── */

export function MonogramT({
  size = 72,
  className,
  style,
  opacity = 0.4,
}: Props & { opacity?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={style}
      aria-hidden
    >
      <text
        x="50"
        y="74"
        textAnchor="middle"
        fontFamily="var(--font-heading)"
        fontStyle="italic"
        fontWeight="400"
        fontSize="86"
        fill="currentColor"
        fillOpacity={opacity}
      >
        T
      </text>
    </svg>
  );
}

/* ── Sommelier seal ───────────────────────────────────────────── */

export function SommelierSeal({ size = 88, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden
    >
      <circle
        cx="50" cy="50" r="46"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.7"
        strokeDasharray="1 3"
      />
      <circle
        cx="50" cy="50" r="34"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.7"
      />
      <text
        x="50" y="62"
        textAnchor="middle"
        fontFamily="var(--font-heading)"
        fontStyle="italic"
        fontWeight="400"
        fontSize="38"
        fill="currentColor"
      >
        T
      </text>
      <line x1="41" y1="68" x2="59" y2="68" stroke="currentColor" strokeWidth="0.7" />
    </svg>
  );
}

/* ── Search icon ─────────────────────────────────────────────── */

export function SearchIcon({ size = 20 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

/* ── Chevron right (indicates tappable) ──────────────────────── */

export function ChevronRight({ size = 16 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

/* ── Plus icon (add to cart) ─────────────────────────────────── */

export function PlusIcon({ size = 18 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M5 12h14 M12 5v14" />
    </svg>
  );
}

/* ── Clock icon ──────────────────────────────────────────────── */

export function ClockIcon({ size = 20 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

/* ── Placeholder — aged sepia photograph with paper mat ─────── */
/*    Per-category palette gives merchandise identity even w/o photos. */

const iconFor = (cat?: string) => {
  switch (cat) {
    case "vinhos":
      return WineBottle;
    case "queijos":
      return CheeseWedge;
    case "charutos":
      return Cigar;
    case "casa":
      return Candle;
    case "kit":
      return Hamper;
    case "article":
      return BookOpen;
    default:
      return null;
  }
};

export function Placeholder({
  cat,
  size = 80,
}: {
  cat?: string;
  size?: number;
}) {
  const rawId = useId();
  const patId = `tt-h-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const Icon = iconFor(cat);
  return (
    <div className="tt-ph" data-cat={cat ?? "default"}>
      <div className="tt-ph-mat">
        <svg
          className="tt-ph-grain"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <pattern
              id={patId}
              patternUnits="userSpaceOnUse"
              width="6"
              height="6"
              patternTransform="rotate(45)"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="6"
                stroke="currentColor"
                strokeOpacity="0.09"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100" height="100" fill={`url(#${patId})`} />
        </svg>
        <div className="tt-ph-mark">
          {Icon ? <Icon size={size} /> : <MonogramT size={Math.round(size * 0.9)} opacity={0.35} />}
        </div>
      </div>
    </div>
  );
}

/* ── Ornamental divider ──────────────────────────────────────── */

export function OrnDivider({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={`tt-orn ${className ?? ""}`.trim()}>
      <span className="tt-orn-line" />
      {label ? (
        <>
          <span className="tt-orn-diamond" aria-hidden />
          <span className="tt-orn-label">{label}</span>
          <span className="tt-orn-diamond" aria-hidden />
        </>
      ) : (
        <span className="tt-orn-diamond" aria-hidden />
      )}
      <span className="tt-orn-line" />
    </div>
  );
}
