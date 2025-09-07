import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

export interface FileInfo {
  path: string;
  name: string;
  dir: string;
  ext: string;
  isNew: boolean;
  isDeleted: boolean;
  isRenamed: boolean;
  additions: number;
  deletions: number;
}

export interface ChangeStats {
  totalAdditions: number;
  totalDeletions: number;
  totalFiles: number;
  netChange: number;
  changeRatio: number;
}

export interface FileCategories {
  frontend: FileInfo[];
  backend: FileInfo[];
  config: FileInfo[];
  docs: FileInfo[];
  tests: FileInfo[];
  database: FileInfo[];
  assets: FileInfo[];
  build: FileInfo[];
}

export interface ProjectContext {
  type: string;
  framework: string | null;
  language: string | null;
  hasTests: boolean;
  hasDocs: boolean;
}

export interface DiffAnalysis {
  files: FileInfo[];
  stats: ChangeStats;
  categories: FileCategories;
  suggestedType: string | null;
  suggestedScope: string | null;
  isBreakingChange: boolean;
  changePatterns: string[];
  projectContext: ProjectContext;
}

type CommitType = 'feat' | 'fix' | 'refactor' | 'chore' | 'docs' | 'style' | 'test' | 'perf' | 'ci' | 'build';

class DiffAnalyzer {
  private fileCategories: Record<string, string[]>;
  private commitTypeKeywords: Record<CommitType, string[]>;

  constructor() {
    this.fileCategories = {
      frontend: ['.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte', '.html', '.css', '.scss', '.sass', '.less'],
      backend: ['.py', '.java', '.php', '.rb', '.go', '.rs', '.cpp', '.c', '.cs'],
      config: ['.json', '.yaml', '.yml', '.toml', '.ini', '.env', '.conf'],
      docs: ['.md', '.txt', '.rst', '.adoc'],
      tests: ['.test.', '.spec.', '_test.', '_spec.'],
      database: ['.sql', '.migration', '.schema'],
      assets: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.ttf'],
      build: ['Dockerfile', 'Makefile', '.dockerfile', '.build', 'package.json', 'composer.json', 'requirements.txt', 'Cargo.toml', 'pom.xml']
    };

    this.commitTypeKeywords = {
      feat: ['add', 'implement', 'create', 'introduce', 'new'],
      fix: ['fix', 'resolve', 'correct', 'patch', 'repair', 'bug'],
      refactor: ['refactor', 'restructure', 'reorganize', 'simplify', 'optimize'],
      chore: ['update', 'upgrade', 'bump', 'maintenance', 'cleanup'],
      docs: ['documentation', 'readme', 'comment', 'doc'],
      style: ['format', 'lint', 'whitespace', 'indentation'],
      test: ['test', 'spec', 'coverage'],
      perf: ['performance', 'optimize', 'speed', 'cache'],
      ci: ['workflow', 'pipeline', 'deploy', 'build'],
      build: ['build', 'compile', 'bundle', 'webpack', 'rollup']
    };
  }

  analyze(gitDiff: string): DiffAnalysis {
    const analysis: DiffAnalysis = {
      files: this.parseFiles(gitDiff),
      stats: this.calculateStats(gitDiff),
      categories: {} as FileCategories,
      suggestedType: null,
      suggestedScope: null,
      isBreakingChange: false,
      changePatterns: [],
      projectContext: this.getProjectContext()
    };

    // Categorize files
    analysis.categories = this.categorizeFiles(analysis.files);

    // Analyze change patterns
    analysis.changePatterns = this.detectChangePatterns(gitDiff, analysis.files);

    // Suggest commit type
    analysis.suggestedType = this.suggestCommitType(analysis);

    // Suggest scope
    analysis.suggestedScope = this.suggestScope(analysis);

    // Check for breaking changes
    analysis.isBreakingChange = this.detectBreakingChanges(gitDiff, analysis.files);

    return analysis;
  }

  private parseFiles(gitDiff: string): FileInfo[] {
    const files: FileInfo[] = [];
    const lines = gitDiff.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('diff --git')) {
        const match = line.match(/diff --git a\/(.*) b\/(.*)/);
        if (match) {
          const filePath = match[2];
          const fileInfo: FileInfo = {
            path: filePath,
            name: path.basename(filePath),
            dir: path.dirname(filePath),
            ext: path.extname(filePath),
            isNew: false,
            isDeleted: false,
            isRenamed: false,
            additions: 0,
            deletions: 0
          };

          // Check file status
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            if (nextLine.includes('new file mode')) {
              fileInfo.isNew = true;
            } else if (nextLine.includes('deleted file mode')) {
              fileInfo.isDeleted = true;
            } else if (nextLine.includes('rename from') || nextLine.includes('rename to')) {
              fileInfo.isRenamed = true;
            }
          }

          // Count additions and deletions
          for (let j = i + 1; j < lines.length && !lines[j].startsWith('diff --git'); j++) {
            if (lines[j].startsWith('+') && !lines[j].startsWith('+++')) {
              fileInfo.additions++;
            } else if (lines[j].startsWith('-') && !lines[j].startsWith('---')) {
              fileInfo.deletions++;
            }
          }

          files.push(fileInfo);
        }
      }
    }

    return files;
  }

  private calculateStats(gitDiff: string): ChangeStats {
    const lines = gitDiff.split('\n');
    let totalAdditions = 0;
    let totalDeletions = 0;
    let totalFiles = 0;

    for (const line of lines) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        totalAdditions++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        totalDeletions++;
      } else if (line.startsWith('diff --git')) {
        totalFiles++;
      }
    }

    return {
      totalAdditions,
      totalDeletions,
      totalFiles,
      netChange: totalAdditions - totalDeletions,
      changeRatio: totalDeletions > 0 ? totalAdditions / totalDeletions : totalAdditions
    };
  }

  private categorizeFiles(files: FileInfo[]): FileCategories {
    const categories = {} as FileCategories;

    for (const [category, extensions] of Object.entries(this.fileCategories)) {
      categories[category as keyof FileCategories] = files.filter(file => {
        if (category === 'tests') {
          return extensions.some(pattern => file.path.includes(pattern));
        } else if (category === 'build') {
          return extensions.some(pattern => file.name === pattern || file.path.includes(pattern));
        } else {
          return extensions.includes(file.ext.toLowerCase());
        }
      });
    }

    return categories;
  }

  private detectChangePatterns(gitDiff: string, files: FileInfo[]): string[] {
    const patterns: string[] = [];

    // New files
    const newFiles = files.filter(f => f.isNew);
    if (newFiles.length > 0) {
      patterns.push(`created ${newFiles.length} new file(s)`);
    }

    // Deleted files
    const deletedFiles = files.filter(f => f.isDeleted);
    if (deletedFiles.length > 0) {
      patterns.push(`deleted ${deletedFiles.length} file(s)`);
    }

    // Renamed files
    const renamedFiles = files.filter(f => f.isRenamed);
    if (renamedFiles.length > 0) {
      patterns.push(`renamed ${renamedFiles.length} file(s)`);
    }

    // Large changes
    const largeChanges = files.filter(f => f.additions + f.deletions > 100);
    if (largeChanges.length > 0) {
      patterns.push(`major changes in ${largeChanges.length} file(s)`);
    }

    // Function/class patterns
    if (gitDiff.includes('function ') || gitDiff.includes('def ') || gitDiff.includes('class ')) {
      patterns.push('function/class modifications');
    }

    // Import/dependency changes
    if (gitDiff.includes('import ') || gitDiff.includes('require(') || gitDiff.includes('from ')) {
      patterns.push('dependency changes');
    }

    return patterns;
  }

  private suggestCommitType(analysis: DiffAnalysis): CommitType {
    const { files, categories, changePatterns, stats } = analysis;

    // Check for specific patterns first
    if (categories.tests && categories.tests.length > 0 && Object.keys(categories).length === 1) {
      return 'test';
    }

    if (categories.docs && categories.docs.length > 0 && Object.keys(categories).filter(k => categories[k as keyof FileCategories].length > 0).length === 1) {
      return 'docs';
    }

    if (categories.config && categories.config.length > 0) {
      const configFiles = categories.config.filter(f => f.name === 'package.json' || f.name === 'composer.json');
      if (configFiles.length > 0) {
        return 'chore';
      }
    }

    // Check for new files (likely features)
    const newFiles = files.filter(f => f.isNew);
    if (newFiles.length > 0 && stats.totalAdditions > stats.totalDeletions * 2) {
      return 'feat';
    }

    // Check for deletions (might be cleanup/refactor)
    if (stats.totalDeletions > stats.totalAdditions) {
      return files.filter(f => f.isDeleted).length > 0 ? 'chore' : 'refactor';
    }

    // Check change patterns for keywords
    const allText = changePatterns.join(' ').toLowerCase();
    for (const [type, keywords] of Object.entries(this.commitTypeKeywords)) {
      if (keywords.some(keyword => allText.includes(keyword))) {
        return type as CommitType;
      }
    }

    // Default based on change size
    if (stats.netChange > 50) {
      return 'feat';
    } else if (stats.totalFiles === 1 && stats.netChange < 10) {
      return 'fix';
    }

    return 'chore';
  }

  private suggestScope(analysis: DiffAnalysis): string | null {
    const { files, categories } = analysis;

    // Check for dominant category
    const dominantCategory = Object.entries(categories)
      .filter(([_, files]) => files.length > 0)
      .sort(([_, a], [__, b]) => b.length - a.length)[0];

    if (dominantCategory) {
      const [category, categoryFiles] = dominantCategory;

      // For single file changes, use specific scope
      if (files.length === 1) {
        const file = files[0];
        if (file.dir && file.dir !== '.' && !file.dir.includes('/')) {
          return file.dir;
        }

        // Extract scope from filename
        const baseName = file.name.replace(file.ext, '');
        if (baseName.includes('-') || baseName.includes('_')) {
          return baseName.split(/[-_]/)[0];
        }
      }

      // For multiple files, find common directory
      const commonDir = this.findCommonDirectory(categoryFiles);
      if (commonDir && commonDir !== '.' && commonDir !== '') {
        return commonDir.split('/')[0]; // Take first directory level
      }

      // Category-based scopes
      const categoryScopes: Record<string, string> = {
        frontend: 'ui',
        backend: 'api',
        database: 'db',
        config: 'config',
        tests: 'test',
        docs: 'docs',
        build: 'build'
      };

      return categoryScopes[category] || category;
    }

    return null;
  }

  private findCommonDirectory(files: FileInfo[]): string | null {
    if (files.length === 0) return null;
    if (files.length === 1) return files[0].dir;

    const paths = files.map(f => f.dir.split('/'));
    const common = paths[0];

    for (let i = 1; i < paths.length; i++) {
      const currentPath = paths[i];
      for (let j = 0; j < common.length; j++) {
        if (common[j] !== currentPath[j]) {
          common.splice(j);
          break;
        }
      }
    }

    return common.join('/');
  }

  private detectBreakingChanges(gitDiff: string, files: FileInfo[]): boolean {
    // Check for common breaking change patterns
    const breakingPatterns = [
      /remove.*function/i,
      /delete.*method/i,
      /remove.*export/i,
      /delete.*class/i,
      /remove.*interface/i,
      /change.*signature/i,
      /modify.*api/i,
      /update.*schema/i,
      /migration.*drop/i
    ];

    return breakingPatterns.some(pattern => pattern.test(gitDiff));
  }

  private getProjectContext(): ProjectContext {
    const context: ProjectContext = {
      type: 'unknown',
      framework: null,
      language: null,
      hasTests: false,
      hasDocs: false
    };

    try {
      // Check for package.json (Node.js project)
      if (fs.existsSync('package.json')) {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        context.type = 'nodejs';
        context.language = 'javascript';

        // Detect framework
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps.react) context.framework = 'react';
        else if (deps.vue) context.framework = 'vue';
        else if (deps.next) context.framework = 'nextjs';
        else if (deps.express) context.framework = 'express';
        else if (deps['@nestjs/core']) context.framework = 'nestjs';

        context.hasTests = !!deps.jest || !!deps.mocha || !!deps.vitest;
      }

      // Check for Python project
      else if (fs.existsSync('requirements.txt') || fs.existsSync('pyproject.toml')) {
        context.type = 'python';
        context.language = 'python';
      }

      // Check for Java project
      else if (fs.existsSync('pom.xml') || fs.existsSync('build.gradle')) {
        context.type = 'java';
        context.language = 'java';
      }

      // Check for Go project
      else if (fs.existsSync('go.mod')) {
        context.type = 'go';
        context.language = 'go';
      }

      // Check for documentation
      context.hasDocs = fs.existsSync('README.md') || fs.existsSync('docs/');

    } catch (error) {
      // Ignore errors, keep default context
    }

    return context;
  }

  generateAnalysisSummary(analysis: DiffAnalysis): string {
    const { stats, categories, changePatterns, suggestedType, suggestedScope } = analysis;

    const summary: string[] = [];
    summary.push(`${stats.totalFiles} files changed`);
    summary.push(`${stats.totalAdditions} additions, ${stats.totalDeletions} deletions`);

    if (Object.keys(categories).length > 0) {
      const activeCats = Object.entries(categories)
        .filter(([_, files]) => files.length > 0)
        .map(([cat, files]) => `${files.length} ${cat}`)
        .slice(0, 3);

      if (activeCats.length > 0) {
        summary.push(`Affects: ${activeCats.join(', ')}`);
      }
    }

    if (changePatterns.length > 0) {
      summary.push(`Patterns: ${changePatterns.slice(0, 2).join(', ')}`);
    }

    return summary.join(' | ');
  }
}

export default DiffAnalyzer;