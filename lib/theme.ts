// Central brand color palette — edit this file to change colors app-wide.
// CSS variables in app/globals.css (--primary, --secondary, etc.) should be kept in sync.

export const theme = {
  // Core brand
  primary: "#052F5F",         // Navy blue
  primaryDark: "#2d1a5c",     // Deeper purple — headings, text emphasis
  primaryMuted: "rgba(75, 46, 131, 0.5)", // Muted purple — eyebrow labels

  gold: "#E8C060",            // Gold — accent bars, active nav, CTA buttons
  goldHover: "#f0cc6a",       // Slightly brighter gold on hover

  // Page & surface backgrounds
  bgPage: "oklch(0.98 0.003 240)", // Near-white with a cool tint
  bgCard: "#ffffff",
  bgCardHover: "#fafafa",

  // Text
  textHeading: "#052F5F",     // Used for page titles
  textPrimary: "#111827",     // Body headings / author names
  textSecondary: "#6B7280",   // Body copy / timestamps
  textDim: "#9CA3AF",         // Placeholders / very muted text

  // Structural
  border: "#E5E7EB",
  shadowCard: "0 1px 3px 0 rgba(75,46,131,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)",
  shadowCardHover: "0 8px 24px -4px rgba(75,46,131,0.14), 0 2px 6px -2px rgba(0,0,0,0.08)",

  // Family tree
  bgDots: "#dde3ec",          // Background dot grid color in the React Flow canvas

  // Status badges (member status indicators)
  statusActive: { bg: "#dcfce7", text: "#166534" },
  statusAlumni: { bg: "#dbeafe", text: "#1d4ed8" },
  statusInactive: { bg: "#ffedd5", text: "#9a3412" },
} as const;

export type Theme = typeof theme;
