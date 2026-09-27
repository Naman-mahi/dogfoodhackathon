"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X, User, Settings, LayoutDashboard, LogOut, ChevronDown } from "lucide-react";
import { getStoredUser, fetchCurrentUser, logoutUser, AuthUser } from "../lib/auth";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadUser() {
      const stored = getStoredUser();
      if (stored) setCurrentUser(stored);
      const remote = await fetchCurrentUser();
      if (remote) setCurrentUser(remote);
    }
    loadUser();

    // Close dropdown on outside click
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-black text-2xl tracking-tight text-slate-900">
            DOGFOOD
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
            Portal
          </span>
        </Link>

        {/* Desktop Navigation Links - NO Dashboard link in header per user instruction */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
          <Link
            href="/hackathons"
            className="hover:text-blue-600 transition-colors"
          >
            Hackathons
          </Link>
          <Link
            href="/projects"
            className="hover:text-blue-600 transition-colors"
          >
            Projects
          </Link>
          <Link
            href="/results"
            className="hover:text-blue-600 transition-colors"
          >
            Leaderboard
          </Link>
          <Link
            href="/about"
            className="hover:text-blue-600 transition-colors"
          >
            About
          </Link>
        </nav>

        {/* Right Action: User Dropdown OR Login/Register for Visitors */}
        <div className="hidden sm:flex items-center space-x-3">
          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full hover:bg-slate-50 transition-all border border-slate-200"
              >
                <img
                  src={
                    currentUser.avatar_url ||
                    `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser.email}`
                  }
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full bg-slate-100"
                />
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900 leading-none">
                    {currentUser.name.split(" ")[0]}
                  </div>
                  <div className="text-[10px] font-mono uppercase text-blue-600 font-bold leading-none mt-1">
                    {currentUser.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Settings Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{currentUser.email}</p>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-purple-600" />
                    Role Dashboard
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-blue-600" />
                    Profile Settings
                  </Link>

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-slate-700 hover:text-blue-600 px-3 py-1.5 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="btn-primary text-xs py-2 px-4"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-slate-600 hover:text-slate-900 p-2"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-100 bg-white px-4 pt-2 pb-4 space-y-2 text-sm font-semibold">
          <Link
            href="/hackathons"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-600"
          >
            Hackathons
          </Link>
          <Link
            href="/projects"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-600"
          >
            Projects
          </Link>
          <Link
            href="/results"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-600"
          >
            Leaderboard
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-600"
          >
            About
          </Link>

          <div className="pt-2 border-t border-slate-100 flex flex-col space-y-2">
            {currentUser ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-purple-700 font-semibold border border-purple-200 rounded-full"
                >
                  Dashboard ({currentUser.role})
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-slate-700 font-semibold border border-slate-200 rounded-full"
                >
                  Profile Settings
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-center py-2 text-rose-600 font-semibold border border-rose-200 rounded-full"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-slate-700 font-semibold border border-slate-200 rounded-full"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-white bg-slate-900 font-semibold rounded-full"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
