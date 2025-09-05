import { Button } from "../components/ui/button";
import { Download, ArrowRight, CheckCircle } from "lucide-react";

const FinalCTASection = () => {
  const requirements = [
    "Node.js 16+ and git",
    "No API keys required",
    "No configuration needed",
    "Works with any repository"
  ];

  return (
    <section className="py-20 bg-gradient-hero relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5"></div>
      <div className="absolute top-20 right-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Get Started with Smart Commit
          </h2>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Join thousands of developers who've improved their git workflow.
            Start generating better commit messages in under 60 seconds.
          </p>

          {/* Installation command */}
          <div className="code-block max-w-2xl mx-auto mb-8">
            <pre>
              <code>
                <span className="code-comment"># Install Smart Commit globally</span>{'\n'}
                <span className="code-keyword">npm install</span> <span className="code-string">-g smart-commit</span>{'\n\n'}
                <span className="code-comment"># Start using immediately</span>{'\n'}
                <span className="code-keyword">smart-commit</span>
              </code>
            </pre>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button className="btn-hero text-lg px-8 py-4 group">
              <Download className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Install Now - 50 Free Commits
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button variant="outline" className="btn-outline-hero text-lg px-8 py-4">
              View Documentation
            </Button>
          </div>

          {/* Requirements */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {requirements.map((requirement, index) => (
              <div key={index} className="flex items-center justify-center space-x-2 text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                <span className="text-sm">{requirement}</span>
              </div>
            ))}
          </div>

          {/* Trust indicators */}
          <div className="mt-16 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">
              Trusted by developers at
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              {["GitHub", "GitLab", "Bitbucket", "Azure DevOps"].map((platform, index) => (
                <span key={index} className="text-lg font-medium text-muted-foreground">
                  {platform}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;