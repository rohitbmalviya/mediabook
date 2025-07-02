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

// Update to the real domain when deployed
const siteUrl = "https://medibook.example.com";

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
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "MediBook logo" }],
  },
  twitter: {
    card: "summary",
    title: "MediBook — Book Doctor Appointments Online",
    description:
      "Find and book appointments with top-rated doctors near you. MediBook connects patients with trusted healthcare professionals.",
    images: ["/icon-512.png"],
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
