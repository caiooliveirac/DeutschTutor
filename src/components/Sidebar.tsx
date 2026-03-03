"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Home,
  MessageCircle,
  PenTool,
  BookOpen,
  Library,
  AlertCircle,
  TrendingUp,
  GraduationCap,
  Menu,
  X,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProviderPicker } from "./ProviderPicker";
import { LevelPicker } from "./LevelPicker";
import { useLevel } from "./LevelContext";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/chat", label: "Gespräch", icon: MessageCircle },
  { href: "/schreiben", label: "Schreiben", icon: PenTool },
  { href: "/grammatik", label: "Grammatik", icon: BookOpen },
  { href: "/wortschatz", label: "Wortschatz", icon: Library },
  { href: "/fehlertagebuch", label: "Fehler", icon: AlertCircle },
  { href: "/fortschritt", label: "Fortschritt", icon: TrendingUp },
  { href: "/einstellungen", label: "Export", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { level } = useLevel();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const sidebarContent = (
    <>
      {/* Logo area */}
      <div className="flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-lg font-bold text-foreground">DeutschTutor</h1>
            <p className="text-[10px] text-muted-foreground tracking-wider uppercase">
              Goethe {level} Prep
            </p>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setMobileOpen(false)}
          className="p-1.5 rounded-lg hover:bg-accent md:hidden cursor-pointer"
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t pt-3">
        <ProviderPicker />
        <LevelPicker />
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center gap-3 border-b bg-card px-4 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-lg hover:bg-accent cursor-pointer"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <GraduationCap className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm">DeutschTutor</span>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — always visible on md+, slide-in on mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-200 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
