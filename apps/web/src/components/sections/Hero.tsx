"use client";

import React from "react";
import { Button } from "../ui/Button";
import { motion } from "framer-motion";

export function HeroSection() {
    return (
        <section className="relative pt-40 pb-20 px-6 overflow-hidden flex flex-col items-center justify-center text-center">
            {/* Background Decor */}
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-wild-amber/10 blur-[120px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="max-w-4xl mx-auto z-10"
            >
                <h1 className="text-5xl md:text-7xl font-extrabold text-wild-dark tracking-tight mb-6 leading-tight">
                    See the <span className="text-wild-gray opacity-80 mix-blend-multiply">Wild</span> Differently
                </h1>

                <p className="text-lg md:text-xl text-wild-gray max-w-2xl mx-auto mb-10 leading-relaxed font-medium bg-wild-gray/10 px-4 py-2 rounded-lg inline-block mix-blend-multiply">
                    AI-powered species recognition in real time. A quiet intelligence for curious observers.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button variant="primary" size="lg" className="w-full sm:w-auto">
                        Get Early Access
                    </Button>
                    <Button variant="outline" size="lg" className="w-full sm:w-auto px-10">
                        Watch Demo
                    </Button>
                </div>
            </motion.div>
        </section>
    );
}
