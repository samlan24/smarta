"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("installation");

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
    { id: "template-system", title: "Template System" },
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
    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
      <code>{children}</code>
    </pre>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <span className="text-white font-bold text-xl">SC</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Cmarta Commit
                </h1>
                <p className="text-sm text-gray-600">Documentation</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <nav className="sticky top-24 space-y-1">
              <div className="pb-4">
                <h2 className="text-lg font-semibold text-gray-900">
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
              {/* Hero Section */}
              <div className="mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  Cmarta Commit Documentation
                </h1>
                <p className="text-xl text-gray-600">
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
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Installation
                </h2>

                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Prerequisites
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Node.js (version 14 or higher)</li>
                    <li>Git repository</li>
                    <li>Active internet connection</li>
                  </ul>
                </div>

                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
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
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Getting Started
                </h2>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
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
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
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
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
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
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Basic Usage
                </h2>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
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
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
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
  Save as template
  Cancel`}</pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
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
                        <strong>Save as template</strong>: Saves the message for
                        future reuse
                      </li>
                      <li>
                        <strong>Cancel</strong>: Exits without committing
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Template System */}
              <section
                data-section="template-system"
                id="template-system"
                className="mb-12"
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Template System
                </h2>
                <p className="text-gray-700 mb-8">
                  Templates allow you to save frequently used commit messages
                  for instant reuse, saving API usage and time.
                </p>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      Save a Template
                    </h3>
                    <p className="text-gray-700 mb-4">
                      During the commit flow, select "Save as template" and
                      provide a name:
                    </p>
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <pre className="text-sm text-gray-800">{`? Enter template name: api-fix
✅ Template "api-fix" saved!`}</pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      List Your Templates
                    </h3>
                    <CodeBlock>cmarta-commit templates</CodeBlock>
                    <p className="text-gray-700 mt-4">Output:</p>
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <pre className="text-sm text-gray-800">{`📋 Saved Templates:
  api-fix: fix: resolve API validation error
  feature-add: feat: add new user endpoint
  hotfix: fix: critical security patch`}</pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      Use a Template
                    </h3>
                    <CodeBlock>cmarta-commit use-template api-fix</CodeBlock>
                    <p className="text-gray-700 mt-4">This will:</p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-700 mt-2">
                      <li>Stage your changes (if needed)</li>
                      <li>Use the saved template message</li>
                      <li>Prompt for confirmation</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      Quick Template Commit
                    </h3>
                    <p className="text-gray-700 mb-4">
                      Auto-commit with a template:
                    </p>
                    <CodeBlock>cmarta-commit use-template api-fix -y</CodeBlock>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      Delete a Template
                    </h3>
                    <CodeBlock>cmarta-commit delete-template api-fix</CodeBlock>
                  </div>
                </div>
              </section>

              {/* Dashboard */}
              <section
                data-section="dashboard"
                id="dashboard"
                className="mb-12"
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
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
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
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
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      API Key Management
                    </h3>
                    <ul className="space-y-2 text-gray-700">
                      <li>Generate new API keys</li>
                      <li>View creation dates</li>
                      <li>Last usage tracking</li>
                      <li>Secure key display</li>
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Template Management
                    </h3>
                    <ul className="space-y-2 text-gray-700">
                      <li>Create and edit templates</li>
                      <li>Quick copy to clipboard</li>
                      <li>Usage statistics</li>
                      <li>Template organization</li>
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
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  CLI Commands Reference
                </h2>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
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
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      Template Commands
                    </h3>
                    <CodeBlock>{`# List all templates
cmarta-commit templates

# Use a specific template
cmarta-commit use-template <name>

# Use template with auto-commit
cmarta-commit use-template <name> -y

# Delete a template
cmarta-commit delete-template <name>`}</CodeBlock>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
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
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Configuration
                </h2>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
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
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      Config Structure
                    </h3>
                    <CodeBlock language="json">{`{
  "apiKey": "sk_your_api_key_here"
}`}</CodeBlock>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
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
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Troubleshooting
                </h2>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      Common Issues
                    </h3>
                    <div className="space-y-6">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="font-semibold text-red-800 mb-2">
                          "Not a git repository"
                        </h4>
                        <CodeBlock>git init</CodeBlock>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-800 mb-2">
                          "No staged changes found"
                        </h4>
                        <CodeBlock>{`# Stage your changes first
git add .
# Or use the auto-stage flag
cmarta-commit -a`}</CodeBlock>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-800 mb-2">
                          "Invalid API key"
                        </h4>
                        <CodeBlock>cmarta-commit setup</CodeBlock>
                      </div>

                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <h4 className="font-semibold text-orange-800 mb-2">
                          "Rate limit exceeded"
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-orange-700 mt-2">
                          <li>Check your usage in the dashboard</li>
                          <li>Consider upgrading your plan</li>
                          <li>Use templates for routine commits</li>
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
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  API Usage
                </h2>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      Understanding Usage Limits
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      Optimizing Usage
                    </h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h4 className="font-semibold text-blue-800 mb-3">
                        Best Practices
                      </h4>
                      <ul className="space-y-2 text-blue-700">
                        <li>
                          <strong>Use Templates</strong>: Save common patterns
                          as templates
                        </li>
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
