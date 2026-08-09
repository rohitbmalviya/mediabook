import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Resolved at build time: an explicit custom domain if set, else the stable
// Vercel production domain, else the per-deployment URL (preview builds),
// else local dev. This has to be an absolute URL — link-preview scrapers
// (WhatsApp, Slack, LinkedIn) will not resolve a relative og:image.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MediBook — Book Doctor Appointments Online",
    template: "%s | MediBook",
  },
  description:
    "Find and book appointments with top-rated doctors near you. MediBook connects patients with trusted healthcare professionals.",
  applicationName: "MediBook",
  keywords: [
    "doctor appointment booking",
    "book doctor online",
    "find doctors near me",
    "healthcare appointments",
    "online doctor consultation",
    "medical specialists",
    "clinic booking",
  ],
  authors: [{ name: "MediBook" }],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "MediBook",
    title: "MediBook — Book Doctor Appointments Online",
    description:
      "Find and book appointments with top-rated doctors near you. MediBook connects patients with trusted healthcare professionals.",
    // Image comes from src/app/opengraph-image.tsx (1200x630). Do not add an
    // `images` key here — an explicit entry overrides the file convention.
  },
  twitter: {
    card: "summary_large_image",
    title: "MediBook — Book Doctor Appointments Online",
    description:
      "Find and book appointments with top-rated doctors near you. MediBook connects patients with trusted healthcare professionals.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1517" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
