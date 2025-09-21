import { Button } from "../components/ui/button";
import { Terminal, Download, BarChart3 } from "lucide-react";
import heroTerminalImage from "../assets/hero-terminal.png";
import Image from "next/image";
import Link from "next/link";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden px-6 sm:px-12 lg:px-24">
      {/* Background glow effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-primary/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto py-16 sm:py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side - Content */}
          <div className="space-y-6 sm:space-y-8">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold leading-snug sm:leading-tight">
              Productivity
              <span className="bg-gradient-primary bg-clip-text text-transparent block">
                AI Commits & Code Analytics
              </span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-full lg:max-w-2xl">
              All-in-one CLI & dashboard for developers and teams. Instantly generate conventional commit messages, track your commit quality, and unlock actionable insights into your codebase—all seamlessly integrated with GitHub.
            </p>

            {/* Bullet Points */}
            <div className="space-y-2 sm:space-y-3">
              {[
                "AI-powered commit messages from staged changes",
                "Auto-score commit quality & spot trends",
                "Track productivity with detailed analytics",
                "Sync your GitHub repos for instant insights",
                "Works with your workflow (git add → cmarta-commit → git push)",
                "50 free commits included",
              ].map((point, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 sm:space-x-3"
                >
                  <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0"></div>
                  <span className="text-sm sm:text-base text-muted-foreground">
                    {point}
                  </span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
              <Link href="/docs">
              <Button className="btn-hero group w-full sm:w-auto">
                <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:scale-110 transition-transform" />
                Install Cmarta-commit
              </Button>
              </Link>
              <Link href="/auth/signin">
              <Button
                variant="secondary"
                className="btn-hero group w-full sm:w-auto"
              >
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:scale-110 transition-transform" />
                View Analytics Demo
              </Button>
              </Link>
            </div>
          </div>

          {/* Right side - Terminal Demo */}
          <div className="relative w-full max-w-full sm:max-w-md lg:max-w-none mx-auto">
            <div className="absolute -inset-3 sm:-inset-4 bg-gradient-primary rounded-2xl blur opacity-20 animate-pulse"></div>
            <div className="relative">
              <Image
                src={heroTerminalImage}
                alt="Cmarta-commit terminal demonstration showing AI-generated commit messages and analytics dashboard"
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