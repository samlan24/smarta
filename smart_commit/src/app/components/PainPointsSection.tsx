const PainPointsSection = () => {
  const painPoints = [
    {
      title: "Inconsistent Messages",
      description:
        "Most developers write quick, vague commit messages that don't follow any standard format, leading to confusion and wasted time.",
      terminalExample: `git commit -m "fix"
git commit -m "updates"
git commit -m "working on stuff"`,
    },
    {
      title: "Time Spent Thinking",
      description:
        "You pause at every commit, trying to craft a descriptive message that explains what actually changed. It adds up over time.",
      terminalExample: `# Staring at the terminal...
# What did I actually change?
# How do I describe this properly?
git commit -m "uhh... fixed the thing"`,
    },
    {
      title: "Unclear Project History",
      description:
        "Your git history becomes useless for understanding what happened when—making onboarding, debugging, and code reviews harder.",
      terminalExample: `git log --oneline
a1b2c3d fix
d4e5f6g updates
g7h8i9j more changes`,
    },
    {
      title: "No Insight Into Commit Quality",
      description:
        "There's no easy way to track or improve your commit hygiene. Are you or your team following best practices? Where are the gaps?",
      terminalExample: `# You have no visibility into:
# - Who writes good/bad commits
# - Which repos follow conventions
# - Trends over time`,
    },
    {
      title: "Blind Spots in Productivity",
      description:
        "Without analytics, you miss patterns in your workflow—like frequent reverts, large commits, or bottlenecks that slow down your team.",
      terminalExample: `# No dashboard for:
# - Commit frequency
# - Code churn
# - Team trends`,
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-background px-6 sm:px-12 lg:px-24">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16 space-y-4 sm:space-y-6">
          <h2 className="text-3xl sm:text-4xl lg:text-4xl font-bold mb-2 sm:mb-6">
            Code Quality and Productivity Pain Points
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-full sm:max-w-3xl mx-auto leading-relaxed">
            Poor commit practices and lack of visibility slow you down. But you don’t have to settle for guesswork or manual discipline.
          </p>
        </div>

        {/* Zigzag Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 sm:gap-8">
          {painPoints.map((point, index) => (
            <div
              key={index}
              className={`
                card-gradient p-6 sm:p-8 hover-lift flex flex-col
                ${index === 0 ? "md:col-span-6" : ""}
                ${index === 1 ? "md:col-span-4" : ""}
                ${index === 2 ? "md:col-span-2" : ""}
                ${index === 3 ? "md:col-span-3" : ""}
                ${index === 4 ? "md:col-span-3" : ""}
              `}
            >
              <div className="mb-4 sm:mb-6">
                <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-4 text-foreground">
                  {point.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {point.description}
                </p>
              </div>

              <div className="code-block overflow-x-auto mt-auto">
                <pre className="text-xs sm:text-sm whitespace-pre-wrap break-words">
                  <code>{point.terminalExample}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PainPointsSection;
