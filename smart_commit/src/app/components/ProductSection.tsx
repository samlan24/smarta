import { Button } from "../components/ui/button";
import { Terminal, Download, BarChart3, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "1",
    command: "git add src/auth.js",
    description: "Stage your changes",
  },
  {
    number: "2",
    command: "cmarta-commit",
    description: "AI analyzes your diff, suggests a commit message, and scores quality",
  },
  {
    number: "3",
    command: "✅ feat: add user auth",
    description: "Review, commit, and sync analytics to your dashboard",
  },
];

const features = [
  {
    icon: BarChart3,
    title: "Productivity Analytics",
    description:
      "Track your commit quality, frequency, and workflow trends over time. Spot bottlenecks and improve your code health.",
  },
  {
    icon: Terminal,
    title: "CLI & Dashboard",
    description:
      "Seamlessly integrates with your git workflow and provides a beautiful dashboard for repo insights and team analytics.",
  },
];

const ProductSection = () => (
  <section className="py-16 sm:py-20 bg-background px-6 sm:px-12 lg:px-24">
    <div className="container mx-auto">
      {/* Product Introduction */}
      <div className="text-center mb-12 sm:mb-16 space-y-4 sm:space-y-6">
        <div className="inline-flex items-center space-x-2 sm:space-x-3 bg-card rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mx-auto mb-4 sm:mb-6">
          <Terminal className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
          <span className="text-sm sm:text-base font-medium text-muted-foreground">
            Introducing Cmarta-commit
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-4xl font-bold mb-2 sm:mb-6">
          AI Commit Messages, Analytics & Code Quality Insights
        </h2>

        <p className="text-base sm:text-lg text-muted-foreground max-w-full sm:max-w-3xl mx-auto mb-6 sm:mb-8 leading-relaxed">
          Cmarta-commit is more than a commit message generator. Get instant, conventional commits, automated commit quality scoring, and a powerful dashboard to visualize your productivity and codebase health.
        </p>
      </div>

      {/* Feature Highlights */}
      <div className="flex flex-col md:flex-row gap-6 sm:gap-8 justify-center mb-12 sm:mb-16">
        {features.map((feature, idx) => (
          <div
            key={feature.title}
            className="flex-1 bg-card rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center card-gradient hover-lift"
          >
            <feature.icon className="w-8 h-8 sm:w-10 sm:h-10 text-primary mb-3 sm:mb-4" />
            <h4 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">{feature.title}</h4>
            <p className="text-sm sm:text-base text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* 3-Step Process */}
      <div className="mb-12 sm:mb-16">
        <h3 className="text-2xl font-semibold text-center mb-8 sm:mb-12">
          How It Works
        </h3>
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-8">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col md:flex-row items-center">
              <div className="text-center mb-4 md:mb-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-glow">
                  <span className="text-xl sm:text-2xl font-bold text-primary-foreground">
                    {step.number}
                  </span>
                </div>
                <div className="code-block mb-2 text-left">
                  <code className="text-accent text-sm sm:text-base">
                    {step.command}
                  </code>
                </div>
                <p className="text-muted-foreground text-sm sm:text-base">
                  {step.description}
                </p>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground/50 mx-auto md:mx-4 hidden md:block" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Installation */}
      <div className="bg-card rounded-2xl p-6 sm:p-8 mb-12 sm:mb-16">
        <h3 className="text-2xl font-semibold mb-4 sm:mb-6">
          Quick Installation
        </h3>
        <div className="space-y-3">
          <div className="code-block overflow-x-auto">
            <pre className="whitespace-pre-wrap break-words text-sm sm:text-base">
              <code>
                <span className="code-comment">
                  # Install globally with npm
                </span>
                {"\n"}
                <span className="code-keyword">npm install</span>{" "}
                <span className="code-string">-g cmarta-commit</span>
                {"\n\n"}
                <span className="code-comment"># One-time account setup</span>
                {"\n"}
                <span className="code-keyword">cmarta-commit</span>{" "}
                <span className="code-string">setup</span>
                {"\n\n"}
                <span className="code-comment">
                  # Use instead of git commit -m
                </span>
                {"\n"}
                <span className="code-keyword">cmarta-commit</span>
              </code>
            </pre>
          </div>
        </div>
      </div>

      {/* How It Works Detail */}
      <div className="text-center max-w-full sm:max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <h3 className="text-2xl font-semibold mb-2 sm:mb-6">
          Behind the Scenes
        </h3>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4 sm:mb-8">
          Cmarta-commit reads your{" "}
          <code className="bg-muted px-2 py-1 rounded text-accent">
            git diff --staged
          </code>
          , analyzes it using our AI engine, and generates a conventional commit message—plus a quality score and analytics synced to your dashboard. No API keys or config required.
        </p>

        <Button className="btn-hero w-full sm:w-auto">
          <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Get Started Now
        </Button>
      </div>
    </div>
  </section>
);

export default ProductSection;