"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  ClipboardList,
  User,
  Plus,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "#fab", label: "Add", icon: Plus, isFab: true },
  { href: "/plan", label: "Plan", icon: ClipboardList },
  { href: "/profile", label: "Profile", icon: User },
];

interface BottomNavProps {
  onFabClick?: () => void;
}

export default function BottomNav({ onFabClick }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" id="bottom-nav">
      {/* Blur backdrop */}
      <div className="absolute inset-0 bg-[#0A0A0F]/80 backdrop-blur-xl border-t border-white/[0.06]" />

      <div className="relative max-w-md mx-auto flex items-end justify-around px-2 pb-[env(safe-area-inset-bottom,8px)] pt-1">
        {navItems.map((item) => {
          if (item.isFab) {
            return (
              <button
                key="fab"
                id="fab-add-workout"
                onClick={onFabClick}
                className="relative -mt-5 flex flex-col items-center group"
              >
                <div className="w-14 h-14 rounded-full bg-emerald flex items-center justify-center fab-pulse glow-emerald transition-transform active:scale-90 group-hover:scale-105">
                  <Plus className="w-7 h-7 text-[#0A0A0F] stroke-[2.5]" />
                </div>
              </button>
            );
          }

          const isActive =
            item.href === "/progress"
              ? pathname === item.href || pathname.startsWith("/progress/")
              : pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.label.toLowerCase()}`}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 transition-colors duration-200 ${
                isActive
                  ? "text-emerald"
                  : "text-text-muted hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium tracking-wide">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-0 w-1 h-1 rounded-full bg-emerald" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
