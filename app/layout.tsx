import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vaidya Setu · Review Lab",
  description: "Recorded consultations, reviewed medication instructions and a private evaluation history.",
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
