import { Button } from "../components/ui/button";
import { Terminal, Download, Play } from "lucide-react";
import heroTerminalImage from "../assets/hero-terminal.png";
import Image from "next/image";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden px-24">
      {/* Background glow effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Content */}
          <div className="space-y-8">
            <div className="flex items-center space-x-3 text-accent">
              <Terminal className="w-6 h-6" />
              <span className="text-sm font-medium tracking-wide uppercase">Smart Commit CLI</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              AI-Generated
              <span className="bg-gradient-primary bg-clip-text text-transparent block">
                Commit Messages
              </span>
              from Your Code Changes
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
              CLI tool for developers who want consistent, conventional commit messages without the manual effort.
              Analyzes your staged changes and generates proper commits automatically - no API keys required.
            </p>

            {/* Bullet Points */}
            <div className="space-y-4">
              {[
                "Generates conventional commits from git diffs",
                "Works with existing workflow (git add → smart-commit)",
                "AI-powered - no setup required",
                "50 free commits included"
              ].map((point, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <span className="text-muted-foreground">{point}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button className="btn-hero group">
                <Download className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Install Smart Commit
              </Button>
              <Button variant="outline" className="btn-outline-hero group">
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                View Demo
              </Button>
            </div>
          </div>

          {/* Right side - Terminal Demo */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-primary rounded-2xl blur opacity-20 animate-pulse"></div>
            <div className="relative">
              <Image
                src={heroTerminalImage}
                alt="Smart Commit terminal demonstration showing AI-generated commit messages"
                className="w-full rounded-xl shadow-elegant hover-lift"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;