import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "NEXUS - AI-Powered Personal Platform",
    template: "%s | NEXUS",
  },
  description: "Turn skills into money, automation into freedom, and data into power. The ultimate AI-powered platform for developers and tech professionals.",
  keywords: ["portfolio", "freelance", "AI", "automation", "developer tools", "GitHub sync", "resume generator"],
  authors: [{ name: "Gamer77nyh" }],
  creator: "Gamer77nyh",
  metadataBase: new URL("https://nexus-platform.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://nexus-platform.vercel.app",
    title: "NEXUS - AI-Powered Personal Platform",
    description: "Turn skills into money, automation into freedom, and data into power.",
    siteName: "NEXUS",
  },
  twitter: {
    card: "summary_large_image",
    title: "NEXUS - AI-Powered Personal Platform",
    description: "Turn skills into money, automation into freedom, and data into power.",
    creator: "@Gamer77nyh",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
