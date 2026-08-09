"use client";

import React, { useState } from "react";
import { Button } from "../ui/Button";

type Status = "idle" | "loading" | "success" | "error";

export function WaitlistSection() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<Status>("idle");
    const [message, setMessage] = useState<string | null>(null);

    const validate = (value: string) => {
        if (!value.trim()) return "Email is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return "Enter a valid email address.";
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const nextError = validate(email);
        if (nextError) {
            setStatus("error");
            setMessage(nextError);
            return;
        }

        setStatus("loading");
        setMessage(null);

        try {
            const res = await fetch("/api/waitlist", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
            });

            const data = (await res.json()) as {
                ok?: boolean;
                message?: string;
                error?: string;
                alreadyJoined?: boolean;
            };

            if (!res.ok) {
                setStatus("error");
                setMessage(data.error || "Could not join the waitlist. Try again.");
                return;
            }

            setStatus("success");
            setMessage(
                data.message ||
                    (data.alreadyJoined
                        ? "You are already on the waitlist."
                        : "You are on the list. We will write when access opens."),
            );
        } catch {
            setStatus("error");
            setMessage("Network error. Check your connection and try again.");
        }
    };

    return (
        <section id="waitlist" className="scroll-mt-28 py-24 px-6 bg-white relative">
            <div className="max-w-4xl mx-auto bg-wild-light rounded-[2.5rem] p-10 md:p-16 text-center shadow-sm">
                <h2 className="text-4xl font-bold text-wild-dark tracking-tight mb-4">
                    Join the waitlist
                </h2>
                <p className="text-lg text-wild-gray mb-10 max-w-xl mx-auto">
                    Be among the first to experience Naturalens in the field. We&apos;re launching soon to a limited group of early adopters.
                </p>

                {status === "success" ? (
                    <p className="text-base font-medium text-wild-dark" role="status">
                        {message}
                    </p>
                ) : (
                    <form
                        className="max-w-md mx-auto flex flex-col sm:flex-row gap-3"
                        onSubmit={handleSubmit}
                        noValidate
                    >
                        <div className="flex-1 text-left">
                            <label htmlFor="waitlist-email" className="sr-only">
                                Email
                            </label>
                            <input
                                id="waitlist-email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (status === "error") {
                                        setStatus("idle");
                                        setMessage(null);
                                    }
                                }}
                                placeholder="Enter your email"
                                className="w-full h-14 rounded-full px-6 text-base text-wild-dark border-2 border-transparent focus:border-wild-amber outline-none transition-colors bg-white"
                                disabled={status === "loading"}
                                aria-invalid={status === "error"}
                                aria-describedby={message ? "waitlist-message" : undefined}
                                required
                            />
                        </div>
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="w-full sm:w-auto shrink-0 px-8"
                            disabled={status === "loading"}
                        >
                            {status === "loading" ? "Joining…" : "Join Waitlist"}
                        </Button>
                    </form>
                )}

                {message && status !== "success" && (
                    <p
                        id="waitlist-message"
                        className="mt-4 text-sm text-red-700"
                        role="alert"
                    >
                        {message}
                    </p>
                )}
            </div>
        </section>
    );
}
