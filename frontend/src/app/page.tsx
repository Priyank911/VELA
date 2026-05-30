"use client";

import { useVelaStore } from "@/store/useVelaStore";
import LandingPage from "@/components/LandingPage";
import AppShell from "@/components/AppShell";

export default function Home() {
  const currentView = useVelaStore((s) => s.currentView);
  return currentView === "landing" ? <LandingPage /> : <AppShell />;
}
