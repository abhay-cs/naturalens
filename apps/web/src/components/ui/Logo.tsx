import Link from "next/link";
import type { CSSProperties } from "react";

/**
 * Exact owl from owl-svgrepo-com.svg — stroke only, fill none on every path.
 * Do not fill the tuft or eyes; the PNG reference matches the stroked original.
 */
export function OwlMark({
  size,
  strokeWidth = 2,
  className = "",
  style,
}: {
  size?: number | string;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const dim =
    typeof size === "number" || typeof size === "string"
      ? { width: size, height: size }
      : undefined;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      xmlSpace="preserve"
      aria-hidden={true}
      className={className}
      style={{ color: "#000000", ...dim, ...style }}
      width={typeof size === "number" ? size : undefined}
      height={typeof size === "number" ? size : undefined}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit={10}
      >
        <circle cx="16" cy="12" r="9" />
        <path d="M20.5,4.2C19.2,3.4,17.6,3,16,3s-3.2,0.4-4.5,1.2C14.2,5.8,16,8.7,16,12C16,8.7,17.8,5.8,20.5,4.2z" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="20" cy="12" r="1" />
        <path d="M16.1,21c2.2,2.3,5.4,3.8,8.9,3.8h0V12" />
        <path d="M7,12c0,9,9.7,17,19,17" />
      </g>
    </svg>
  );
}

/** Raster mark — byte-identical to Downloads/owl-svgrepo-com.png when you need a guarantee. */
export function OwlMarkImage({
  size = 32,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const dim =
    style?.width || style?.height
      ? undefined
      : { width: size, height: size };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/owl.png"
      alt=""
      width={typeof style?.width === "number" ? style.width : size}
      height={typeof style?.height === "number" ? style.height : size}
      className={className}
      style={{ display: "block", ...dim, ...style }}
      draggable={false}
    />
  );
}

type LogoProps = {
  size?: number;
  strokeWidth?: number;
  showWordmark?: boolean;
  className?: string;
  href?: string | false;
  /** Use the PNG asset instead of inline SVG. */
  raster?: boolean;
};

export function Logo({
  size = 32,
  strokeWidth,
  showWordmark = true,
  className = "",
  href = "/",
  raster = true,
}: LogoProps) {
  const sw = strokeWidth ?? (size < 40 ? 2.5 : 2);

  const mark = (
    <span className={`inline-flex items-center gap-3 text-[#000000] ${className}`}>
      {raster ? (
        <OwlMarkImage size={size} className="shrink-0" />
      ) : (
        <OwlMark size={size} strokeWidth={sw} className="shrink-0" />
      )}
      {showWordmark ? (
        <span
          className="text-[24px] leading-none tracking-[-0.015em]"
          style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
        >
          Naturalens
        </span>
      ) : (
        <span className="sr-only">Naturalens</span>
      )}
    </span>
  );

  if (href === false) return mark;
  return (
    <Link
      href={href}
      className="inline-flex items-center text-[#000000] no-underline"
      aria-label="Naturalens home"
    >
      {mark}
    </Link>
  );
}
