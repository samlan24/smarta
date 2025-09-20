import { CheckCircle, Clock, GitBranch, BarChart3, Users } from "lucide-react";

const OutcomeSection = () => {
  const outcomes = [
    {
      icon: GitBranch,
      title: "Consistent Format",
      description:
        "Every commit explains exactly what changed and why, making code reviews and debugging easier.",
      terminalExample: `git log --oneline
<span class="code-string">feat:</span> add user authentication middleware
<span class="code-string">fix:</span> resolve password validation edge case
<span class="code-string">refactor:</span> simplify database connection logic`,
    },
    {
      icon: CheckCircle,
      title: "Clear Documentation",
      description:
        "AI analyzes your actual code changes to generate meaningful, contextual commit messages.",
      terminalExample: `<span class="code-comment"># Before: git commit -m "auth stuff"</span>
<span class="code-comment"># After: AI-generated message</span>
<span class="code-string">feat(auth):</span> implement JWT middleware with refresh tokens

<span class="code-comment"># Includes proper scope and detailed description</span>`,
    },
    {
      icon: Clock,
      title: "Time Saved",
      description:
        "Generate descriptive commit messages in 3 seconds instead of thinking for minutes.",
      terminalExample: `<span class="code-comment"># Traditional workflow</span>
git add src/auth.js
<span class="code-comment"># 2-3 minutes thinking...</span>
git commit -m "add auth"

<span class="code-comment"># Cmarta-commit workflow</span>
git add src/auth.js
cmarta-commit <span class="code-comment"># 3 seconds</span>
<span class="code-string">✅ feat: add user authentication middleware</span>`,
    },
    {
      icon: BarChart3,
      title: "Commit Quality Analytics",
      description:
        "Track your commit best practices over time. Visualize patterns, spot trends, and improve your workflow.",
      terminalExample: `<span class="code-comment"># Dashboard Example</span>
Quality Score: <span class="code-string">88/100</span>
AI vs Manual: <span class="code-string">70% AI, 30% Manual</span>
Conventional Commits: <span class="code-string">95%</span>`,
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-card/50 px-6 sm:px-12 lg:px-24">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16 space-y-4 sm:space-y-6">
          <h2 className="text-3xl sm:text-4xl lg:text-4xl font-bold mb-2 sm:mb-6">
            Clean Commits. Actionable Analytics.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-full sm:max-w-3xl mx-auto leading-relaxed">
            Go beyond automation—track your commit quality, get insights into your workflow, and help your team ship better code.
          </p>
        </div>

        {/* Outcomes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8">
  {outcomes.map((outcome, index) => (
    <div
      key={index}
      className="card-gradient p-6 sm:p-8 hover-lift flex flex-col"
    >
      {/* Icon and Description */}
      <div className="mb-4 sm:mb-6">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-primary rounded-xl flex items-center justify-center mb-3 sm:mb-4">
          <outcome.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
        </div>
        <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-4 text-foreground">
          {outcome.title}
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {outcome.description}
        </p>
      </div>

      {/* Code Example */}
      <div className="code-block mt-auto overflow-x-auto">
        <pre className="text-xs sm:text-sm whitespace-pre-wrap break-words">
          <code
            dangerouslySetInnerHTML={{ __html: outcome.terminalExample }}
          />
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