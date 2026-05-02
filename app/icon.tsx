import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 64,
          height: 64,
          background: "#052F5F",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "#E8C060",
            fontSize: 28,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: "-1px",
          }}
        >
          ΑΚΨ
        </span>
      </div>
    ),
    { ...size }
  );
}
