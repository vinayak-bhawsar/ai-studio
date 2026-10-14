import { Metadata } from "next";
import { ReactNode } from "react";
import { AppShell } from "@/src/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Dashboard - AI Video Studio",
  description: "Manage your cinematic projects and AI video production studio workspace.",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
