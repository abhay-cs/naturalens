import React from "react";
import Link from "next/link";
import { OwlMarkImage } from "../ui/Logo";

/** Footer — exact match to Naturalens Landing.html */
export function FooterSection() {
  return (
    <footer
      className="flex flex-wrap items-center justify-between gap-6"
      style={{ padding: "48px clamp(20px, 5vw, 64px)" }}
    >
      <div className="flex items-center gap-3">
        <OwlMarkImage size={24} />
        <span
          className="text-[#666666]"
          style={{
            fontFamily: "var(--font-archivo), Archivo, sans-serif",
            fontSize: 12,
            letterSpacing: "0.06em",
          }}
        >
          © 2026 Naturalens
        </span>
      </div>

      <div
        className="flex flex-wrap gap-7"
        style={{
          fontFamily: "var(--font-archivo), Archivo, sans-serif",
          fontSize: 14,
        }}
      >
        <Link
          href="/privacy"
          className="text-[#666666] no-underline transition-colors duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-[#000000]"
        >
          Privacy
        </Link>
        <Link
          href="/terms"
          className="text-[#666666] no-underline transition-colors duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-[#000000]"
        >
          Terms
        </Link>
        <a
          href="mailto:hello@naturalens.app"
          className="text-[#666666] no-underline transition-colors duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-[#000000]"
        >
          Contact
        </a>
      </div>
    </footer>
  );
}
