"use client";
import { Button } from "../components/ui/button";
import { Terminal, Menu, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Docs", href: "#docs" },
  ];

  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-lg border-b border-border z-50 px-6 sm:px-12 lg:px-24">
      <div className="container mx-auto flex items-center justify-between h-16">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Terminal className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Smarta</span>
        </div>

        {/* Desktop Navigation + CTA */}
        <div className="hidden md:flex items-center space-x-8">
          {/* Navigation links */}
          <div className="flex items-center space-x-6">
            {navItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center space-x-4">
            <Link href="/auth/signin">
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
            >
              Sign in
            </Button>
            </Link>
            <Button className="btn-hero">Install Now</Button>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden py-4 border-t border-border bg-background/90 backdrop-blur-md">
          <div className="flex flex-col space-y-4">
            {navItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="flex flex-col space-y-2 px-4 pt-4">
              <Link href="/auth/signin">
              <Button variant="ghost" className="justify-start">
                Sign in
              </Button>
              </Link>
              <Button className="btn-hero justify-start">Install Now</Button>

            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
