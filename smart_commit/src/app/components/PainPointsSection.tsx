const PainPointsSection = () => {
  const painPoints = [
    {
      title: "Inconsistent Messages",
      description: "Most developers write quick, vague commit messages that don't follow any standard format.",
      terminalExample: `git commit -m "fix"
git commit -m "updates"
git commit -m "working on stuff"`
    },
    {
      title: "Time Spent Thinking",
      description: "You pause at every commit, trying to craft a descriptive message that explains what actually changed.",
      terminalExample: `# Staring at the terminal...
# What did I actually change?
# How do I describe this properly?
git commit -m "uhh... fixed the thing"`
    },
    {
      title: "Unclear Project History",
      description: "Your git history becomes useless for understanding what happened when.",
      terminalExample: `git log --oneline
a1b2c3d fix
d4e5f6g updates
g7h8i9j more changes`
    }
  ];

  return (
    <section className="py-20 bg-background px-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">
            Commit Message Problems Every Developer Faces
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            You think good commit messages require manual effort and discipline. There's actually a better way.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {painPoints.map((point, index) => (
            <div key={index} className="card-gradient p-8 hover-lift">
              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-4 text-foreground">
                  {point.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {point.description}
                </p>
              </div>

              <div className="code-block">
                <pre className="text-sm">
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