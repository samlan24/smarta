import { Button } from "../components/ui/button";
import { Terminal, Download, ArrowRight } from "lucide-react";

const ProductSection = () => {
  const steps = [
    {
      number: "1",
      command: "git add src/auth.js",
      description: "Stage your changes",
    },
    {
      number: "2",
      command: "smart-commit",
      description: "AI analyzes diff and suggests message",
    },
    {
      number: "3",
      command: "✅ feat: add user auth",
      description: "Review and commit",
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-background px-6 sm:px-12 lg:px-24">
      <div className="container mx-auto">
        {/* Product Introduction */}
        <div className="text-center mb-12 sm:mb-16 space-y-4 sm:space-y-6">
          <div className="inline-flex items-center space-x-2 sm:space-x-3 bg-card rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mx-auto mb-4 sm:mb-6">
            <Terminal className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
            <span className="text-sm sm:text-base font-medium text-muted-foreground">
              Introducing Cmarta
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-4xl font-bold mb-2 sm:mb-6">
            AI Commit Message Generator
          </h2>

          <p className="text-base sm:text-lg text-muted-foreground max-w-full sm:max-w-3xl mx-auto mb-6 sm:mb-8 leading-relaxed">
            Command-line tool that replaces git commit with AI-powered message
            generation. No configuration or API keys needed.
          </p>
        </div>

        {/* 3-Step Process */}
        <div className="mb-12 sm:mb-16">
          <h3 className="text-2xl sm:text-2xl font-semibold text-center mb-8 sm:mb-12">
            How It Works
          </h3>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row items-center"
              >
                {/* Step */}
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

                {/* Arrow */}
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
                  <span className="code-string">-g smart-commit</span>
                  {"\n\n"}
                  <span className="code-comment"># One-time account setup</span>
                  {"\n"}
                  <span className="code-keyword">smart-commit</span>{" "}
                  <span className="code-string">login</span>
                  {"\n\n"}
                  <span className="code-comment">
                    # Use instead of git commit -m
                  </span>
                  {"\n"}
                  <span className="code-keyword">smart-commit</span>
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
            Smarta reads your{" "}
            <code className="bg-muted px-2 py-1 rounded text-accent">
              git diff --staged
            </code>
            , analyzes it using our AI service, and generates a conventional
            commit message based on your actual code changes. Everything works
            instantly – no API keys or configuration required.
          </p>

          <Button className="btn-hero w-full sm:w-auto">
            <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Get Started Now
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ProductSection;
