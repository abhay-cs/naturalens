import React from "react";
import Link from "next/link";
import { Logo } from "../ui/Logo";

export function FooterSection() {
    return (
        <footer className="bg-white py-12 px-6 border-t border-black/5">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                <Logo size={28} />

                <div className="flex gap-6 text-sm text-wild-gray">
                    <Link href="#" className="hover:text-wild-dark transition-colors">Twitter</Link>
                    <Link href="#" className="hover:text-wild-dark transition-colors">Instagram</Link>
                    <Link href="/privacy" className="hover:text-wild-dark transition-colors">Privacy Policy</Link>
                    <Link href="/terms" className="hover:text-wild-dark transition-colors">Terms of Service</Link>
                </div>
            </div>
        </footer>
    );
}
