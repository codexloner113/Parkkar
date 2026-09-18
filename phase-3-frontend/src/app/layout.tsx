import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "./providers";
import { GoogleMapsLoader } from "@/components/layout/GoogleMapsLoader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Parkkar — Smart parking, without the friction",
    template: "%s · Parkkar",
  },
  description: "Discover, reserve, and manage parking with Parkkar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen">
        <Providers>{children}</Providers>

        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />

        <GoogleMapsLoader apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY} />
      </body>
    </html>
  );
}