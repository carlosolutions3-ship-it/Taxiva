import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taxiva — AI tax assistant for the US and Philippines",
  description:
    "Upload documents, get an AI-drafted tax estimate, and prepare your filing — for the United States and the Philippines. Sandbox/demo build.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
