import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline";
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
    const baseStyles = "inline-flex items-center justify-center rounded-full font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-wild-amber focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
        primary: "bg-wild-dark text-white hover:bg-wild-dark/90 shadow-sm hover:shadow-md",
        secondary: "bg-wild-light text-wild-dark hover:bg-gray-200",
        outline: "border-2 border-wild-dark/10 text-wild-dark hover:border-wild-dark/30 bg-transparent",
    };

    const sizes = {
        sm: "h-9 px-4 text-sm",
        md: "h-12 px-8 text-base",
        lg: "h-14 px-10 text-lg",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className || ""}`}
            {...props}
        >
            {children}
        </button>
    );
}
