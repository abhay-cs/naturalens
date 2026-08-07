"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export function ProductMockup() {
  const barcodeWidths = [
    2, 1, 3, 1, 2, 4, 1, 1, 2, 1, 3, 2, 1, 4, 1, 2, 1, 3, 1, 1, 2, 3, 1, 2, 4, 1,
    1, 2, 1, 3, 2, 1, 4, 1, 2, 1, 3, 1, 2,
  ];

  const cardRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const springX = useSpring(mx, { stiffness: 120, damping: 18 });
  const springY = useSpring(my, { stiffness: 120, damping: 18 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-4, 4]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mx.set(x);
    my.set(y);
  };

  const handlePointerLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <section
      id="specimen"
      className="flex justify-center px-6 pb-28 md:pb-36"
    >
      <motion.div
        initial={{ y: 32, opacity: 0, rotateX: 6, rotateY: -4 }}
        whileInView={{ y: 0, opacity: 1, rotateX: 0, rotateY: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{ perspective: 1200 }}
        className="specimen-stage w-full max-w-[600px]"
      >
        <div className="specimen-scale">
        <motion.div
          ref={cardRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="specimen-card relative flex aspect-[1.58] w-[600px] select-none flex-col overflow-hidden rounded-[6px] border border-rule bg-paper-raised shadow-[0_1px_2px_rgba(23,26,18,0.06),0_24px_48px_-12px_rgba(23,26,18,0.18)] sm:w-full"
        >
          {/* Forest rail */}
          <div className="absolute left-0 top-0 z-0 h-[63%] w-[35%] bg-forest" />

          {/* Muted stripe bands behind left rail / lower left only */}
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-50">
            <svg
              className="absolute h-full w-full"
              viewBox="0 0 600 380"
              preserveAspectRatio="none"
            >
              <path
                d="M -50 200 L 280 280"
                fill="none"
                stroke="#4a7c59"
                strokeWidth="16"
              />
              <path
                d="M -50 218 L 280 298"
                fill="none"
                stroke="#729b79"
                strokeWidth="16"
              />
              <path
                d="M -50 236 L 280 316"
                fill="none"
                stroke="#a08b6c"
                strokeWidth="16"
              />
            </svg>
          </div>

          {/* Top half */}
          <div className="relative z-10 flex h-[63%] w-full">
            <div className="flex h-full w-[35%] flex-col items-center justify-center px-4 pt-8">
              <div className="w-full max-w-[130px] border border-paper/30 bg-paper p-1.5 shadow-[1px_1px_0_rgba(0,0,0,0.15)]">
                <div
                  className="aspect-[4/5] w-full bg-cover bg-center"
                  style={{
                    backgroundImage:
                      "url('https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?q=80&w=400&auto=format&fit=crop')",
                  }}
                  role="img"
                  aria-label="Giant panda portrait"
                />
              </div>
            </div>

            <div className="flex h-full flex-1 flex-col pl-3 pr-5 pt-4">
              <div className="flex items-start gap-3">
                <h2 className="m-0 font-display text-[2.25rem] uppercase leading-none tracking-tight text-ochre md:text-[2.5rem]">
                  Naturalens
                </h2>
                <span className="mt-1 font-mono text-[9px] uppercase leading-[1.2] tracking-[0.14em] text-forest">
                  Specimen
                  <br />
                  Record
                </span>
              </div>

              <div className="mt-3 mb-3 flex items-baseline gap-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-lichen">
                  Number
                </span>
                <span className="font-mono text-xl font-medium tabular-nums tracking-wider text-ink">
                  01-47-87441
                </span>
              </div>

              <div className="mt-1 flex gap-8 font-mono text-[12px] leading-none tracking-tight">
                <div className="flex items-baseline gap-2">
                  <span className="text-[11px] uppercase tracking-[0.12em] text-forest">
                    DOB
                  </span>
                  <span className="text-[1.15rem] tabular-nums tracking-tight text-ink">
                    06/03/2018
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[11px] uppercase tracking-[0.12em] text-ochre">
                    EXP
                  </span>
                  <span className="text-[1.15rem] tabular-nums tracking-tight text-ink">
                    06/03/2030
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Perforation + registration mark */}
          <div className="relative z-10 flex items-center gap-2 px-3">
            <div className="h-px flex-1 border-t border-dashed border-ink/20" />
            <span
              className="h-1.5 w-1.5 rotate-45 border border-ink/30"
              aria-hidden
            />
            <div className="h-px flex-1 border-t border-dashed border-ink/20" />
          </div>

          {/* Bottom half */}
          <div className="relative z-10 mt-1 flex h-[37%] w-full">
            <div className="flex h-full w-[35%] flex-col px-3 pt-1">
              <div className="mb-2 flex h-9 w-full items-start gap-[1.5px] overflow-hidden bg-paper-raised/60">
                {barcodeWidths.map((w, i) => (
                  <div
                    key={i}
                    className="shrink-0 bg-ink"
                    style={{
                      width: `${w}px`,
                      height: i % 4 === 0 || i % 7 === 0 ? "100%" : "80%",
                    }}
                  />
                ))}
              </div>
              <span className="font-mono text-[11px] font-medium uppercase tracking-wide text-ink">
                Giant Panda
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wide text-lichen">
                Ailuropoda Melanoleuca
              </span>
              <span className="mt-1 font-mono text-[9px] uppercase tracking-wide text-lichen">
                Sichuan, China
              </span>
            </div>

            <div className="flex h-full flex-1 flex-col pl-2 pr-5">
              <div className="mt-1 grid w-full grid-cols-6 gap-1 font-mono text-[9px] uppercase tracking-[0.08em] text-ochre">
                {[
                  ["HT", "75cm"],
                  ["WT", "100kg"],
                  ["COAT", "B/W"],
                  ["EYES", "BRO"],
                  ["SEX", "M"],
                  ["CTY", "0"],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-col items-start gap-0.5">
                    <span>{label}</span>
                    <span className="text-[11px] tabular-nums text-ink">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-4 gap-2 font-mono text-[9px] uppercase tracking-[0.08em] text-ink">
                <div className="flex flex-col gap-0.5">
                  <span className="text-lichen">Issue date</span>
                  <span className="text-[11px] tabular-nums">06/18/2023</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-lichen">Class</span>
                  <span className="text-[11px] tabular-nums">3</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-lichen">Restr</span>
                  <span className="text-[11px] text-lichen/50">/</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-lichen">Endorse</span>
                  <span className="text-[11px] text-lichen/50">/</span>
                </div>
              </div>

              <div className="flex flex-1 items-end justify-center pb-3 pr-8">
                <svg
                  className="h-9 w-28 -rotate-2 opacity-70"
                  viewBox="0 0 200 60"
                  aria-hidden
                >
                  <path
                    d="M 20 40 Q 30 10 40 30 T 60 40 Q 80 20 90 40 T 120 20 Q 140 50 160 30 T 180 50"
                    fill="none"
                    stroke="#171A12"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 35 25 Q 50 25 65 25"
                    fill="none"
                    stroke="#171A12"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
