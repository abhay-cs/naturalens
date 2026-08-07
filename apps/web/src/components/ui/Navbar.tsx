"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./Button";
import Link from "next/link";
import { motion } from "framer-motion";

export function Navbar() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <motion.header
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`fixed top-6 left-1/2 z-50 -translate-x-1/2 w-[90%] max-w-4xl transition-all duration-300 ${scrolled ? "bg-white/80 backdrop-blur-md shadow-sm border border-black/5" : "bg-white shadow-sm border border-black/5"
                } rounded-full`}
        >
            <div className="flex items-center justify-between px-6 py-3">
                {/* Logo */}
                <Link href="/" className="text-xl font-bold tracking-tight text-wild-dark">
                    Naturalens
                </Link>

                {/* Links */}
                <nav className="hidden md:flex items-center gap-8">
                    <Link href="#product" className="text-wild-gray hover:text-wild-dark font-medium transition-colors">
                        Product
                    </Link>
                    <Link href="#how-it-works" className="text-wild-gray hover:text-wild-dark font-medium transition-colors">
                        How It Works
                    </Link>
                    <Link href="#conservation" className="text-wild-gray hover:text-wild-dark font-medium transition-colors">
                        Conservation
                    </Link>
                </nav>

                {/* CTA */}
                <Button variant="primary" size="sm" className="hidden md:inline-flex px-6">
                    Early Access
                </Button>
            </div>
        </motion.header>
    );
}
