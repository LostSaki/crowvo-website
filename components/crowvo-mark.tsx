/**
 * The Crowvo mark — orbit + planet.
 *
 * The ring passes BEHIND the planet at the top and IN FRONT at the bottom. The gap
 * that sells the depth is painted in the background colour, so `bg` must match
 * whatever surface the mark sits on or you get a halo.
 *
 * Geometry is fixed (viewBox 0 0 120 120) and comes from LogoFinal on the canvas:
 * ring ellipse rx52 ry22 rotate(-22) stroke 10 · planet r19 · front arc drawn twice
 * (halo at stroke 20, then the fg arc slightly longer at stroke 10 so there are no seams).
 */
export function CrowvoMark({
  size = 28,
  fg = "var(--foreground)",
  bg = "var(--background)",
  planet,
  className,
}: {
  size?: number;
  fg?: string;
  bg?: string;
  /** optional accent fill for the planet — defaults to the ring colour */
  planet?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="60" cy="60" rx="52" ry="22" transform="rotate(-22 60 60)" stroke={fg} strokeWidth="10" />
      <circle cx="60" cy="60" r="19" fill={planet ?? fg} stroke={bg} strokeWidth="7" />
      <path d="M99.42 61.14 A52 22 -22 0 1 32.44 88.20" stroke={bg} strokeWidth="20" />
      <path d="M103.07 57.21 A52 22 -22 0 1 27.08 87.91" stroke={fg} strokeWidth="10" />
    </svg>
  );
}

export function CrowvoLockup({
  size = 28,
  bg = "var(--background)",
  className,
}: {
  size?: number;
  bg?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <CrowvoMark size={size} bg={bg} />
      <span
        className="font-display font-extrabold"
        style={{ fontSize: size * 0.72, letterSpacing: "-0.04em" }}
      >
        Crowvo
      </span>
    </span>
  );
}
