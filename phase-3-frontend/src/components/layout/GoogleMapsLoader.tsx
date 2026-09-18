"use client";

import Script from "next/script";

/**
 * next/script's onLoad/onReady/onError callbacks are only valid when the
 * <Script> element itself is rendered from inside a Client Component tree.
 * RootLayout (src/app/layout.tsx) is a Server Component, so an inline
 * `onLoad={() => ...}` closure passed there throws at runtime:
 * "Event handlers cannot be passed to Client Component props."
 * That error only surfaces once NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is actually
 * set, which is why it was easy to miss in a key-less dev environment.
 *
 * Isolating the script + handler in this small client component fixes it:
 * the server layout only ever passes the plain string `apiKey` prop, which
 * is serializable, and this component owns the closure itself.
 */
export function GoogleMapsLoader({ apiKey }: { apiKey?: string }) {
  if (!apiKey) return null;

  return (
    <Script
      src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`}
      strategy="afterInteractive"
      onLoad={() => {
        window.dispatchEvent(new Event("parkkar-google-maps-ready"));
      }}
    />
  );
}
