import React from "react";

export function LedgerStrip() {
  const facts = [
    {
      label: "Identification",
      value: "Runs against the Gemini API today",
    },
    {
      label: "Roadmap",
      value: "On-device inference is the goal",
    },
    {
      label: "Memory",
      value: "Every sighting stays in your log",
    },
  ];

  return (
    <section id="ledger" className="border-y border-rule bg-paper-raised px-6 py-12 md:py-14">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3 md:gap-0">
        {facts.map((fact, i) => (
          <div
            key={fact.label}
            className={`flex flex-col gap-2 md:px-8 ${
              i > 0 ? "md:border-l md:border-rule" : "md:pl-0"
            } ${i === 0 ? "" : ""} ${i === facts.length - 1 ? "md:pr-0" : ""}`}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-lichen">
              {fact.label}
            </span>
            <p className="font-mono text-sm leading-snug text-ink md:text-[15px]">
              {fact.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
