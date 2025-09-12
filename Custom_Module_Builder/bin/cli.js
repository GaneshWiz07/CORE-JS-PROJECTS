#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { CustomModuleBuilder, PathUtils } from '../src/index.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packagePath = path.join(__dirname, '..', 'package.json');

/**
 * CLI Interface for Custom Module Builder
 * Provides command-line access to module building functionality
 */
class ModuleBuilderCLI {
    constructor() {
        this.program = new Command();
        this.setupCommands();
    }

    setupCommands() {
        this.program
            .name('module-builder')
            .description('Custom Module Builder - Analyze and bundle JavaScript modules')
            .version('1.0.0');

        // Build command
        this.program
            .command('build')
            .description('Build modules from project')
            .option('-r, --root <path>', 'Root project path', process.cwd())
            .option('-o, --output <dir>', 'Output directory', 'dist')
            .option('-e, --entry <files...>', 'Entry point files')
            .option('-f, --format <format>', 'Bundle format (esm|cjs|iife|umd)', 'esm')
            .option('--minify', 'Minify output')
            .option('--treeshake', 'Enable tree shaking', true)
            .option('--split', 'Enable bundle splitting')
            .option('--verbose', 'Verbose output', true)
            .action(async (options) => {
                await this.handleBuild(options);
            });

        // Analyze command
        this.program
            .command('analyze')
            .description('Analyze project structure and dependencies')
            .option('-r, --root <path>', 'Root project path', process.cwd())
            .option('-f, --file <path>', 'Analyze specific file')
            .option('--json', 'Output as JSON')
            .action(async (options) => {
                await this.handleAnalyze(options);
            });

        // Graph command
        this.program
            .command('graph')
            .description('Generate dependency graph visualizations')
            .option('-r, --root <path>', 'Root project path', process.cwd())
            .option('-e, --entry <files...>', 'Entry point files')
            .option('-o, --output <dir>', 'Output directory', 'dist/reports')
            .option('--format <format>', 'Graph format (json|dot|mermaid)', 'json')
            .action(async (options) => {
                await this.handleGraph(options);
            });

        // Stats command
        this.program
            .command('stats')
            .description('Show project statistics')
            .option('-r, --root <path>', 'Root project path', process.cwd())
            .action(async (options) => {
                await this.handleStats(options);
            });
    }

    async handleBuild(options) {
        try {
            console.log(chalk.blue('🚀 Custom Module Builder'));
            console.log(chalk.gray('Building modules...\n'));

            const builder = new CustomModuleBuilder({
                rootPath: PathUtils.resolve(options.root),
                outputDir: options.output,
                entryPoints: options.entry || [],
                bundleFormat: options.format,
                minify: options.minify || false,
                treeshake: options.treeshake !== false,
                bundleSplitting: options.split || false,
                verbose: options.verbose !== false
            });

            const result = await builder.build();

            if (result.success) {
                console.log(chalk.green('\n✅ Build completed successfully!'));
                console.log(chalk.gray(`📁 Output: ${result.outputDir}`));
                console.log(chalk.gray(`⏱️  Duration: ${result.duration}ms`));
            } else {
                console.error(chalk.red('\n❌ Build failed:'), result.error);
                process.exit(1);
            }

        } catch (error) {
            console.error(chalk.red('❌ Error:'), error.message);
            process.exit(1);
        }
    }

    async handleAnalyze(options) {
        try {
            console.log(chalk.blue('🔍 Analyzing project...'));

            const builder = new CustomModuleBuilder({
                rootPath: PathUtils.resolve(options.root),
                verbose: false
            });

            if (options.file) {
                const analysis = await builder.analyzeFile(options.file);
                
                if (options.json) {
                    console.log(JSON.stringify(analysis, null, 2));
                } else {
                    this.printFileAnalysis(analysis);
                }
            } else {
                const stats = await builder.getProjectStats();
                
                if (options.json) {
                    console.log(JSON.stringify(stats, null, 2));
                } else {
                    this.printProjectStats(stats);
                }
            }

        } catch (error) {
            console.error(chalk.red('❌ Error:'), error.message);
            process.exit(1);
        }
    }

    async handleGraph(options) {
        try {
            console.log(chalk.blue('🕸️  Generating dependency graph...'));

            const builder = new CustomModuleBuilder({
                rootPath: PathUtils.resolve(options.root),
                verbose: false
            });

            // Build the graph first
            await builder.build({
                outputDir: options.output,
                entryPoints: options.entry || [],
                verbose: false
            });

            console.log(chalk.green('✅ Dependency graph generated!'));
            console.log(chalk.gray(`📁 Reports: ${PathUtils.join(options.output, 'reports')}`));

        } catch (error) {
            console.error(chalk.red('❌ Error:'), error.message);
            process.exit(1);
        }
    }

    async handleStats(options) {
        try {
            console.log(chalk.blue('📊 Project Statistics'));

            const builder = new CustomModuleBuilder({
                rootPath: PathUtils.resolve(options.root),
                verbose: false
            });

            const stats = await builder.getProjectStats();
            this.printProjectStats(stats);

        } catch (error) {
            console.error(chalk.red('❌ Error:'), error.message);
            process.exit(1);
        }
    }

    printFileAnalysis(analysis) {
        console.log(chalk.yellow('\n📄 File Analysis'));
        console.log(`File: ${chalk.cyan(analysis.relativePath)}`);
        console.log(`Dependencies: ${chalk.green(analysis.dependencies.length)}`);
        console.log(`Dependency Chain Depth: ${chalk.blue(analysis.dependencyChain.maxDepth)}`);
        console.log(`Total Modules in Chain: ${chalk.magenta(analysis.dependencyChain.totalNodes)}`);

        if (analysis.dependencies.length > 0) {
            console.log(chalk.yellow('\n🔗 Direct Dependencies:'));
            analysis.dependencies.forEach(dep => {
                const status = dep.exists ? chalk.green('✓') : chalk.red('✗');
                const type = dep.type === 'local' ? chalk.blue('[local]') : chalk.gray('[external]');
                console.log(`  ${status} ${type} ${dep.original}`);
            });
        }
    }

    printProjectStats(stats) {
        console.log(chalk.yellow('\n📊 Project Overview'));
        console.log(`Root: ${chalk.cyan(stats.rootPath)}`);
        console.log(`Total Files: ${chalk.green(stats.totalFiles)}`);
        console.log(`Directories: ${chalk.blue(stats.directoryCount)}`);
        console.log(`Max Depth: ${chalk.magenta(stats.maxDepth)}`);
        console.log(`Package.json: ${stats.hasPackageJson ? chalk.green('✓') : chalk.red('✗')}`);

        if (stats.fileTypes && Object.keys(stats.fileTypes).length > 0) {
            console.log(chalk.yellow('\n📄 File Types:'));
            Object.entries(stats.fileTypes).forEach(([ext, count]) => {
                console.log(`  ${ext}: ${chalk.cyan(count)} files`);
            });
        }

        if (stats.patterns && stats.patterns.length > 0) {
            console.log(chalk.yellow('\n🏗️  Architecture Patterns:'));
            stats.patterns.forEach(pattern => {
                console.log(`  ${chalk.green('✓')} ${pattern}`);
            });
        }

        console.log(chalk.yellow('\n🎯 Entry Points:'));
        console.log(`  Suggested: ${chalk.cyan(stats.suggestedEntryPoints)}`);
    }

    run() {
        this.program.parse();
    }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error(chalk.red('❌ Uncaught Exception:'), error.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk.red('❌ Unhandled Rejection:'), reason);
    process.exit(1);
});

// Run CLI
const cli = new ModuleBuilderCLI();
cli.run();
