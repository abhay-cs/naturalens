import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Naturalens | See the Wild Differently",
  description: "AI-powered species recognition in real time. A quiet intelligence for curious observers.",
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
