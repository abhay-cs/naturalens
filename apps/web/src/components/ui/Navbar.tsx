"use client";

import React from "react";
import { Logo } from "./Logo";

function scrollToWaitlist(e: React.MouseEvent) {
  e.preventDefault();
  const el = document.getElementById("waitlist");
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Sticky hairline nav — exact match to Naturalens Landing.html */
export function Navbar() {
  return (
    <nav
      className="sticky top-0 z-10 flex items-center justify-between gap-6 border-b border-[#E5E5E5] bg-[#FFFFFF]"
      style={{ padding: "16px clamp(20px, 5vw, 64px)" }}
    >
      <Logo size={32} strokeWidth={2} href="/#top" raster />

      <a
        href="#waitlist"
        onClick={scrollToWaitlist}
        className="hidden rounded-full bg-[#000000] px-[22px] py-[11px] font-[family-name:var(--font-archivo)] text-[14px] font-medium tracking-[0.02em] text-[#FFFFFF] no-underline transition-[background] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#222222] md:inline-flex"
      >
        Join the waitlist
      </a>
    </nav>
  );
}
