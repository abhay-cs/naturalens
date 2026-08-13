"use client";

import React from "react";
import { OwlMarkImage } from "../ui/Logo";

function scrollToWaitlist(e: React.MouseEvent) {
  e.preventDefault();
  const el = document.getElementById("waitlist");
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Hero — exact match to Naturalens Landing.html, logo is the reference PNG */
export function HeroSection() {
  return (
    <section
      id="top"
      className="flex flex-col items-center justify-center text-center"
      style={{
        minHeight: "calc(100vh - 65px)",
        padding: "clamp(56px, 9vh, 120px) clamp(20px, 5vw, 64px)",
      }}
    >
      <OwlMarkImage
        className="nl-rise"
        style={{
          width: "clamp(140px, 22vh, 260px)",
          height: "clamp(140px, 22vh, 260px)",
          animationDelay: "0ms",
        }}
      />

      <h1
        className="nl-rise text-balance text-[#000000]"
        style={{
          fontFamily: "var(--font-outfit), Outfit, sans-serif",
          fontWeight: 200,
          fontSize: "clamp(46px, 8vw, 104px)",
          lineHeight: 1.02,
          letterSpacing: "-0.03em",
          margin: "clamp(32px, 5vh, 56px) 0 0",
          maxWidth: "16ch",
          animationDelay: "80ms",
        }}
      >
        See the Wild Differently
      </h1>

      <p
        className="nl-rise text-pretty text-[#666666]"
        style={{
          fontFamily: "var(--font-archivo), Archivo, sans-serif",
          fontSize: "clamp(16px, 1.4vw, 19px)",
          lineHeight: 1.6,
          maxWidth: "46ch",
          margin: "24px 0 0",
          animationDelay: "140ms",
        }}
      >
        Point your camera at anything alive. Naturalens returns a name, a
        confidence, and one thing to look for next time.
      </p>

      <a
        href="#waitlist"
        onClick={scrollToWaitlist}
        className="nl-rise inline-flex rounded-full bg-[#000000] font-medium text-[#FFFFFF] no-underline transition-[background] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#222222]"
        style={{
          fontFamily: "var(--font-archivo), Archivo, sans-serif",
          fontSize: 16,
          letterSpacing: "0.02em",
          padding: "17px 34px",
          marginTop: 40,
          animationDelay: "200ms",
        }}
      >
        Get Early Access
      </a>

      <div
        className="nl-rise uppercase text-[#999999]"
        style={{
          fontFamily: "var(--font-archivo), Archivo, sans-serif",
          fontSize: 11,
          letterSpacing: "0.14em",
          marginTop: 20,
          animationDelay: "200ms",
        }}
      >
        Offline · 41,000 species · No account
      </div>
    </section>
  );
}
