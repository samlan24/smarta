import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import DiffAnalyzer, {
  DiffAnalysis,
  FileCategories,
  ProjectContext,
} from "./DiffAnalyzer";

export interface GenerateContentResponse {
  response: {
    text(): string;
  };
}

export interface CommitMessageOptions {
  maxLength?: number;
  includeBreakingChange?: boolean;
  includeScope?: boolean;
}

class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private analyzer: DiffAnalyzer;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error(
        "Gemini API key is required. Get one from https://makersuite.google.com/app/apikey"
      );
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    });
    this.analyzer = new DiffAnalyzer();
  }

  async generateCommitMessage(
    gitDiff: string,
    options: CommitMessageOptions = {}
  ): Promise<string> {
    // Analyze the diff for context
    const analysis = this.analyzer.analyze(gitDiff);

    // Generate context-aware prompt
    const prompt = this.buildPrompt(gitDiff, analysis, options);

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let message = response.text().trim();

      // Clean up the message
      message = this.cleanupMessage(message, analysis, options);

      return message;
    } catch (error) {
      throw new Error(
        `Failed to generate commit message: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private buildPrompt(
    gitDiff: string,
    analysis: DiffAnalysis,
    options: CommitMessageOptions
  ): string {
    const {
      stats,
      categories,
      suggestedType,
      suggestedScope,
      isBreakingChange,
      changePatterns,
      projectContext,
    } = analysis;

    let prompt = `You are an expert at writing conventional commit messages. Analyze this git diff and generate a single, precise commit message.

## Project Context:
- Type: ${projectContext.type}
- Language: ${projectContext.language || "mixed"}
- Framework: ${projectContext.framework || "none"}

## Change Analysis:
- Files changed: ${stats.totalFiles}
- Additions: ${stats.totalAdditions}, Deletions: ${stats.totalDeletions}
- Suggested type: ${suggestedType}
- Suggested scope: ${suggestedScope || "none"}
- Breaking change: ${isBreakingChange ? "YES" : "no"}

## File Categories Affected:`;

    // Add file categories
    Object.entries(categories).forEach(([category, files]) => {
      if ((files as { name: string }[]).length > 0) {
        prompt += `\n- ${category}: ${
          (files as { name: string }[]).length
        } files (${(files as { name: string }[])
          .map((f) => f.name)
          .slice(0, 3)
          .join(", ")})`;
      }
    });

    if (changePatterns.length > 0) {
      prompt += `\n\n## Change Patterns:\n${changePatterns
        .map((p) => `- ${p}`)
        .join("\n")}`;
    }

    // Add specific examples based on context
    prompt += this.getContextSpecificExamples(analysis);

    // Add the rules
    prompt += `\n\n## Conventional Commit Rules:
- Format: type(scope): description
- For complex changes, add a body after a blank line
- Subject line (first line): under ${options.maxLength || 50} characters
- Body lines: wrap at exactly 72 characters per line
- Use lowercase, imperative mood for subject
- No period at end of subject line
- Add '!' after type/scope for breaking changes
- Scope should be specific and relevant
- Body should explain what and why the change matters, not how
- Prioritize clarity and brevity
- Keep body concise - maximum 2 -3 lines total

## Special Instructions:`;

    // Add context-specific instructions
    prompt += this.getContextSpecificInstructions(analysis);

    // Truncate diff if too large
    let diffToAnalyze = gitDiff;
    if (gitDiff.length > 8000) {
      diffToAnalyze =
        gitDiff.substring(0, 8000) +
        "\n\n[... diff truncated for analysis ...]";
    }

    prompt += `\n\nGit diff to analyze:
\`\`\`
${diffToAnalyze}
\`\`\`

Generate only the commit message, nothing else:`;

    return prompt;
  }

  private getContextSpecificExamples(analysis: DiffAnalysis): string {
    const { suggestedType, projectContext, categories } = analysis;

    let examples = "\n\n## Relevant Examples:";

    // Framework-specific examples
    if (projectContext.framework === "react") {
      examples += `
- feat(auth): add login form validation
- fix(ui): resolve button hover state issue
- refactor(hooks): simplify useAuth implementation`;
    } else if (projectContext.framework === "nextjs") {
      examples += `
- feat(api): add user profile endpoints
- fix(ssr): resolve hydration mismatch error
- chore(deps): upgrade next to 15.0.0`;
    } else if (projectContext.framework === "express") {
      examples += `
- feat(auth): implement JWT middleware
- fix(api): handle null response in user routes
- perf(db): optimize user query performance`;
    }

    // Type-specific examples
    switch (suggestedType) {
      case "feat":
        examples += `
- feat(auth): implement two-factor authentication
- feat(api): add user profile management
- feat(ui): create responsive navigation menu`;
        break;
      case "fix":
        examples += `
- fix(auth): resolve token expiration handling
- fix(api): handle edge case in validation
- fix(ui): correct mobile layout issues`;
        break;
      case "test":
        examples += `
- test(auth): add integration tests for login
- test(api): increase coverage for user endpoints
- test(utils): add unit tests for validation`;
        break;
      case "docs":
        examples += `
- docs: update installation instructions
- docs(api): add endpoint documentation
- docs: fix typos in contributing guide`;
        break;
    }

    // Category-specific examples
    if (categories.database && categories.database.length > 0) {
      examples += `
- feat(db): add user preferences table
- fix(migration): resolve foreign key constraint
- perf(db): add indexes for query optimization`;
    }

    if (categories.config && categories.config.length > 0) {
      examples += `
- chore(config): update environment variables
- ci: add deployment workflow
- build: configure webpack optimization`;
    }

    return examples;
  }

  private getContextSpecificInstructions(analysis: DiffAnalysis): string {
    const { stats, suggestedType, isBreakingChange, categories } = analysis;

    let instructions = "";

    // Large change instructions
    if (stats.totalFiles > 10) {
      instructions += "\n- Focus on the primary purpose, not individual files";
    }

    // Breaking change instructions
    if (isBreakingChange) {
      instructions +=
        '\n- Add "!" after type/scope to indicate breaking change';
      instructions +=
        "\n- Focus on what functionality changed, not implementation";
    }

    // Single file change
    if (stats.totalFiles === 1) {
      instructions += "\n- Be specific about what changed in this file";
    }

    // Dependency updates
    if (
      categories.config &&
      categories.config.some((f) => f.name === "package.json")
    ) {
      instructions +=
        "\n- For dependency updates, mention the key package if obvious";
    }

    // Test-only changes
    if (categories.tests && categories.tests.length === stats.totalFiles) {
      instructions += '\n- Use "test" type and focus on what is being tested';
    }

    // New feature detection
    if (
      stats.netChange > 100 &&
      stats.totalAdditions > stats.totalDeletions * 3
    ) {
      instructions += '\n- This appears to be a new feature, use "feat" type';
    }

    // Refactor detection
    if (
      stats.totalAdditions > 0 &&
      stats.totalDeletions > 0 &&
      Math.abs(stats.totalAdditions - stats.totalDeletions) < 20
    ) {
      instructions += "\n- Similar additions/deletions suggest refactoring";
    }

    return instructions || "\n- Follow conventional commit best practices";
  }

  private wrapBodyLines(text: string, maxLength: number = 72): string {
  const lines = text.split('\n');
  const wrappedLines: string[] = [];

  for (const line of lines) {
    if (line.trim() === '') {
      wrappedLines.push('');
      continue;
    }

    if (line.length <= maxLength) {
      wrappedLines.push(line);
      continue;
    }

    // Wrap long lines
    const words = line.split(' ');
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          wrappedLines.push(currentLine);
        }
        currentLine = word;

        // If single word is longer than maxLength, break it
        while (currentLine.length > maxLength) {
          wrappedLines.push(currentLine.substring(0, maxLength));
          currentLine = currentLine.substring(maxLength);
        }
      }
    }

    if (currentLine) {
      wrappedLines.push(currentLine);
    }
  }

  return wrappedLines.join('\n');
}

  private cleanupMessage(
    message: string,
    analysis: DiffAnalysis,
    options: CommitMessageOptions
  ): string {
    // Remove quotes if present
    message = message.replace(/^["']|["']$/g, "");

    // Remove any markdown formatting
    message = message.replace(/`/g, "");

    // Ensure lowercase description (but preserve proper nouns)
    const parts = message.split(": ");
    if (parts.length === 2) {
      let [typeScope, description] = parts;

      // Don't lowercase the first word if it's a proper noun (like API, JWT, etc.)
      const properNouns = [
        "API",
        "JWT",
        "OAuth",
        "HTTP",
        "CSS",
        "HTML",
        "JSON",
        "XML",
        "SQL",
        "UI",
        "UX",
      ];
      const words = description.split(" ");
      if (words.length > 0 && !properNouns.includes(words[0])) {
        words[0] = words[0].toLowerCase();
        description = words.join(" ");
      }

      message = `${typeScope}: ${description}`;
    }

    // Remove trailing period
    message = message.replace(/\.$/, "");

    // Add breaking change indicator if detected and not present
    if (
      options.includeBreakingChange !== false &&
      analysis.isBreakingChange &&
      !message.includes("!")
    ) {
      const colonIndex = message.indexOf("):");
      if (colonIndex !== -1) {
        message =
          message.substring(0, colonIndex) +
          "!" +
          message.substring(colonIndex);
      } else {
        const typeEnd = message.indexOf(":");
        if (typeEnd !== -1) {
          message =
            message.substring(0, typeEnd) + "!" + message.substring(typeEnd);
        }
      }
    }

    // Ensure reasonable subject line length (truncate if too long)
const maxLength = options.maxLength || 50;
const lines = message.split("\n");
const subjectLine = lines[0];

if (subjectLine.length > maxLength) {
  const colonIndex = subjectLine.indexOf(": ");
  if (colonIndex !== -1) {
    const prefix = subjectLine.substring(0, colonIndex + 2);
    const description = subjectLine.substring(colonIndex + 2);
    const maxDescLength = maxLength - prefix.length;

    if (description.length > maxDescLength) {
      const truncated = description.substring(0, maxDescLength - 3) + "...";
      lines[0] = prefix + truncated;
    }
  }
}

// Wrap body lines at 72 characters
if (lines.length > 1) {
  const subjectAndEmptyLine = lines.slice(0, 2); // Keep subject + empty line
  const bodyLines = lines.slice(2); // Get body lines
  const bodyText = bodyLines.join('\n');
  const wrappedBody = this.wrapBodyLines(bodyText, 72);

  message = [...subjectAndEmptyLine, wrappedBody].join('\n');
} else {
  message = lines.join('\n');
}

    return message;
  }

  // Method to get multiple suggestions
  async generateMultipleCommitMessages(
    gitDiff: string,
    count: number = 3,
    options: CommitMessageOptions = {}
  ): Promise<string[]> {
    const analysis = this.analyzer.analyze(gitDiff);
    const messages: string[] = [];

    for (let i = 0; i < count; i++) {
      const prompt = this.buildVariationPrompt(gitDiff, analysis, i, options);

      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        let message = response.text().trim();
        message = this.cleanupMessage(message, analysis, options);

        // Avoid duplicates
        if (!messages.includes(message)) {
          messages.push(message);
        }
      } catch (error) {
        console.warn(
          `Failed to generate variation ${i + 1}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    return messages.length > 0
      ? messages
      : [await this.generateCommitMessage(gitDiff, options)];
  }

  private buildVariationPrompt(
    gitDiff: string,
    analysis: DiffAnalysis,
    variation: number,
    options: CommitMessageOptions
  ): string {
    let basePrompt = this.buildPrompt(gitDiff, analysis, options);

    // Add variation-specific instructions
    const variations = [
      "Focus on the primary business value of this change.",
      "Emphasize the technical implementation aspects.",
      "Highlight the user-facing impact of this change.",
    ];

    if (variation < variations.length) {
      basePrompt += `\n\nVariation focus: ${variations[variation]}`;
    }

    return basePrompt;
  }

  // Method to get analysis without generating commit message
  analyzeChanges(gitDiff: string): DiffAnalysis {
    return this.analyzer.analyze(gitDiff);
  }
}

export default GeminiClient;
