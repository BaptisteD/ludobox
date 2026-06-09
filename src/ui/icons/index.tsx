/**
 * Bespoke inline-SVG icon set for the "Tabletop pop" kit. Presentational only:
 * every icon inherits its color from `currentColor` and is sized via `size`
 * (default 24, in px). Decorative by default (aria-hidden); pass a `title` to
 * expose an accessible name. No external icon dependency.
 */
import type { ReactNode, SVGProps } from 'react';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  /** Square edge length in px. */
  size?: number;
  /** When set, the icon is announced with this label instead of being hidden. */
  title?: string;
}

function Svg({
  size = 24,
  title,
  children,
  ...svgProps
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...svgProps}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function Plus(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" {...stroke} />
    </Svg>
  );
}

export function Check(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 13l4 4L19 7" {...stroke} />
    </Svg>
  );
}

export function Cross(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6L6 18" {...stroke} />
    </Svg>
  );
}

export function Chevron(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 6l6 6-6 6" {...stroke} />
    </Svg>
  );
}

export function Trophy(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M7 4h10v4a5 5 0 0 1-10 0V4Z"
        {...stroke}
        fill="currentColor"
        fillOpacity="0.001"
      />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" {...stroke} />
      <path d="M12 13v4M9 20h6M10 20v-2h4v2" {...stroke} />
    </Svg>
  );
}

/** Filled (winner on) crown. */
export function CrownFilled(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M4 8l3.5 3L12 5l4.5 6L20 8l-1.5 9h-13L4 8Z"
        {...stroke}
        fill="currentColor"
      />
      <path d="M5.5 17h13" {...stroke} stroke="var(--on-dark-cream)" />
    </Svg>
  );
}

/** Outlined (winner off / validity hint) crown. */
export function CrownOutline(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 8l3.5 3L12 5l4.5 6L20 8l-1.5 9h-13L4 8Z" {...stroke} />
    </Svg>
  );
}

export function Calendar(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4" y="5" width="16" height="15" rx="2" {...stroke} />
      <path d="M4 9h16M8 3v4M16 3v4" {...stroke} />
    </Svg>
  );
}

export function Trash(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M5 7h14M10 7V5h4v2M6 7l1 13h10l1-13M10 11v6M14 11v6"
        {...stroke}
      />
    </Svg>
  );
}

export function Undo(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 7L4 12l5 5" {...stroke} />
      <path d="M4 12h11a5 5 0 0 1 0 10h-3" {...stroke} />
    </Svg>
  );
}

export function Pencil(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 5l5 5M4 20l1-4L16 5l3 3L8 19l-4 1Z" {...stroke} />
    </Svg>
  );
}

/* ---- Die glyph: rounded square + N pips (DESIGN.md hero play count) ---- */

const PIP = { coords: [25, 50, 75] } as const;
// Pip layouts per face value, as [col, row] indices into PIP.coords (0..2).
const FACES: Record<number, Array<[number, number]>> = {
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [2, 0],
    [0, 2],
    [2, 2],
  ],
  5: [
    [0, 0],
    [2, 0],
    [1, 1],
    [0, 2],
    [2, 2],
  ],
  6: [
    [0, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [2, 2],
  ],
};

export interface DieGlyphProps extends IconProps {
  /** Face value 1–6. Defaults to 3 (the masthead glyph). */
  pips?: number;
  /** Outline thickness in viewBox units. */
  strokeWidth?: number;
}

export function DieGlyph({
  pips = 3,
  strokeWidth = 2,
  ...props
}: DieGlyphProps) {
  const face = FACES[Math.min(6, Math.max(1, pips))] ?? FACES[3];
  return (
    <Svg viewBox="0 0 100 100" {...props}>
      <rect
        x={strokeWidth / 2}
        y={strokeWidth / 2}
        width={100 - strokeWidth}
        height={100 - strokeWidth}
        rx="22"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {face.map(([c, r], i) => (
        <circle
          key={i}
          cx={PIP.coords[c]}
          cy={PIP.coords[r]}
          r="7"
          fill="currentColor"
        />
      ))}
    </Svg>
  );
}
