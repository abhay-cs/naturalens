import React from "react";
import { IndexRow } from "../ui/IndexRow";

export function HowItWorksSection() {
  const steps = [
    {
      index: "01",
      title: "Detect",
      description:
        "Open the camera or drop in a photo. Naturalens reads the frame in the field, without a separate upload flow.",
    },
    {
      index: "02",
      title: "Identify",
      description:
        "Species name, scientific binomial, and habitat context return in seconds so you can keep walking.",
    },
    {
      index: "03",
      title: "Log",
      description:
        "Each sighting lands in a private observation list you can revisit later. Your notes stay with you.",
    },
  ];

  return (
    <section id="method" className="relative z-10 bg-paper px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-xl md:mb-16">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-lichen">
            Method
          </p>
          <h2 className="font-display text-4xl tracking-tight text-ink md:text-5xl">
            Three steps. One quiet loop.
          </h2>
          <p className="mt-4 text-lg text-lichen">
            Capture, name, and keep. Built for people who already look closely.
          </p>
        </div>

        <div className="border-b border-rule">
          {steps.map((step) => (
            <IndexRow
              key={step.index}
              index={step.index}
              title={step.title}
              description={step.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
