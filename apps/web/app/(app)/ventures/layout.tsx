import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ventures — BUSOS",
  description: "Create and manage your ventures.",
};

export default function VenturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
