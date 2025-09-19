import { Button } from "../components/ui/button";
import { Check, Zap, Crown } from "lucide-react";
import Link from "next/link";

const PricingSection = () => {
  const plans = [
    {
      name: "Free",
      icon: Zap,
      price: "$0",
      period: "/month",
      description:
        "Get started with AI-powered productivity & commit analytics",
      features: [
        "50 commits/month",
        "AI-powered messages",
        "Commit quality scoring",
        "Productivity dashboard (basic)",
        "No setup required",
      ],
      cta: "Get Started Free",
      popular: false,
    },
    {
      name: "Pro",
      icon: Crown,
      price: "$9.99",
      period: "/month",
      description:
        "Unlock advanced analytics & unlimited productivity features",
      features: [
        "Unlimited commits",
        "Advanced AI models",
        "Custom commit templates",
        "Productivity analytics (full)",
        "Commit history insights",
        "Priority support",
      ],
      cta: "Upgrade to Pro",
      popular: true,
    },
  ];

  return (
    <section className="py-20 bg-card/50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">
            Simple, Developer-Centric Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start for free and unlock powerful productivity and analytics
            features as you grow. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`card-gradient p-8 relative hover-lift ${
                plan.popular
                  ? "ring-2 ring-blue-500/60 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <plan.icon className="w-8 h-8 text-primary-foreground" />
                </div>

                <h3 className="text-2xl font-semibold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground mb-4">{plan.description}</p>

                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-1">
                    {plan.period}
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <div
                    key={featureIndex}
                    className="flex items-center space-x-3"
                  >
                    <Check className="w-5 h-5 text-accent flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                href={plan.name === "Free" ? "/auth/signin" : "/upgrade"}
                passHref
                className="block"
              >
                <Button
                  className={
                    plan.popular ? "btn-hero w-full" : "btn-outline-hero w-full"
                  }
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            All plans include our core AI technology, productivity dashboard,
            and support.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
