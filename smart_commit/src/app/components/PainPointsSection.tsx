const PainPointsSection = () => {
  const painPoints = [
    {
      title: "Inconsistent Messages",
      description:
        "Most developers write quick, vague commit messages that don't follow any standard format.",
      terminalExample: `git commit -m "fix"
git commit -m "updates"
git commit -m "working on stuff"`,
    },
    {
      title: "Time Spent Thinking",
      description:
        "You pause at every commit, trying to craft a descriptive message that explains what actually changed.",
      terminalExample: `# Staring at the terminal...
# What did I actually change?
# How do I describe this properly?
git commit -m "uhh... fixed the thing"`,
    },
    {
      title: "Unclear Project History",
      description:
        "Your git history becomes useless for understanding what happened when.",
      terminalExample: `git log --oneline
a1b2c3d fix
d4e5f6g updates
g7h8i9j more changes`,
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-background px-6 sm:px-12 lg:px-24">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16 space-y-4 sm:space-y-6">
          <h2 className="text-3xl sm:text-4xl lg:text-4xl font-bold mb-2 sm:mb-6">
            Commit Message Problems Every Developer Faces
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-full sm:max-w-3xl mx-auto leading-relaxed">
            You think good commit messages require manual effort and discipline.
            There's actually a better way.
          </p>
        </div>

        {/* Pain Points Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {painPoints.map((point, index) => (
            <div
              key={index}
              className="card-gradient p-6 sm:p-8 hover-lift flex flex-col"
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
