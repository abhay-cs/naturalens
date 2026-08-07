import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "link";
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
    "inline-flex items-center justify-center rounded-[4px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-40 disabled:pointer-events-none";

  const variants = {
    primary:
      "bg-ink text-paper hover:bg-forest active:bg-ink/90",
    secondary:
      "bg-paper-raised text-ink border border-rule hover:border-ink/30 active:bg-paper",
    outline:
      "border border-ink/20 text-ink bg-transparent hover:border-ink/50 active:bg-ink/5",
    link:
      "rounded-none bg-transparent text-ink underline-offset-4 hover:underline hover:text-ochre active:text-ochre/80 px-0",
  };

  const sizes = {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-6 text-base",
    lg: "h-12 px-8 text-base",
  };

  const sizeClass = variant === "link" ? "h-auto py-1 text-base" : sizes[size];

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizeClass} ${className || ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
