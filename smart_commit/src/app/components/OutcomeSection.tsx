import { CheckCircle, Clock, GitBranch } from "lucide-react";

const OutcomeSection = () => {
  const outcomes = [
    {
      icon: GitBranch,
      title: "Consistent Format",
      description: "Every commit explains exactly what changed and why, making code reviews and debugging easier.",
      terminalExample: `git log --oneline
<span class="code-string">feat:</span> add user authentication middleware
<span class="code-string">fix:</span> resolve password validation edge case
<span class="code-string">refactor:</span> simplify database connection logic`
    },
    {
      icon: CheckCircle,
      title: "Clear Documentation",
      description: "AI analyzes your actual code changes to generate meaningful, contextual commit messages.",
      terminalExample: `<span class="code-comment"># Before: git commit -m "auth stuff"</span>
<span class="code-comment"># After: AI-generated message</span>
<span class="code-string">feat(auth):</span> implement JWT middleware with refresh tokens

<span class="code-comment"># Includes proper scope and detailed description</span>`
    },
    {
      title: "Time Saved",
      icon: Clock,
      description: "Generate descriptive commit messages in 3 seconds instead of thinking for minutes.",
      terminalExample: `<span class="code-comment"># Traditional workflow</span>
git add src/auth.js
<span class="code-comment"># 2-3 minutes thinking...</span>
git commit -m "add auth"

<span class="code-comment"># Smart Commit workflow</span>
git add src/auth.js
smart-commit <span class="code-comment"># 3 seconds</span>
<span class="code-string">✅ feat: add user authentication middleware</span>`
    }
  ];

  return (
    <section className="py-20 bg-card/50 px-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">
            Clean, Meaningful Git History
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            AI can analyze your code changes and write better commit messages than manual effort.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {outcomes.map((outcome, index) => (
            <div key={index} className="card-gradient p-8 hover-lift">
              <div className="mb-6">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-4">
                  <outcome.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">
                  {outcome.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {outcome.description}
                </p>
              </div>

              <div className="code-block">
                <pre className="text-sm">
                  <code dangerouslySetInnerHTML={{ __html: outcome.terminalExample }}></code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OutcomeSection;