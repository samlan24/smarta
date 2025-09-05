import { Button } from "../components/ui/button";
import { Terminal, Download, ArrowRight } from "lucide-react";

const ProductSection = () => {
  const steps = [
    {
      number: "1",
      command: "git add src/auth.js",
      description: "Stage your changes"
    },
    {
      number: "2",
      command: "smart-commit",
      description: "AI analyzes diff and suggests message"
    },
    {
      number: "3",
      command: "✅ feat: add user auth",
      description: "Review and commit"
    }
  ];

  return (
    <section className="py-20 bg-background px-24">
      <div className="container mx-auto px-6">
        {/* Product Introduction */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-card rounded-full px-4 py-2 mb-6">
            <Terminal className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-muted-foreground">Introducing Smart Commit</span>
          </div>

          <h2 className="text-4xl font-bold mb-6">
            AI Commit Message Generator
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Command-line tool that replaces git commit with AI-powered message generation.
            No configuration or API keys needed.
          </p>
        </div>

        {/* 3-Step Process */}
        <div className="mb-16">
          <h3 className="text-2xl font-semibold text-center mb-12">How It Works</h3>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full">
                    <ArrowRight className="w-6 h-6 text-muted-foreground/50 mx-auto" />
                  </div>
                )}

                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
                    <span className="text-2xl font-bold text-primary-foreground">{step.number}</span>
                  </div>

                  <div className="code-block mb-4 text-left">
                    <code className="text-accent">{step.command}</code>
                  </div>

                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Installation */}
        <div className="bg-card rounded-2xl p-8 mb-16">
          <h3 className="text-2xl font-semibold mb-6">Quick Installation</h3>

          <div className="space-y-4">
            <div className="code-block">
              <pre>
                <code>
                  <span className="code-comment"># Install globally with npm</span>{'\n'}
                  <span className="code-keyword">npm install</span> <span className="code-string">-g smart-commit</span>{'\n\n'}
                  <span className="code-comment"># One-time account setup</span>{'\n'}
                  <span className="code-keyword">smart-commit</span> <span className="code-string">login</span>{'\n\n'}
                  <span className="code-comment"># Use instead of git commit -m</span>{'\n'}
                  <span className="code-keyword">smart-commit</span>
                </code>
              </pre>
            </div>
          </div>
        </div>

        {/* How It Works Detail */}
        <div className="text-center max-w-4xl mx-auto">
          <h3 className="text-2xl font-semibold mb-6">Behind the Scenes</h3>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            Smart Commit reads your <code className="bg-muted px-2 py-1 rounded text-accent">git diff --staged</code>,
            analyzes it using our AI service, and generates a conventional commit message based on your actual code changes.
            Everything works instantly - no API keys or configuration required.
          </p>

          <Button className="btn-hero">
            <Download className="w-5 h-5 mr-2" />
            Get Started Now
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ProductSection;