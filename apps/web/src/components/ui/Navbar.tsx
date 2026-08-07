"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-[border-color,background-color] duration-300 ${
        scrolled
          ? "bg-paper/90 backdrop-blur-sm border-b border-rule"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="font-display text-xl tracking-tight text-ink md:text-2xl"
        >
          Naturalens
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          <Link
            href="#specimen"
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-lichen transition-colors hover:text-ink"
          >
            Specimen
          </Link>
          <Link
            href="#method"
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-lichen transition-colors hover:text-ink"
          >
            Method
          </Link>
          <Link
            href="#ledger"
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-lichen transition-colors hover:text-ink"
          >
            Ledger
          </Link>
        </nav>

        <Link
          href="#access"
          className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink transition-colors hover:text-ochre"
        >
          Request access
        </Link>
      </div>
    </header>
  );
}
