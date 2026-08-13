"use client";

import React, { useState } from "react";
import { OwlMarkImage } from "../ui/Logo";

type Status = "idle" | "loading" | "success" | "error";

/** Waitlist — exact match to Naturalens Landing.html (API wired) */
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
    <section
      id="waitlist"
      className="scroll-mt-20 border-b border-[#E5E5E5]"
      style={{ padding: "clamp(80px, 12vw, 160px) clamp(20px, 5vw, 64px)" }}
    >
      <div className="mx-auto max-w-[520px] text-center">
        <div
          className="uppercase text-[#999999]"
          style={{
            fontFamily: "var(--font-archivo), Archivo, sans-serif",
            fontSize: 11,
            letterSpacing: "0.14em",
          }}
        >
          Waitlist
        </div>

        <h2
          className="text-[#000000]"
          style={{
            fontFamily: "var(--font-outfit), Outfit, sans-serif",
            fontWeight: 300,
            fontSize: "clamp(34px, 4.6vw, 56px)",
            lineHeight: 1.08,
            letterSpacing: "-0.025em",
            margin: "20px 0 0",
          }}
        >
          Be there for the first release
        </h2>

        <p
          className="text-pretty text-[#666666]"
          style={{
            fontFamily: "var(--font-archivo), Archivo, sans-serif",
            fontSize: 17,
            lineHeight: 1.65,
            margin: "16px 0 40px",
          }}
        >
          We open in small groups, region by region. Leave an address and we
          will write once.
        </p>

        {status === "success" ? (
          <div
            className="flex flex-col items-center gap-3 border border-[#000000] p-8"
            role="status"
          >
            <OwlMarkImage size={40} />
            <div
              className="text-[#000000]"
              style={{
                fontFamily: "var(--font-outfit), Outfit, sans-serif",
                fontSize: 24,
              }}
            >
              You are on the list
            </div>
            <div
              className="text-[#666666]"
              style={{
                fontFamily: "var(--font-archivo), Archivo, sans-serif",
                fontSize: 14,
              }}
            >
              {message || "One message when your region opens."}
            </div>
          </div>
        ) : (
          <form
            className="grid gap-3 text-left"
            onSubmit={handleSubmit}
            noValidate
          >
            <label
              htmlFor="nl-email"
              className="uppercase text-[#666666]"
              style={{
                fontFamily: "var(--font-archivo), Archivo, sans-serif",
                fontSize: 11,
                letterSpacing: "0.12em",
              }}
            >
              Email
            </label>
            <input
              id="nl-email"
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
              placeholder="you@field.org"
              disabled={status === "loading"}
              aria-invalid={status === "error"}
              aria-describedby={message ? "waitlist-message" : undefined}
              required
              className="w-full box-border border border-[#E5E5E5] bg-[#FFFFFF] text-[#000000] outline-none transition-[border-color] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-[#999999] focus:border-[#000000]"
              style={{
                fontFamily: "var(--font-archivo), Archivo, sans-serif",
                fontSize: 16,
                padding: 16,
                borderRadius: 2,
              }}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full cursor-pointer rounded-full border-none bg-[#000000] font-medium text-[#FFFFFF] transition-[background] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#222222] disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                fontFamily: "var(--font-archivo), Archivo, sans-serif",
                fontSize: 16,
                letterSpacing: "0.02em",
                padding: "17px 26px",
              }}
            >
              {status === "loading" ? "Joining…" : "Get Early Access"}
            </button>
            <span
              className="text-[#999999]"
              style={{
                fontFamily: "var(--font-archivo), Archivo, sans-serif",
                fontSize: 13,
              }}
            >
              No newsletter, no forwarding, no account required.
            </span>
          </form>
        )}

        {message && status !== "success" && (
          <p
            id="waitlist-message"
            className="mt-4 text-[#000000]"
            style={{
              fontFamily: "var(--font-archivo), Archivo, sans-serif",
              fontSize: 14,
            }}
            role="alert"
          >
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
