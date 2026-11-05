import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bug Bounty Ledger",
  description: "Automated Bug Bounty Vulnerability Patch & Payout Ledger (DBMS Level 3, Team 11)",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
