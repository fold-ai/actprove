import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ActProve — EU AI Act Compliance for SMBs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#1B4F72",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700, opacity: 0.9 }}>
          <span>Act</span>
          <span style={{ color: "#1D8348" }}>Prove</span>
        </div>
        <div style={{ fontSize: 64, fontWeight: 800, marginTop: 24, lineHeight: 1.1 }}>
          EU AI Act compliance for SMBs
        </div>
        <div style={{ fontSize: 30, marginTop: 24, opacity: 0.8 }}>
          From AI inventory to audit-ready docs — in under 2 hours.
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 24,
            background: "rgba(255,255,255,0.15)",
            padding: "10px 20px",
            borderRadius: 10,
            alignSelf: "flex-start",
          }}
        >
          August 2, 2026 deadline
        </div>
      </div>
    ),
    size,
  );
}
