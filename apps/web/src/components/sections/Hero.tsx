"use client";

import React from "react";
import { Button } from "../ui/Button";
import { motion } from "framer-motion";
import Link from "next/link";

const ease = [0.22, 1, 0.36, 1] as const;

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-28 md:pb-24 md:pt-36">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0 }}
            className="mb-8 flex items-center gap-4"
          >
            <span className="h-px w-10 bg-ink/30" aria-hidden />
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-lichen">
              Field Guide / Edition 001
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.08 }}
            className="text-display text-ink"
          >
            See the{" "}
            <em className="font-display italic text-ochre [font-variation-settings:'WONK'_1,'SOFT'_50]">
              wild
            </em>
            <br />
            differently
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.16 }}
            className="mt-8 max-w-[42ch] text-lg leading-relaxed text-lichen md:text-xl"
          >
            Point your phone at an animal. Naturalens names the species and
            keeps a quiet log of what you find.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.24 }}
            className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center"
          >
            <Link href="#access">
              <Button variant="primary" size="lg">
                Request access
              </Button>
            </Link>
            <Link
              href="#specimen"
              className="font-mono text-[11px] uppercase tracking-[0.16em] text-lichen transition-colors hover:text-ink"
            >
              View specimen record
            </Link>
          </motion.div>
        </div>

        <motion.aside
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, ease, delay: 0.32 }}
          className="relative hidden items-start justify-end md:col-span-5 md:flex"
          aria-hidden
        >
          <div className="mt-16 flex items-start gap-4">
            <span className="mt-1 h-28 w-px bg-rule" />
            <p className="w-[11rem] -rotate-90 origin-top-left translate-x-5 font-mono text-[10px] uppercase leading-relaxed tracking-[0.18em] text-lichen">
              Plate 01 · Ailuropoda melanoleuca · Sichuan
            </p>
          </div>
        </motion.aside>
      </div>
    </section>
  );
}
