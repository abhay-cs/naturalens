import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const siteUrl = "https://naturalens-web.abhaysharmacse.workers.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Naturalens | See the Wild Differently",
  description:
    "AI-powered species recognition in real time. A quiet intelligence for curious observers.",
  applicationName: "Naturalens",
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Naturalens",
    title: "Naturalens | See the Wild Differently",
    description:
      "AI-powered species recognition in real time. A quiet intelligence for curious observers.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Naturalens — See the Wild Differently",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Naturalens | See the Wild Differently",
    description:
      "AI-powered species recognition in real time. A quiet intelligence for curious observers.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased selection:bg-wild-amber selection:text-wild-dark`}
      >
        {children}
      </body>
    </html>
  );
}
