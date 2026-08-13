import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-[family-name:var(--font-archivo)] font-medium tracking-[0.02em] transition-[background-color,border-color,color] duration-[var(--nl-motion-state)] ease-[var(--nl-ease)] focus:outline-none focus-visible:outline-[length:var(--nl-focus-width)] focus-visible:outline-offset-[var(--nl-focus-offset)] focus-visible:outline-fg disabled:opacity-40 disabled:pointer-events-none";

  const variants = {
    primary:
      "rounded-[var(--nl-radius-cta)] bg-fg text-bg hover:bg-[#222222]",
    secondary:
      "rounded-[var(--nl-radius-input)] bg-transparent text-fg border border-fg hover:bg-surface",
    tertiary:
      "rounded-none bg-transparent text-fg border-b border-transparent hover:border-fg px-0",
  };

  const sizes = {
    sm: "h-9 px-5 text-sm",
    md: "h-12 px-7 text-[15px]",
    lg: "h-14 px-8 text-base",
  };

  const tertiarySizes = {
    sm: "py-2 text-sm",
    md: "py-3.5 text-[15px]",
    lg: "py-4 text-base",
  };

  const sizeClass =
    variant === "tertiary" ? tertiarySizes[size] : sizes[size];

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizeClass} ${className || ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
