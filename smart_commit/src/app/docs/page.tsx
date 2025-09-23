"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Terminal } from "lucide-react";

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("installation");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll("[data-section]");
      let currentSection = "";

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom >= 100) {
          currentSection = section.getAttribute("data-section") || "";
        }
      });

      if (currentSection && currentSection !== activeSection) {
        setActiveSection(currentSection);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeSection]);

  const navigation = [
    { id: "installation", title: "Installation" },
    { id: "getting-started", title: "Getting Started" },
    { id: "basic-usage", title: "Basic Usage" },
    { id: "dashboard", title: "Dashboard" },
    { id: "cli-commands", title: "CLI Commands" },
    { id: "configuration", title: "Configuration" },
    { id: "troubleshooting", title: "Troubleshooting" },
    { id: "api-usage", title: "API Usage" },
  ];

  const CodeBlock = ({
    children,
    language = "bash",
  }: {
    children: string;
    language?: string;
  }) => (
    <div className="bg-gray-900 text-gray-100 p-3 sm:p-4 rounded-lg overflow-x-auto">
      <pre className="text-xs sm:text-sm whitespace-pre">
        <code>{children}</code>
      </pre>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {/* Header - Replace your existing header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <span className="text-white font-bold text-lg sm:text-xl">
                  <Terminal className="w-5 h-5 text-primary-foreground" />
                </span>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Cmarta Commit
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Documentation
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={
                      isMobileMenuOpen
                        ? "M6 18L18 6M6 6l12 12"
                        : "M4 6h16M4 12h16M4 18h16"
                    }
                  />
                </svg>
              </button>
              {/* Desktop navigation */}
              <div className="hidden sm:flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/auth/signin"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t bg-white">
            <div className="px-4 py-4 space-y-3">
              <Link
                href="/dashboard"
                className="block text-gray-700 hover:text-blue-600 py-2 text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/"
                className="block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 text-center"
              >
                Get Started
              </Link>

              {/* Mobile navigation */}
              <div className="pt-4 border-t space-y-2">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                  Navigation
                </h3>
                {navigation.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    {item.title}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Sidebar Navigation */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <nav className="sticky top-24 space-y-1">
              <div className="pb-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Documentation
                </h2>
                <p className="text-sm text-gray-600">
                  AI-powered commit messages
                </p>
              </div>
              {navigation.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                    activeSection === item.id
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item.title}
                </a>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 max-w-4xl">
            <div className="prose prose-gray max-w-none">
              {/* Hero Section - Replace your existing hero */}
              <div className="mb-8 sm:mb-12">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  Cmarta Commit Documentation
                </h1>
                <p className="text-lg sm:text-xl text-gray-600">
                  AI-powered commit message generator that creates conventional
                  commit messages based on your git changes.
                </p>
              </div>

              {/* Installation */}
              <section
                data-section="installation"
                id="installation"
                className="mb-12"
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Installation
                </h2>

                <div className="mb-8">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                    Prerequisites
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Node.js (version 14 or higher)</li>
                    <li>Git repository</li>
                    <li>Active internet connection</li>
                  </ul>
                </div>

                <div className="mb-8">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                    Install the CLI Tool
                  </h3>
                  <CodeBlock>npm install -g cmarta-commit</CodeBlock>
                </div>

                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Verify Installation
                  </h3>
                  <CodeBlock>cmarta-commit --version</CodeBlock>
                </div>
              </section>

              {/* Getting Started */}
              <section
                data-section="getting-started"
                id="getting-started"
                className="mb-12"
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Getting Started
                </h2>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                      1. Create an Account
                    </h3>
                    <p className="text-gray-700 mb-4">
                      Visit{" "}
                      <Link href="/" className="text-blue-600 hover:underline">
                        Cmarta Commit
                      </Link>{" "}
                      and create an account.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                      2. Generate an API Key
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700">
                      <li>Log into your dashboard</li>
                      <li>Navigate to the "API Keys" section</li>
                      <li>Click "Generate New Key"</li>
                      <li>
                        Copy and save your API key (you won't be able to see it
                        again)
                      </li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                      3. Configure the CLI Tool
                    </h3>
                    <CodeBlock>cmarta-commit setup</CodeBlock>
                    <p className="text-gray-700 mt-4">
                      Enter your API key when prompted. The key will be securely
                      stored in your home directory.
                    </p>
                  </div>
                </div>
              </section>

              {/* Basic Usage */}
              <section
                data-section="basic-usage"
                id="basic-usage"
                className="mb-12"
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Basic Usage
                </h2>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                      Generate AI-Powered Commit Messages
                    </h3>
                    <p className="text-gray-700 mb-4">
                      Navigate to your git repository and stage your changes:
                    </p>
                    <CodeBlock>{`git add .
cmarta-commit`}</CodeBlock>
                    <p className="text-gray-700 mt-4">
                      Or stage and commit in one command:
                    </p>
                    <CodeBlock>cmarta-commit -a</CodeBlock>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                      Interactive Flow
                    </h3>
                    <p className="text-gray-700 mb-4">
                      After running the command, you'll see:
                    </p>
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <pre className="text-sm text-gray-800">{`🤖 Generating commit message...

✨ Generated commit message:
"feat(auth): implement two-factor authentication"

? What would you like to do?
❯ Commit with this message
  Edit the message
  Generate a new message

  Cancel`}</pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                      Command Options
                    </h3>
                    <ul className="space-y-2 text-gray-700">
                      <li>
                        <strong>Commit with this message</strong>: Uses the
                        AI-generated message as-is
                      </li>
                      <li>
                        <strong>Edit the message</strong>: Opens an editor to
                        modify the message
                      </li>
                      <li>
                        <strong>Generate a new message</strong>: Creates a new
                        AI-generated message
                      </li>

                      <li>
                        <strong>Cancel</strong>: Exits without committing
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Dashboard */}
              <section
                data-section="dashboard"
                id="dashboard"
                className="mb-12"
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Dashboard
                </h2>
                <p className="text-gray-700 mb-8">
                  Access your web dashboard at{" "}
                  <Link
                    href="/dashboard"
                    className="text-blue-600 hover:underline"
                  >
                    /dashboard
                  </Link>
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                      Usage Overview
                    </h3>
                    <ul className="space-y-2 text-gray-700">
                      <li>Monthly usage vs. plan limits</li>
                      <li>Success rate percentage</li>
                      <li>All-time API usage</li>
                      <li>Subscription details</li>
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                      Usage Analytics
                    </h3>
                    <ul className="space-y-2 text-gray-700">
                      <li>14-day usage trends</li>
                      <li>Token consumption charts</li>
                      <li>Daily averages</li>
                      <li>Request/Token view toggle</li>
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                      API Key Management
                    </h3>
                    <ul className="space-y-2 text-gray-700">
                      <li>Generate new API keys</li>
                      <li>View creation dates</li>
                      <li>Last usage tracking</li>
                      <li>Secure key display</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* CLI Commands */}
              <section
                data-section="cli-commands"
                id="cli-commands"
                className="mb-12"
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
                  CLI Commands Reference
                </h2>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                      Core Commands
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <CodeBlock>{`# Setup API key
cmarta-commit setup

# Generate and commit (interactive)
cmarta-commit

# Auto-stage and generate commit
cmarta-commit -a
cmarta-commit --all

# Auto-commit without confirmation
cmarta-commit -y
cmarta-commit --auto

# Combine options
cmarta-commit -a -y`}</CodeBlock>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                      Help and Information
                    </h3>
                    <CodeBlock>{`# Show version
cmarta-commit --version

# Show help
cmarta-commit --help`}</CodeBlock>
                  </div>
                </div>
              </section>

              {/* Configuration */}
              <section
                data-section="configuration"
                id="configuration"
                className="mb-12"
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Configuration
                </h2>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                      Config File Location
                    </h3>
                    <p className="text-gray-700 mb-4">
                      The CLI stores configuration in:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>
                        <strong>Linux/macOS</strong>:{" "}
                        <code className="bg-gray-100 px-2 py-1 rounded">
                          ~/.cmarta-commit-config.json
                        </code>
                      </li>
                      <li>
                        <strong>Windows</strong>:{" "}
                        <code className="bg-gray-100 px-2 py-1 rounded">
                          %USERPROFILE%\.cmarta-commit-config.json
                        </code>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                      Config Structure
                    </h3>
                    <CodeBlock language="json">{`{
  "apiKey": "sk_your_api_key_here"
}`}</CodeBlock>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                      Updating Configuration
                    </h3>
                    <p className="text-gray-700 mb-4">
                      Re-run setup to update your API key:
                    </p>
                    <CodeBlock>cmarta-commit setup</CodeBlock>
                  </div>
                </div>
              </section>

              {/* Troubleshooting */}
              <section
                data-section="troubleshooting"
                id="troubleshooting"
                className="mb-12"
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Troubleshooting
                </h2>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                      Common Issues
                    </h3>
                    <div className="space-y-6">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                        <h4 className="font-semibold text-red-800 mb-2 text-sm sm:text-base">
                          "Not a git repository"
                        </h4>
                        <CodeBlock>git init</CodeBlock>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                        <h4 className="font-semibold text-yellow-800 mb-2 text-sm sm:text-base">
                          "No staged changes found"
                        </h4>
                        <CodeBlock>{`# Stage your changes first
git add .
# Or use the auto-stage flag
cmarta-commit -a`}</CodeBlock>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                        <h4 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">
                          "Invalid API key"
                        </h4>
                        <CodeBlock>cmarta-commit setup</CodeBlock>
                      </div>

                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4">
                        <h4 className="font-semibold text-orange-800 mb-2 text-sm sm:text-base">
                          "Rate limit exceeded"
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-orange-700 mt-2">
                          <li>Check your usage in the dashboard</li>
                          <li>Consider upgrading your plan</li>

                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* API Usage */}
              <section
                data-section="api-usage"
                id="api-usage"
                className="mb-12"
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
                  API Usage
                </h2>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                      Understanding Usage Limits
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <h4 className="font-semibold text-green-800 mb-3">
                          Free Plan
                        </h4>
                        <ul className="space-y-2 text-green-700">
                          <li>100 requests per month</li>
                          <li>Basic usage analytics</li>
                          <li>Standard support</li>
                        </ul>
                      </div>

                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                        <h4 className="font-semibold text-purple-800 mb-3">
                          Pro Plan
                        </h4>
                        <ul className="space-y-2 text-purple-700">
                          <li>1,000 requests per month</li>
                          <li>Advanced analytics</li>
                          <li>Priority support</li>
                          <li>Early access to features</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                      Optimizing Usage
                    </h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h4 className="font-semibold text-blue-800 mb-3">
                        Best Practices
                      </h4>
                      <ul className="space-y-2 text-blue-700">

                        <li>
                          <strong>Stage Relevant Changes</strong>: Only stage
                          files you want to commit
                        </li>
                        <li>
                          <strong>Batch Related Changes</strong>: Group related
                          changes in single commits
                        </li>
                        <li>
                          <strong>Review Generated Messages</strong>: AI
                          suggestions may need minor adjustments
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* Footer */}
              <div className="mt-16 pt-8 border-t border-gray-200">
                <div className="text-center text-gray-600">
                  <p className="mb-4">
                    Need help? Visit your{" "}
                    <Link
                      href="/dashboard"
                      className="text-blue-600 hover:underline"
                    >
                      dashboard
                    </Link>{" "}
                    or contact support.
                  </p>
                  <p className="text-sm">
                    Version 1.0.0 | Last Updated: December 2024
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
