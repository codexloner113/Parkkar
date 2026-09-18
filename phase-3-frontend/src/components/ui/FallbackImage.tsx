"use client";
import { useState, type ReactNode } from "react";

/**
 * Mall/parking photos in src/data/parkkarData.ts are hotlinked from third-party
 * sites. A bare <img src=...> shows the browser's broken-image icon if the
 * link 404s or the host blocks hotlinking — which reads as "unfinished UI",
 * exactly what the product spec says to avoid. This swaps to the caller's
 * fallback the moment the image fails to load, instead of showing a
 * fake/placeholder photo pretending to be the real property.
 */
export function FallbackImage({
  src,
  alt,
  className,
  fallback,
}: {
  src?: string;
  alt: string;
  className?: string;
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <>{fallback}</>;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
