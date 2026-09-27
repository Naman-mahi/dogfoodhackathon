"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo - Just Clean Text DOGFOOD */}
        <Link href="/" className="flex items-center">
          <span className="font-black text-2xl tracking-tight text-slate-900">
            DOGFOOD
          </span>
        </Link>

        {/* Desktop Navigation Links - Clean text without icons */}
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
            href="/about"
            className="hover:text-blue-600 transition-colors"
          >
            About
          </Link>
        </nav>

        {/* Right Action Buttons: Login & Register */}
        <div className="hidden sm:flex items-center space-x-3">
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-700 hover:text-blue-600 px-3.5 py-2 transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="btn-primary text-xs py-2 px-5"
          >
            Register
          </Link>
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
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-600"
          >
            About
          </Link>
          <div className="pt-2 border-t border-slate-100 flex flex-col space-y-2">
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
              className="w-full text-center btn-primary text-xs py-2"
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
