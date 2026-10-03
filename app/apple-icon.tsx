import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const runtime = "nodejs";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(ellipse 70% 60% at 50% 42%, #3a2a1a 0%, #2d2b2b 55%, #1f1b16 100%)",
          position: "relative",
        }}
      >
        {/* Outer dashed ring — rendered via an SVG for crisp lines */}
        <svg
          width="180"
          height="180"
          viewBox="0 0 200 200"
          style={{ position: "absolute", inset: 0 }}
        >
          <circle
            cx="100"
            cy="100"
            r="86"
            fill="none"
            stroke="#e1ad66"
            strokeWidth="1.8"
            strokeDasharray="2 5"
            opacity="0.9"
          />
          <circle
            cx="100"
            cy="100"
            r="60"
            fill="none"
            stroke="#e1ad66"
            strokeWidth="1.5"
          />
          <line
            x1="86"
            y1="135"
            x2="114"
            y2="135"
            stroke="#e1ad66"
            strokeWidth="1.3"
          />
          <circle cx="100" cy="40" r="1.9" fill="#e1ad66" />
          <circle cx="100" cy="160" r="1.9" fill="#e1ad66" />
          <circle cx="40" cy="100" r="1.9" fill="#e1ad66" />
          <circle cx="160" cy="100" r="1.9" fill="#e1ad66" />
        </svg>
        <div
          style={{
            fontSize: 90,
            fontStyle: "italic",
            color: "#f8f4f4",
            fontFamily: "Garamond, Georgia, serif",
            lineHeight: 1,
            marginTop: -12,
          }}
        >
          T
        </div>
      </div>
    ),
    size,
  );
}
