"use client";

import React from "react";
import { Button } from "../ui/Button";

export function WaitlistSection() {
    return (
        <section className="py-24 px-6 bg-white relative">
            <div className="max-w-4xl mx-auto bg-wild-light rounded-[2.5rem] p-10 md:p-16 text-center shadow-sm">
                <h2 className="text-4xl font-bold text-wild-dark tracking-tight mb-4">
                    Join the waitlist
                </h2>
                <p className="text-lg text-wild-gray mb-10 max-w-xl mx-auto">
                    Be among the first to experience Naturalens in the field. We're launching soon to a limited group of early adopters.
                </p>

                <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        className="flex-1 h-14 rounded-full px-6 text-base text-wild-dark border-2 border-transparent focus:border-wild-amber outline-none transition-colors"
                        required
                    />
                    <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto shrink-0 px-8">
                        Join Waitlist →
                    </Button>
                </form>
            </div>
        </section>
    );
}
