import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BetterClean Internal Tools",
  description: "Lead intake, scoring, and ops dashboard for BetterClean."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
