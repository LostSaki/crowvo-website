import { ImageResponse } from "next/og";

export const alt = "Crowvo — find your people, go to things together";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social share card. Every TikTok / Instagram link-in-bio share renders this, so it
 * has to work at thumbnail size: the mark, one line, and the beta status.
 *
 * The mark is passed as a data-URI <img> rather than inline JSX SVG on purpose.
 * ImageResponse lays out with Satori, which implements only part of SVG — inline
 * <path> elements silently do not paint (verified: neither arc nor bezier commands
 * rendered), which dropped the front arc that makes the ring pass over the planet
 * and left the mark looking like an eye. An <img> is handed to the rasterizer,
 * which renders the full spec.
 *
 * No webfont is fetched here: a font request is the usual cause of OG generation
 * timing out at the edge, and the system stack is close enough at this size.
 */
const BG = "#0E0E12";
const FG = "#F2F2F3";

const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
  <ellipse cx="60" cy="60" rx="52" ry="22" transform="rotate(-22 60 60)" fill="none" stroke="${FG}" stroke-width="10"/>
  <circle cx="60" cy="60" r="19" fill="${FG}" stroke="${BG}" stroke-width="7"/>
  <path d="M99.42 61.14 A52 22 -22 0 1 32.44 88.20" fill="none" stroke="${BG}" stroke-width="20"/>
  <path d="M103.07 57.21 A52 22 -22 0 1 27.08 87.91" fill="none" stroke="${FG}" stroke-width="10"/>
</svg>`;

const markSrc = `data:image/svg+xml;base64,${Buffer.from(markSvg).toString("base64")}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: BG,
          backgroundImage:
            "radial-gradient(52% 70% at 80% 6%, rgba(109,124,255,0.22), transparent 70%), radial-gradient(44% 60% at 10% 30%, rgba(208,131,92,0.14), transparent 72%)",
          padding: "72px 80px",
          color: FG,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={markSrc} width={64} height={64} alt="" />
          <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-0.04em" }}>Crowvo</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
              maxWidth: 900,
            }}
          >
            Find your people. Go to things together.
          </div>
          <div style={{ fontSize: 30, color: "#A8A8B3", marginTop: 26 }}>
            Communities, events, and the people you pass there.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              border: "2px solid #2A2A32",
              borderRadius: 999,
              padding: "10px 22px",
              fontSize: 24,
              color: "#A8A8B3",
            }}
          >
            Private beta
          </div>
          <div style={{ fontSize: 24, color: "#8A8A94" }}>crow-vo.com</div>
        </div>
      </div>
    ),
    size,
  );
}
