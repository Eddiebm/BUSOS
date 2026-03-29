import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — BUSOS",
  description: "Your venture dashboard with stress level, Ada, and tasks.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
