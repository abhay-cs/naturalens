import React from "react";

interface IndexRowProps {
  index: string;
  title: string;
  description: string;
}

export function IndexRow({ index, title, description }: IndexRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 border-t border-rule py-8 md:grid-cols-12 md:gap-6 md:py-10">
      <div className="md:col-span-1">
        <span className="font-mono text-[11px] tabular-nums tracking-[0.14em] text-lichen">
          {index}
        </span>
      </div>
      <div className="md:col-span-4">
        <h3 className="font-display text-3xl tracking-tight text-ink md:text-4xl">
          {title}
        </h3>
      </div>
      <div className="md:col-span-6 md:col-start-7">
        <p className="max-w-[52ch] text-base leading-relaxed text-lichen md:text-lg">
          {description}
        </p>
      </div>
    </div>
  );
}
