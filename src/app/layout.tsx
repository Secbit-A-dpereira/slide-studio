import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slide Studio",
  description: "Create and edit presentation slides with AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}