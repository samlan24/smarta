import { Button } from "../components/ui/button";
import { Download, ArrowRight, CheckCircle } from "lucide-react";

const FinalCTASection = () => {
  const requirements = [
    "Node.js 16+ and git",
    "No API keys required",
    "No configuration needed",
    "Works with any repository",
  ];

  return (
    <section className="py-16 sm:py-20 bg-gradient-hero relative overflow-hidden px-6 sm:px-12 lg:px-24">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5"></div>
      <div className="absolute top-16 sm:top-20 right-8 sm:right-20 w-48 sm:w-64 h-48 sm:h-64 bg-accent/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-16 sm:bottom-20 left-8 sm:left-20 w-64 sm:w-80 h-64 sm:h-80 bg-primary/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            Get Started with Cmarta
          </h2>

          <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-full sm:max-w-2xl mx-auto leading-relaxed">
            Join thousands of developers who've improved their git workflow.
            Start generating better commit messages in under 60 seconds.
          </p>

          {/* Installation command */}
          <div className="code-block max-w-full sm:max-w-2xl mx-auto mb-6 sm:mb-8 overflow-x-auto">
            <pre className="whitespace-pre-wrap break-words text-sm sm:text-base">
              <code>
                <span className="code-comment">
                  # Install Cmarta globally
                </span>
                {"\n"}
                <span className="code-keyword">npm install</span>{" "}
                <span className="code-string">-g cmarta</span>
                {"\n\n"}
                <span className="code-comment"># Start using immediately</span>
                {"\n"}
                <span className="code-keyword">cmarta</span>
              </code>
            </pre>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12">
            <Button className="btn-hero text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 group w-full sm:w-auto">
              <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:scale-110 transition-transform" />
              Install Now - 50 Free Commits
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Requirements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-full sm:max-w-3xl mx-auto">
            {requirements.map((requirement, index) => (
              <div
                key={index}
                className="flex items-center justify-center space-x-2 sm:space-x-3 text-muted-foreground"
              >
                <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                <span className="text-sm sm:text-base">{requirement}</span>
              </div>
            ))}
          </div>

          {/* Trust indicators */}
          <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">
              Trusted by developers at
            </p>
            <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 opacity-60">
              {["GitHub", "GitLab", "Bitbucket", "Azure DevOps"].map(
                (platform, index) => (
                  <span
                    key={index}
                    className="text-base sm:text-lg font-medium text-muted-foreground"
                  >
                    {platform}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
