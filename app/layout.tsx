import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import "./bridge-surface.css";

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-dm-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

/**
 * Accept only a well-formed absolute URL. A malformed NEXT_PUBLIC_APP_URL (e.g. a pasted
 * placeholder like "https://<your-service>.onrender.com") used to crash the build inside
 * `new URL(...)` during page-data collection; we fall back to localhost and log a warning.
 */
function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) return "http://localhost:3000";
  try {
    return new URL(raw).toString().replace(/\/$/, "");
  } catch {
    console.warn(
      `[bridge] NEXT_PUBLIC_APP_URL is not a valid URL ("${raw}"). Falling back to http://localhost:3000 for metadata.`
    );
    return "http://localhost:3000";
  }
}

const siteUrl = resolveSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Bridge — Talk safe. Couples, family & work.",
    template: "%s · Bridge",
  },
  description:
    "Private first, then together: a calmer room for hard talks between partners, family, or colleagues — with optional resolutions when you need clear next steps.",
  openGraph: {
    title: "Bridge — Talk safe. Couples, family & work.",
    description:
      "A safer way through the hard conversation — at home or at work. Private intake for each of you, then a shared thread; paid resolutions when you want language you can use.",
    url: "/",
    siteName: "Bridge",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bridge — Talk safe. Couples, family & work.",
    description:
      "Private first, then together — for partners, relatives, and teams. Optional paid resolutions when you need a clear path forward.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fraunces.variable}`}>
      {/* Fallback if Tailwind/CSS chunks fail to load (e.g. broken .next cache) */}
      <body
        className="font-sans antialiased"
        style={{
          margin: 0,
          background: "#fffbf7",
          color: "#2f2823",
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
