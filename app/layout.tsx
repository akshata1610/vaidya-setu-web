import type { Metadata } from "next";
import "./globals.css";
import "./lab-onboarding.css";

export const metadata: Metadata = {
  title: "Vaidya Setu · Review Lab",
  description: "Turn a completed teleconsultation recording or transcript into a medication draft for doctor review.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
