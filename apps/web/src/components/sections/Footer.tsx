import React from "react";
import Link from "next/link";

export function FooterSection() {
  return (
    <footer className="bg-paper px-6 pb-10 pt-16 md:pt-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-6">
            <p className="font-display text-2xl tracking-tight text-ink">
              Naturalens
            </p>
            <p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-lichen">
              A field companion for naming what you see, and remembering where
              you saw it.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 md:col-span-5 md:col-start-8">
            <div className="flex flex-col gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-lichen">
                Explore
              </span>
              <Link
                href="#specimen"
                className="font-mono text-[12px] uppercase tracking-[0.12em] text-ink transition-colors hover:text-ochre"
              >
                Specimen
              </Link>
              <Link
                href="#method"
                className="font-mono text-[12px] uppercase tracking-[0.12em] text-ink transition-colors hover:text-ochre"
              >
                Method
              </Link>
              <Link
                href="#access"
                className="font-mono text-[12px] uppercase tracking-[0.12em] text-ink transition-colors hover:text-ochre"
              >
                Access
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-lichen">
                Legal
              </span>
              <Link
                href="#"
                className="font-mono text-[12px] uppercase tracking-[0.12em] text-ink transition-colors hover:text-ochre"
              >
                Privacy
              </Link>
              <Link
                href="#"
                className="font-mono text-[12px] uppercase tracking-[0.12em] text-ink transition-colors hover:text-ochre"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-rule pt-6">
          <p className="font-mono text-[11px] tracking-wide text-lichen">
            © {new Date().getFullYear()} Naturalens. Field notes only.
          </p>
        </div>
      </div>
    </footer>
  );
}
