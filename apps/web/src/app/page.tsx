"use client";

import { Navbar } from "@/components/ui/Navbar";
import { HeroSection } from "@/components/sections/Hero";
import { ProductMockup } from "@/components/sections/ProductMockup";
import { HowItWorksSection } from "@/components/sections/HowItWorks";
import { LedgerStrip } from "@/components/sections/LedgerStrip";
import { WaitlistSection } from "@/components/sections/Waitlist";
import { FooterSection } from "@/components/sections/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-paper">
      <Navbar />
      <HeroSection />
      <ProductMockup />
      <HowItWorksSection />
      <LedgerStrip />
      <WaitlistSection />
      <FooterSection />
    </main>
  );
}
