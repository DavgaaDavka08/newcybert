/** Minimal stroke icons for admin UI (no emoji) */

export type AdminIconName =
  | "chart"
  | "layers"
  | "video"
  | "help"
  | "folder"
  | "clipboard"
  | "users"
  | "trophy"
  | "map"
  | "node"
  | "file"
  | "book"
  | "chevron-left"
  | "flame";

const defaults = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function AdminIcon({
  name,
  size = 18,
  className,
}: {
  name: AdminIconName;
  size?: number;
  className?: string;
}) {
  const p = { ...defaults, width: size, height: size, className };

  switch (name) {
    case "chart":
      return (
        <svg {...p} aria-hidden>
          <path d="M3 3v18h18" />
          <path d="M7 16l4-6 4 3 5-7" />
        </svg>
      );
    case "layers":
      return (
        <svg {...p} aria-hidden>
          <path d="M12 2 2 7l10 5 10-5-10-5z" />
          <path d="m2 12 10 5 10-5" />
          <path d="m2 17 10 5 10-5" />
        </svg>
      );
    case "video":
      return (
        <svg {...p} aria-hidden>
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <path d="m10 10 6 4-6 4z" />
        </svg>
      );
    case "help":
      return (
        <svg {...p} aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.5 9a3 3 0 0 1 5 1c0 2-3 2-3 4" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "folder":
      return (
        <svg {...p} aria-hidden>
          <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.5L9 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
        </svg>
      );
    case "clipboard":
      return (
        <svg {...p} aria-hidden>
          <rect x="8" y="2" width="8" height="4" rx="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01" />
        </svg>
      );
    case "users":
      return (
        <svg {...p} aria-hidden>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "trophy":
      return (
        <svg {...p} aria-hidden>
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16M10 14.66V17c0 1.1.9 2 2 2h0a2 2 0 0 0 2-2v-2.34" />
          <path d="M8 4h8v7a4 4 0 0 1-8 0V4z" />
        </svg>
      );
    case "map":
      return (
        <svg {...p} aria-hidden>
          <path d="m3 6 6-3 6 3 6-3 6 3v15l-6-3-6 3-6-3-6 3z" />
          <path d="M9 3v15M15 6v15" />
        </svg>
      );
    case "node":
      return (
        <svg {...p} aria-hidden>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
      );
    case "file":
      return (
        <svg {...p} aria-hidden>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
      );
    case "book":
      return (
        <svg {...p} aria-hidden>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case "chevron-left":
      return (
        <svg {...p} aria-hidden>
          <path d="m15 18-6-6 6-6" />
        </svg>
      );
    case "flame":
      return (
        <svg {...p} aria-hidden>
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.5-1.5-3-1.5-5.5 0-2 1.5-3.5 2.5-4.5 1 1.5 2.5 3 2.5 5.5 0 2.5-2 4.5-2 4.5s3.5-1 3.5 3.5a3.5 3.5 0 0 1-7 0z" />
        </svg>
      );
    default:
      return null;
  }
}

/** Topic badges on game map — letters/symbols, not emoji */
export const TOPIC_ICON_GLYPHS = ["Φ", "λ", "π", "Ω", "F", "v", "E", "P", "H", "K"] as const;
