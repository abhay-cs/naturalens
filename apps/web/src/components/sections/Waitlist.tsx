"use client";

import React, { useState } from "react";
import { Button } from "../ui/Button";

export function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const validate = (value: string) => {
    if (!value.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Enter a valid email address.";
    }
    return null;
  };

  const handleBlur = () => {
    if (!email) return;
    setError(validate(email));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextError = validate(email);
    setError(nextError);
    if (nextError) return;
    setSubmitted(true);
  };

  return (
    <section id="access" className="bg-forest px-6 py-24 text-paper md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-paper/55">
            Access
          </p>
          <h2 className="font-display text-4xl tracking-tight text-paper md:text-5xl">
            Join the first field group
          </h2>
          <p className="mt-4 max-w-[48ch] text-lg leading-relaxed text-paper/70">
            We are opening to a small set of early observers. Leave an email and
            we will send an invite when your spot is ready.
          </p>
        </div>

        <div className="mt-12 max-w-lg">
          {submitted ? (
            <p className="font-mono text-sm tracking-wide text-paper">
              You are on the list. We will write when access opens.
            </p>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              <div>
                <label
                  htmlFor="access-email"
                  className="mb-2 block font-mono text-[11px] uppercase tracking-[0.16em] text-paper/60"
                >
                  Email
                </label>
                <input
                  id="access-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  onBlur={handleBlur}
                  className="w-full border-0 border-b border-paper/30 bg-transparent pb-3 font-sans text-base text-paper placeholder:text-paper/35 outline-none transition-colors focus:border-ochre"
                  placeholder="you@example.com"
                  aria-invalid={!!error}
                  aria-describedby={error ? "access-email-error" : undefined}
                />
                {error && (
                  <p
                    id="access-email-error"
                    className="mt-2 font-mono text-[11px] text-[#E8A070]"
                  >
                    {error}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="secondary"
                size="lg"
                className="border-paper/20 bg-paper text-forest hover:bg-paper-raised"
              >
                Request access
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
