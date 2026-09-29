"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  Sparkles,
  LayoutDashboard,
  Calendar,
  FolderGit2,
  Trophy,
  Info,
  BadgeCheck,
  Users,
  CheckCircle2,
  Shield,
  Settings,
  Activity,
} from "lucide-react";
import { AuthUser, getStoredUser, fetchCurrentUser } from "@/lib/auth";
import UserAccountCard from "./UserAccountCard";

interface NavLinkItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Initial cached user from localStorage
    const local = getStoredUser();
    if (local) setCurrentUser(local);

    // 2. Fetch authenticated user from backend
    fetchCurrentUser().then((remote) => {
      if (remote) {
        setCurrentUser(remote);
      } else if (!local) {
        setCurrentUser(null);
      }
    });

    // 3. Listen to local storage & in-app auth change events
    const onAuthChange = (e: any) => {
      if (e.detail) {
        setCurrentUser(e.detail);
      } else {
        const u = getStoredUser();
        setCurrentUser(u);
      }
    };

    const onStorage = () => {
      const u = getStoredUser();
      setCurrentUser(u);
    };

    window.addEventListener("dogfood_auth_change", onAuthChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("dogfood_auth_change", onAuthChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [pathname]);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setUserDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [pathname]);

  // Check if current page features a dashboard sidebar
  const isSidebarPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/manage-") ||
    pathname.startsWith("/hackathon-") ||
    pathname.startsWith("/admin") ||
    pathname === "/events/new";

  // Dynamic role-based links:
  // - When the sidebar is present (or user is Organizer, Judge, or Admin), the top header navbar
  //   strictly has NO center navigation items. The dark sidebar handles all console navigation.
  // - Public / Unauthenticated: [Hackathons, Projects, Leaderboard, About]
  // - Authenticated Participant: [My Workspace, Browse Hackathons, Projects, Leaderboard, Certificates]
  const getNavLinks = (user: AuthUser | null): NavLinkItem[] => {
    if (
      isSidebarPage ||
      user?.role === "organizer" ||
      user?.role === "judge" ||
      user?.role === "admin"
    ) {
      return [];
    }

    if (!user) {
      return [
        { href: "/hackathons", label: "Hackathons", icon: <Calendar className="w-3.5 h-3.5" /> },
        { href: "/projects", label: "Projects", icon: <FolderGit2 className="w-3.5 h-3.5" /> },
        { href: "/results", label: "Leaderboard", icon: <Trophy className="w-3.5 h-3.5" /> },
        { href: "/about", label: "About", icon: <Info className="w-3.5 h-3.5" /> },
      ];
    }

    // Default: Authenticated Participant on public pages
    return [
      {
        href: "/dashboard",
        label: "My Workspace",
        icon: <LayoutDashboard className="w-3.5 h-3.5 text-emerald-600" />,
      },
      {
        href: "/hackathons",
        label: "Browse Hackathons",
        icon: <Calendar className="w-3.5 h-3.5" />,
      },
      {
        href: "/projects",
        label: "Projects",
        icon: <FolderGit2 className="w-3.5 h-3.5" />,
      },
      {
        href: "/results",
        label: "Leaderboard",
        icon: <Trophy className="w-3.5 h-3.5" />,
      },
      {
        href: "/certificates",
        label: "Certificates",
        icon: <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />,
      },
    ];
  };

  const navLinks = getNavLinks(currentUser);

  if (pathname.startsWith("/embed")) {
    return null;
  }

  const getRoleRingClass = (role?: string) => {
    if (role === "admin") return "ring-purple-600 text-purple-700 bg-purple-100";
    if (role === "organizer") return "ring-purple-400/40 text-purple-600 bg-purple-50";
    if (role === "judge") return "ring-blue-400/40 text-blue-600 bg-blue-50";
    return "ring-emerald-400/40 text-emerald-600 bg-emerald-50";
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-black text-2xl tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
            DOGFOOD
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold border border-slate-200/80">
            <Sparkles className="w-2.5 h-2.5 text-blue-600" />
            Portal
          </span>
        </Link>

        {/* Desktop Nav Links with Active UI/UX Pills */}
        {navLinks.length > 0 && (
          <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "text-blue-600 bg-blue-50/80 font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
                {link.badge && (
                  <span
                    className={`ml-1 text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded-md border ${
                      link.badgeColor || "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 ml-0.5" />
                )}
              </Link>
            );
          })}
        </nav>
        )}

        {/* Right Section: User Profile Dropdown or Auth Buttons */}
        <div className="flex items-center space-x-3">
          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              {/* Trigger Button */}
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className={`flex items-center gap-2.5 p-1.5 pr-3 rounded-full hover:bg-slate-50 transition-all border ${
                  userDropdownOpen
                    ? "border-blue-500/50 bg-blue-50/30"
                    : "border-slate-200"
                } cursor-pointer`}
                aria-expanded={userDropdownOpen}
                aria-label="User Account Menu"
              >
                <img
                  src={
                    currentUser.avatar_url ||
                    `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser.email}`
                  }
                  alt={currentUser.name}
                  className={`w-7 h-7 rounded-full ring-2 ${getRoleRingClass(
                    currentUser.role
                  )} object-cover`}
                />
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900 leading-none truncate max-w-[110px]">
                    {currentUser.name.split(" ")[0]}
                  </div>
                  <div className="text-[10px] font-mono uppercase font-bold leading-none mt-1 text-slate-500">
                    {currentUser.role}
                  </div>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    userDropdownOpen ? "rotate-180 text-blue-600" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu — Reusing UserAccountCard */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <UserAccountCard
                    user={currentUser}
                    onCloseDropdown={() => setUserDropdownOpen(false)}
                    variant="dropdown"
                  />
                </div>
              )}
            </div>
          ) : !isSidebarPage ? (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="text-xs font-semibold text-slate-700 hover:text-blue-600 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="btn-primary text-xs py-2 px-4 shadow-sm"
              >
                Register
              </Link>
            </div>
          ) : null}
        </div>

        {/* Mobile Menu Hamburger Button */}
        {navLinks.length > 0 && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-slate-600 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation menu"
            type="button"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-100 bg-white px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold ${
                    isActive
                      ? "text-blue-600 bg-blue-50 font-bold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {link.icon}
                    <span>{link.label}</span>
                  </div>
                  {link.badge && (
                    <span
                      className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-md border ${
                        link.badgeColor || "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="pt-2 border-t border-slate-100">
            {currentUser ? (
              <UserAccountCard
                user={currentUser}
                onCloseDropdown={() => setMobileMenuOpen(false)}
                variant="dropdown"
              />
            ) : (
              <div className="flex flex-col space-y-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
