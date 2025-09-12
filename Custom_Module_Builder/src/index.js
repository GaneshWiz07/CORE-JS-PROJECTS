import { DependencyDiscovery } from './core/DependencyDiscovery.js';
import { DependencyGraph } from './core/DependencyGraph.js';
import { ModuleBundler } from './core/ModuleBundler.js';
import { FileSystemUtils } from './utils/FileSystemUtils.js';
import { PathUtils } from './utils/PathUtils.js';

/**
 * Custom Module Builder - Main Entry Point
 * Demonstrates FileSystem API, Path API, Recursion, and Dependency Graphs
 */
export class CustomModuleBuilder {
    constructor(options = {}) {
        this.options = {
            rootPath: process.cwd(),
            outputDir: 'dist',
            entryPoints: [],
            bundleFormat: 'esm',
            minify: false,
            sourceMaps: false,
            treeshake: true,
            bundleSplitting: false,
            verbose: true,
            ...options
        };

        this.discovery = new DependencyDiscovery({
            extensions: ['.js', '.mjs', '.ts', '.jsx', '.tsx'],
            maxDepth: 20,
            ignorePatterns: [
                /node_modules/,
                /\.git/,
                /dist/,
                /build/,
                /coverage/
            ]
        });

        this.graph = new DependencyGraph();
        this.bundler = new ModuleBundler({
            outputFormat: this.options.bundleFormat,
            minify: this.options.minify,
            sourceMaps: this.options.sourceMaps,
            treeshake: this.options.treeshake,
            bundleSplitting: this.options.bundleSplitting
        });

        this.results = {
            discovery: null,
            graph: null,
            bundles: null,
            analysis: null
        };
    }

    /**
     * Build modules from project
     * @param {Object} buildOptions - Build configuration
     * @returns {Promise<Object>} Build result
     */
    async build(buildOptions = {}) {
        const config = { ...this.options, ...buildOptions };
        const startTime = Date.now();

        try {
            console.log('🚀 Starting Custom Module Builder...');
            console.log(`📁 Root Path: ${config.rootPath}`);
            console.log(`📦 Output Dir: ${config.outputDir}`);

            // Step 1: Analyze project structure
            console.log('\n📊 Step 1: Analyzing project structure...');
            const projectAnalysis = await this.discovery.analyzeProjectStructure(config.rootPath);
            this.results.analysis = projectAnalysis;

            if (config.verbose) {
                this.printProjectAnalysis(projectAnalysis);
            }

            // Step 2: Determine entry points
            const entryPoints = config.entryPoints.length > 0 
                ? config.entryPoints.map(ep => PathUtils.resolve(config.rootPath, ep))
                : projectAnalysis.suggestedEntryPoints.slice(0, 3).map(ep => ep.path);

            if (entryPoints.length === 0) {
                throw new Error('No entry points found. Please specify entry points or ensure your project has common entry files.');
            }

            console.log(`\n🎯 Entry Points: ${entryPoints.map(ep => PathUtils.relative(config.rootPath, ep)).join(', ')}`);

            // Step 3: Discover dependencies recursively
            console.log('\n🔍 Step 2: Discovering dependencies recursively...');
            const discoveryResult = await this.discovery.discoverDependencies(entryPoints, config.rootPath);
            this.results.discovery = discoveryResult;

            if (config.verbose) {
                this.printDiscoveryResults(discoveryResult);
            }

            // Step 4: Build dependency graph
            console.log('\n🕸️  Step 3: Building dependency graph...');
            this.graph.buildFromDiscovery(discoveryResult);
            this.results.graph = this.graph.getStats();

            if (config.verbose) {
                this.printGraphAnalysis(this.results.graph);
            }

            // Step 5: Handle circular dependencies
            if (this.results.graph.circularDependencies.length > 0) {
                console.log('\n🔄 Step 4: Handling circular dependencies...');
                await this.handleCircularDependencies(this.results.graph.circularDependencies);
            }

            // Step 6: Bundle modules
            console.log('\n📦 Step 5: Bundling modules...');
            const outputDir = PathUtils.resolve(config.rootPath, config.outputDir);
            const bundleResult = await this.bundler.bundle(this.graph, entryPoints, outputDir);
            this.results.bundles = bundleResult;

            if (config.verbose) {
                this.printBundleResults(bundleResult);
            }

            // Step 7: Generate reports
            console.log('\n📋 Step 6: Generating reports...');
            await this.generateReports(outputDir);

            const endTime = Date.now();
            const duration = endTime - startTime;

            console.log(`\n✅ Build completed successfully in ${duration}ms`);
            console.log(`📁 Output directory: ${outputDir}`);

            return {
                success: true,
                duration,
                outputDir,
                entryPoints,
                ...this.results
            };

        } catch (error) {
            console.error('\n❌ Build failed:', error.message);
            if (config.verbose) {
                console.error(error.stack);
            }
            
            return {
                success: false,
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    /**
     * Print project analysis results
     * @param {Object} analysis - Project analysis result
     */
    printProjectAnalysis(analysis) {
        console.log(`   📊 Total Files: ${analysis.totalFiles}`);
        console.log(`   📁 Directories: ${analysis.analysis.directoryStructure.directories.length}`);
        console.log(`   🎯 Suggested Entry Points: ${analysis.suggestedEntryPoints.length}`);
        
        if (analysis.analysis.fileTypes) {
            console.log('   📄 File Types:');
            for (const [ext, count] of Object.entries(analysis.analysis.fileTypes)) {
                console.log(`      ${ext}: ${count} files`);
            }
        }

        if (analysis.analysis.directoryStructure.commonPatterns.length > 0) {
            console.log(`   🏗️  Patterns: ${analysis.analysis.directoryStructure.commonPatterns.join(', ')}`);
        }
    }

    /**
     * Print dependency discovery results
     * @param {Object} discovery - Discovery result
     */
    printDiscoveryResults(discovery) {
        console.log(`   📄 Files Scanned: ${discovery.stats.filesScanned}`);
        console.log(`   🔗 Dependencies Found: ${discovery.stats.dependenciesFound}`);
        console.log(`   🔄 Circular Dependencies: ${discovery.stats.circularDependencies}`);
        console.log(`   ❌ Errors: ${discovery.stats.errors}`);

        if (discovery.errors.length > 0) {
            console.log('   ⚠️  Errors:');
            discovery.errors.forEach(error => {
                console.log(`      ${PathUtils.relative(discovery.rootPath, error.file)}: ${error.error}`);
            });
        }
    }

    /**
     * Print graph analysis results
     * @param {Object} graphStats - Graph statistics
     */
    printGraphAnalysis(graphStats) {
        console.log(`   🏗️  Nodes: ${graphStats.metrics.nodeCount}`);
        console.log(`   🔗 Edges: ${graphStats.metrics.edgeCount}`);
        console.log(`   📊 Density: ${(graphStats.metrics.density * 100).toFixed(2)}%`);
        console.log(`   🎯 Entry Points: ${graphStats.entryPoints.length}`);
        console.log(`   🍃 Leaf Nodes: ${graphStats.leafNodes.length}`);
        console.log(`   🔄 Circular Dependencies: ${graphStats.circularDependencies.length}`);

        if (graphStats.circularDependencies.length > 0) {
            console.log('   ⚠️  Circular Dependency Cycles:');
            graphStats.circularDependencies.forEach((cycle, index) => {
                const cyclePath = cycle.map(nodeId => PathUtils.basename(nodeId)).join(' → ');
                console.log(`      ${index + 1}. ${cyclePath}`);
            });
        }
    }

    /**
     * Print bundle results
     * @param {Object} bundleResult - Bundle result
     */
    printBundleResults(bundleResult) {
        console.log(`   📦 Bundles Created: ${bundleResult.bundles.length}`);
        console.log(`   ✂️  Chunks Created: ${bundleResult.chunks.length}`);
        console.log(`   📊 Total Size: ${bundleResult.stats.totalSizeFormatted}`);
        console.log(`   🗜️  Optimization Savings: ${bundleResult.stats.optimizationSavingsFormatted}`);

        console.log('   📦 Bundle Details:');
        bundleResult.bundles.forEach(bundle => {
            console.log(`      ${bundle.name}: ${bundle.sizeFormatted} (${bundle.moduleCount} modules)`);
        });

        if (bundleResult.chunks.length > 0) {
            console.log('   ✂️  Chunk Details:');
            bundleResult.chunks.forEach(chunk => {
                console.log(`      ${chunk.name}: ${chunk.sizeFormatted} (${chunk.moduleCount} modules)`);
            });
        }
    }

    /**
     * Handle circular dependencies
     * @param {Array} circularDependencies - Circular dependency cycles
     */
    async handleCircularDependencies(circularDependencies) {
        console.log(`   Found ${circularDependencies.length} circular dependency cycle(s)`);
        
        for (let i = 0; i < circularDependencies.length; i++) {
            const cycle = circularDependencies[i];
            console.log(`   Cycle ${i + 1}: ${cycle.map(nodeId => PathUtils.basename(nodeId)).join(' → ')}`);
            
            // For now, just log the cycles. In a production bundler, you might:
            // 1. Try to break cycles by hoisting shared dependencies
            // 2. Create separate chunks for cyclic modules
            // 3. Use dynamic imports to break cycles
            // 4. Warn the user and suggest refactoring
        }
        
        console.log('   ⚠️  Note: Circular dependencies may cause runtime issues');
        console.log('   💡 Consider refactoring to remove circular dependencies');
    }

    /**
     * Generate comprehensive reports
     * @param {string} outputDir - Output directory
     */
    async generateReports(outputDir) {
        const reportsDir = PathUtils.join(outputDir, 'reports');
        await FileSystemUtils.ensureDirectory(reportsDir);

        // Generate dependency graph report
        const graphReport = this.graph.export('json', { 
            rootPath: this.options.rootPath,
            includeMetadata: true 
        });
        await FileSystemUtils.writeFileContent(
            PathUtils.join(reportsDir, 'dependency-graph.json'),
            graphReport
        );

        // Generate DOT file for Graphviz visualization
        const dotGraph = this.graph.export('dot', { 
            rootPath: this.options.rootPath,
            maxLabelLength: 25 
        });
        await FileSystemUtils.writeFileContent(
            PathUtils.join(reportsDir, 'dependency-graph.dot'),
            dotGraph
        );

        // Generate Mermaid diagram
        const mermaidGraph = this.graph.export('mermaid', { 
            rootPath: this.options.rootPath,
            maxLabelLength: 20 
        });
        await FileSystemUtils.writeFileContent(
            PathUtils.join(reportsDir, 'dependency-graph.mmd'),
            mermaidGraph
        );

        // Generate build report
        const buildReport = {
            timestamp: new Date().toISOString(),
            configuration: this.options,
            projectAnalysis: this.results.analysis,
            discoveryStats: this.results.discovery?.stats,
            graphMetrics: this.results.graph?.metrics,
            bundleStats: this.results.bundles?.stats,
            performance: {
                filesScanned: this.results.discovery?.stats.filesScanned || 0,
                dependenciesFound: this.results.discovery?.stats.dependenciesFound || 0,
                bundlesCreated: this.results.bundles?.bundles.length || 0,
                totalOutputSize: this.results.bundles?.stats.totalSize || 0
            }
        };

        await FileSystemUtils.writeFileContent(
            PathUtils.join(reportsDir, 'build-report.json'),
            JSON.stringify(buildReport, null, 2)
        );

        console.log(`   📋 Reports generated in: ${PathUtils.relative(this.options.rootPath, reportsDir)}`);
        console.log('      - dependency-graph.json (detailed graph data)');
        console.log('      - dependency-graph.dot (Graphviz visualization)');
        console.log('      - dependency-graph.mmd (Mermaid diagram)');
        console.log('      - build-report.json (comprehensive build report)');
    }

    /**
     * Analyze specific file dependencies
     * @param {string} filePath - File to analyze
     * @returns {Promise<Object>} File analysis result
     */
    async analyzeFile(filePath) {
        const absolutePath = PathUtils.resolve(this.options.rootPath, filePath);
        
        if (!await FileSystemUtils.exists(absolutePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        console.log(`🔍 Analyzing file: ${filePath}`);

        // Discover dependencies for this file
        const discoveryResult = await this.discovery.discoverDependencies([absolutePath], this.options.rootPath);
        
        // Build graph for this file
        const fileGraph = new DependencyGraph();
        fileGraph.buildFromDiscovery(discoveryResult);
        
        // Get dependency chain
        const dependencyChain = fileGraph.getDependencyChain(absolutePath);
        
        return {
            filePath: absolutePath,
            relativePath: PathUtils.relative(this.options.rootPath, absolutePath),
            dependencies: discoveryResult.dependencies[absolutePath]?.dependencies || [],
            dependencyChain,
            stats: discoveryResult.stats,
            graphMetrics: fileGraph.calculateMetrics()
        };
    }

    /**
     * Get project statistics
     * @returns {Promise<Object>} Project statistics
     */
    async getProjectStats() {
        const analysis = await this.discovery.analyzeProjectStructure(this.options.rootPath);
        
        return {
            rootPath: this.options.rootPath,
            totalFiles: analysis.totalFiles,
            fileTypes: analysis.analysis.fileTypes,
            directoryCount: analysis.analysis.directoryStructure.directories.length,
            maxDepth: analysis.analysis.directoryStructure.depth,
            patterns: analysis.analysis.directoryStructure.commonPatterns,
            suggestedEntryPoints: analysis.suggestedEntryPoints.length,
            hasPackageJson: analysis.analysis.hasPackageJson
        };
    }

    /**
     * Clear all cached data
     */
    clear() {
        this.discovery.reset();
        this.graph.clear();
        this.bundler.clear();
        this.results = {
            discovery: null,
            graph: null,
            bundles: null,
            analysis: null
        };
    }
}

// Export utilities for direct use
export {
    DependencyDiscovery,
    DependencyGraph,
    ModuleBundler,
    FileSystemUtils,
    PathUtils
};

// Default export
export default CustomModuleBuilder;
