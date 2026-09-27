"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { getStoredUser, fetchCurrentUser, logoutUser, AuthUser } from "../lib/auth";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    async function loadUser() {
      const stored = getStoredUser();
      if (stored) setCurrentUser(stored);
      const remote = await fetchCurrentUser();
      if (remote) setCurrentUser(remote);
    }
    loadUser();
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

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-7 text-sm font-semibold text-slate-600">
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
          {/* ONLY show Dashboard menu if user is authenticated (not a visitor) */}
          {currentUser && (
            <Link
              href="/dashboard"
              className="hover:text-blue-600 transition-colors font-bold text-slate-900"
            >
              Dashboard
            </Link>
          )}
          <Link
            href="/about"
            className="hover:text-blue-600 transition-colors"
          >
            About
          </Link>
        </nav>

        {/* Right Action: User Profile Status OR Login/Register for Visitors */}
        <div className="hidden sm:flex items-center space-x-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-50 transition-all border border-slate-200"
              >
                <img
                  src={
                    currentUser.avatar_url ||
                    `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser.email}`
                  }
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full"
                />
                <div className="text-left pr-2">
                  <div className="text-xs font-bold text-slate-900 leading-none">
                    {currentUser.name.split(" ")[0]}
                  </div>
                  <div className="text-[10px] font-mono uppercase text-blue-600 font-bold leading-none mt-1">
                    {currentUser.role}
                  </div>
                </div>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs text-slate-500 hover:text-rose-600 font-medium px-2 py-1 transition-colors"
              >
                Sign Out
              </button>
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
          {currentUser && (
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-slate-900 font-bold"
            >
              Dashboard
            </Link>
          )}
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-600"
          >
            About
          </Link>
          <div className="pt-2 border-t border-slate-100 flex flex-col space-y-2">
            {currentUser ? (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-center py-2 text-rose-600 font-semibold border border-rose-200 rounded-full"
              >
                Sign Out ({currentUser.name})
              </button>
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
