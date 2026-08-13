"use client";

import { Navbar } from "@/components/ui/Navbar";
import { HeroSection } from "@/components/sections/Hero";
import { WaitlistSection } from "@/components/sections/Waitlist";
import { FooterSection } from "@/components/sections/Footer";

/** Exact port of Naturalens Landing.html — colors, type, logo, spacing. */
export default function Home() {
  return (
    <main
      className="min-h-screen bg-[#FFFFFF] text-[#000000]"
      style={{ fontFamily: "var(--font-archivo), Archivo, sans-serif" }}
    >
      <Navbar />
      <HeroSection />
      <WaitlistSection />
      <FooterSection />
    </main>
  );
}
