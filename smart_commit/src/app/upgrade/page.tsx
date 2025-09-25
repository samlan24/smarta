"use client";
import { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Check,
  ArrowLeft,
  Star,
  Zap,
  Sparkle,
  Clock,
  BarChart3,
  Headphones,
} from "lucide-react";
import Link from "next/link";

export default function UpgradePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpgradeClick = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: "pro",
        }),
      });

      const { checkoutUrl } = await response.json();

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: BarChart3,
      title: "Full Commit Analytics",
      description: "Visualize your commit quality, productivity trends, and codebase health with an interactive dashboard.",
    },
    {
      icon: Sparkle,
      title: "Advanced AI Commit Generation",
      description: "Unlock smarter, more contextual commit messages tailored to your workflow and project.",
    },
    {
      icon: Clock,
      title: "No Limits, No Waiting",
      description: "Unlimited AI commits and instant access—no quotas or throttling.",
    },
    {
      icon: Headphones,
      title: "Priority Support",
      description: "Get faster responses from our support team when you need help or have questions.",
    },
  ];

  const comparisonFeatures = [
    { feature: "Monthly AI commits", free: "50", pro: "Unlimited" },
    { feature: "AI message quality", free: "Standard", pro: "Advanced" },
    { feature: "Commit quality scoring", free: "✓", pro: "✓" },
    { feature: "Productivity dashboard", free: "Basic", pro: "Full access" },
    { feature: "Custom commit templates", free: "✗", pro: "✓" },
    { feature: "Priority support", free: "✗", pro: "✓" },
    { feature: "Setup required", free: "✗", pro: "✗" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-6 py-12">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Upgrade to <span className="text-primary">Pro</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Unlock the full power of Cmarta-commit: AI-driven productivity, insightful analytics, and unlimited commit generations—designed for professional developers.
            </p>
          </div>

          {/* Pricing Card */}
          <Card className="p-8 mb-12 text-center border-2 border-primary/20 bg-gradient-to-b from-background to-primary/5">
            <div className="mb-6">
              <div className="text-5xl font-bold text-foreground mb-2">$7.99</div>
              <div className="text-muted-foreground">per month</div>
              <div className="text-sm text-primary font-medium mt-2">
                Cancel anytime
              </div>
            </div>

            <Button
              onClick={handleUpgradeClick}
              disabled={loading}
              className="btn-hero text-lg px-8 py-6 h-auto mb-4"
              size="lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                "Start Pro Subscription"
              )}
            </Button>

            <p className="text-sm text-muted-foreground">
              Secure checkout powered by Lemon Squeezy
            </p>
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
          </Card>

          {/* Features Grid */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center mb-8 text-foreground">
              Everything you need to boost your commit workflow
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="p-6 border-border/50">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Comparison Table */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center mb-8 text-foreground">
              Free vs Pro Comparison
            </h2>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left p-4 font-medium text-muted-foreground">
                        Feature
                      </th>
                      <th className="text-center p-4 font-medium text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <Star className="w-4 h-4" />
                          Free
                        </div>
                      </th>
                      <th className="text-center p-4 font-medium text-primary">
                        <div className="flex items-center justify-center gap-2">
                          <Zap className="w-4 h-4" />
                          Pro
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((item, index) => (
                      <tr
                        key={index}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="p-4 font-medium text-foreground">
                          {item.feature}
                        </td>
                        <td className="p-4 text-center text-muted-foreground">
                          {item.free}
                        </td>
                        <td className="p-4 text-center text-primary font-medium">
                          {item.pro}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Final CTA */}
          <Card className="p-8 text-center bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              Ready to supercharge your productivity?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join developers who use Cmarta-commit Pro to automate high-quality commits and unlock actionable insights into their workflow.
            </p>
            <Button
              onClick={handleUpgradeClick}
              disabled={loading}
              className="btn-hero px-8 py-3 h-auto"
              size="lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                "Upgrade Now - $7.99/month"
              )}
            </Button>
            <p className="text-sm text-muted-foreground mt-3">
              • Cancel anytime
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}