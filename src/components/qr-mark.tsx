import { useEffect, useMemo, useState } from "react";
import { encode } from "uqr";
import { cn } from "@/lib/utils";

export function QrMark({
  href,
  caption,
  className,
}: {
  href: string;
  caption?: string;
  className?: string;
}) {
  const [ready, setReady] = useState(false);

  const path = useMemo(() => {
    if (!href) return "";
    const qr = encode(href, { border: 2, ecc: "M" });
    return qr.data
      .flatMap((row, y) =>
        row.flatMap((on, x) => (on ? [`M${x} ${y}h1v1h-1z`] : [])),
      )
      .join("");
  }, [href]);

  const size = useMemo(() => {
    if (!href) return 0;
    return encode(href, { border: 2, ecc: "M" }).size;
  }, [href]);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready || !href || !path) {
    return (
      <div
        className={cn(
          "flex aspect-square w-28 items-center justify-center rounded-lg bg-accent",
          className,
        )}
      />
    );
  }

  return (
    <figure dir="ltr" className={cn("flex w-28 flex-col items-center gap-2", className)}>
      <div className="rounded-lg bg-accent p-2 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
        <svg viewBox={`0 0 ${size} ${size}`} className="size-24" role="img" aria-label={caption ?? "QR"}>
          <rect width={size} height={size} className="fill-accent" />
          <path d={path} className="fill-bg" />
        </svg>
      </div>
      {caption ? (
        <figcaption className="text-center text-xs leading-snug text-muted">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
