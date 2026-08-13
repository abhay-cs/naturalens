import type { Metadata } from "next";
import { Archivo, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const siteUrl = "https://naturalens.ca";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Naturalens | See the Wild Differently",
  description:
    "Point your camera at anything alive. Naturalens returns a name, a confidence, and one thing to look for next time.",
  applicationName: "Naturalens",
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Naturalens",
    title: "Naturalens | See the Wild Differently",
    description:
      "Point your camera at anything alive. Naturalens returns a name, a confidence, and one thing to look for next time.",
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
      "Point your camera at anything alive. Naturalens returns a name, a confidence, and one thing to look for next time.",
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
        className={`${outfit.variable} ${archivo.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
