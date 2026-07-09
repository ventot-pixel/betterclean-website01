import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BetterClean CRM V1",
  description: "Internal CRM for BetterClean leads, quotes, jobs, and invoices."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
