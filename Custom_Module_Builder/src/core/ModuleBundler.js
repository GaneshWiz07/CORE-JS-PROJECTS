import { FileSystemUtils } from '../utils/FileSystemUtils.js';
import { PathUtils } from '../utils/PathUtils.js';
import { DependencyGraph } from './DependencyGraph.js';

/**
 * Module Bundler with dependency resolution and optimization
 * Bundles modules based on dependency graph analysis
 */
export class ModuleBundler {
    constructor(options = {}) {
        this.options = {
            outputFormat: 'esm', // 'esm', 'cjs', 'iife', 'umd'
            minify: false,
            sourceMaps: false,
            treeshake: true,
            bundleSplitting: false,
            chunkSize: 50000, // bytes
            ...options
        };
        
        this.graph = null;
        this.bundles = new Map();
        this.chunks = new Map();
        this.stats = {
            totalSize: 0,
            bundleCount: 0,
            chunkCount: 0,
            optimizationSavings: 0
        };
    }

    /**
     * Bundle modules from dependency graph
     * @param {DependencyGraph} dependencyGraph - Dependency graph
     * @param {Array<string>} entryPoints - Entry point file paths
     * @param {string} outputDir - Output directory
     * @returns {Promise<Object>} Bundle result
     */
    async bundle(dependencyGraph, entryPoints, outputDir) {
        console.log('📦 Starting module bundling...');
        
        this.graph = dependencyGraph;
        const bundleResult = {
            bundles: [],
            chunks: [],
            stats: {},
            outputDir,
            entryPoints
        };

        try {
            // Ensure output directory exists
            await FileSystemUtils.ensureDirectory(outputDir);

            // Analyze and optimize dependency order
            const bundleOrder = this.calculateBundleOrder(entryPoints);
            console.log(`📋 Bundle order calculated: ${bundleOrder.length} modules`);

            // Create bundles based on entry points
            for (const entryPoint of entryPoints) {
                const bundle = await this.createBundle(entryPoint, bundleOrder, outputDir);
                bundleResult.bundles.push(bundle);
            }

            // Handle code splitting if enabled
            if (this.options.bundleSplitting) {
                const sharedChunks = await this.createSharedChunks(bundleOrder, outputDir);
                bundleResult.chunks = sharedChunks;
            }

            // Generate bundle statistics
            bundleResult.stats = this.generateBundleStats();
            
            console.log(`✅ Bundling complete: ${bundleResult.bundles.length} bundles, ${bundleResult.chunks.length} chunks`);
            return bundleResult;

        } catch (error) {
            console.error('❌ Bundling failed:', error.message);
            throw error;
        }
    }

    /**
     * Calculate optimal bundle order using topological sort
     * @param {Array<string>} entryPoints - Entry point file paths
     * @returns {Array<string>} Ordered list of modules
     */
    calculateBundleOrder(entryPoints) {
        console.log('🔄 Calculating bundle order...');
        
        try {
            // Get topological sort of entire graph
            const topologicalOrder = this.graph.getTopologicalSort();
            
            // Filter to include only reachable modules from entry points
            const reachableModules = new Set();
            
            for (const entryPoint of entryPoints) {
                const chain = this.graph.getDependencyChain(entryPoint);
                for (const node of chain.chain) {
                    reachableModules.add(node.id);
                }
            }
            
            // Filter topological order to only include reachable modules
            const bundleOrder = topologicalOrder.filter(moduleId => 
                reachableModules.has(moduleId)
            );
            
            return bundleOrder;
            
        } catch (error) {
            console.warn('⚠️  Topological sort failed (likely due to cycles), using DFS order');
            return this.calculateDFSOrder(entryPoints);
        }
    }

    /**
     * Calculate bundle order using DFS (fallback for cyclic graphs)
     * @param {Array<string>} entryPoints - Entry point file paths
     * @returns {Array<string>} DFS ordered list of modules
     */
    calculateDFSOrder(entryPoints) {
        const visited = new Set();
        const order = [];

        const dfs = (moduleId) => {
            if (visited.has(moduleId)) return;
            
            visited.add(moduleId);
            const node = this.graph.nodes.get(moduleId);
            
            if (node) {
                // Visit dependencies first
                for (const depId of node.dependencies) {
                    dfs(depId);
                }
                order.push(moduleId);
            }
        };

        for (const entryPoint of entryPoints) {
            dfs(entryPoint);
        }

        return order;
    }

    /**
     * Create a bundle for an entry point
     * @param {string} entryPoint - Entry point file path
     * @param {Array<string>} bundleOrder - Module order
     * @param {string} outputDir - Output directory
     * @returns {Promise<Object>} Bundle information
     */
    async createBundle(entryPoint, bundleOrder, outputDir) {
        const bundleName = this.generateBundleName(entryPoint);
        const outputPath = PathUtils.join(outputDir, `${bundleName}.js`);
        
        console.log(`📦 Creating bundle: ${bundleName}`);

        // Get modules for this entry point
        const entryChain = this.graph.getDependencyChain(entryPoint);
        const moduleIds = new Set(entryChain.chain.map(node => node.id));
        
        // Filter bundle order to this entry point's modules
        const bundleModules = bundleOrder.filter(moduleId => moduleIds.has(moduleId));
        
        // Generate bundle content
        const bundleContent = await this.generateBundleContent(bundleModules, entryPoint);
        
        // Apply optimizations
        const optimizedContent = await this.optimizeBundle(bundleContent);
        
        // Write bundle to file
        await FileSystemUtils.writeFileContent(outputPath, optimizedContent);
        
        const bundle = {
            name: bundleName,
            entryPoint,
            outputPath,
            modules: bundleModules,
            size: optimizedContent.length,
            moduleCount: bundleModules.length
        };
        
        this.bundles.set(bundleName, bundle);
        this.stats.bundleCount++;
        this.stats.totalSize += bundle.size;
        
        return bundle;
    }

    /**
     * Generate bundle content from modules
     * @param {Array<string>} moduleIds - Module IDs to include
     * @param {string} entryPoint - Entry point module
     * @returns {Promise<string>} Bundle content
     */
    async generateBundleContent(moduleIds, entryPoint) {
        const moduleContents = new Map();
        const moduleExports = new Map();
        
        // Read all module contents
        for (const moduleId of moduleIds) {
            try {
                const content = await FileSystemUtils.readFileContent(moduleId);
                const processedContent = await this.processModuleContent(content, moduleId);
                moduleContents.set(moduleId, processedContent);
                
                // Extract exports information
                const exports = this.extractModuleExports(content);
                moduleExports.set(moduleId, exports);
                
            } catch (error) {
                console.error(`❌ Error reading module ${moduleId}:`, error.message);
                moduleContents.set(moduleId, `// Error loading module: ${error.message}`);
            }
        }

        // Generate bundle based on output format
        switch (this.options.outputFormat) {
            case 'esm':
                return this.generateESMBundle(moduleContents, moduleExports, entryPoint);
            case 'cjs':
                return this.generateCJSBundle(moduleContents, moduleExports, entryPoint);
            case 'iife':
                return this.generateIIFEBundle(moduleContents, moduleExports, entryPoint);
            case 'umd':
                return this.generateUMDBundle(moduleContents, moduleExports, entryPoint);
            default:
                throw new Error(`Unsupported output format: ${this.options.outputFormat}`);
        }
    }

    /**
     * Process individual module content
     * @param {string} content - Module content
     * @param {string} moduleId - Module ID
     * @returns {Promise<string>} Processed content
     */
    async processModuleContent(content, moduleId) {
        let processed = content;
        
        // Replace import statements with internal module references
        processed = this.replaceImports(processed, moduleId);
        
        // Replace export statements
        processed = this.replaceExports(processed, moduleId);
        
        // Add module wrapper if needed
        processed = this.wrapModule(processed, moduleId);
        
        return processed;
    }

    /**
     * Replace import statements in module content
     * @param {string} content - Module content
     * @param {string} moduleId - Current module ID
     * @returns {string} Content with replaced imports
     */
    replaceImports(content, moduleId) {
        // Replace ES6 imports
        const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"`]([^'"`]+)['"`]/g;
        
        return content.replace(importRegex, (match, importPath) => {
            const resolvedPath = this.resolveImportPath(importPath, moduleId);
            if (resolvedPath && this.graph.nodes.has(resolvedPath)) {
                const moduleVar = this.getModuleVariable(resolvedPath);
                return `// Import from ${importPath} -> ${moduleVar}`;
            }
            return match; // Keep external imports as-is
        });
    }

    /**
     * Replace export statements in module content
     * @param {string} content - Module content
     * @param {string} moduleId - Current module ID
     * @returns {string} Content with replaced exports
     */
    replaceExports(content, moduleId) {
        const moduleVar = this.getModuleVariable(moduleId);
        
        // Replace export default
        content = content.replace(/export\s+default\s+/g, `${moduleVar}.default = `);
        
        // Replace named exports
        content = content.replace(/export\s+\{([^}]+)\}/g, (match, exports) => {
            const exportList = exports.split(',').map(exp => exp.trim());
            return exportList.map(exp => `${moduleVar}.${exp} = ${exp};`).join('\n');
        });
        
        // Replace export const/let/var/function/class
        content = content.replace(/export\s+(const|let|var|function|class)\s+(\w+)/g, 
            (match, type, name) => {
                return `${type} ${name}`;
            }
        );
        
        return content;
    }

    /**
     * Wrap module content in a function
     * @param {string} content - Module content
     * @param {string} moduleId - Module ID
     * @returns {string} Wrapped content
     */
    wrapModule(content, moduleId) {
        const moduleVar = this.getModuleVariable(moduleId);
        const relativePath = this.graph.nodes.get(moduleId)?.relativePath || moduleId;
        
        return `
// Module: ${relativePath}
(function() {
  const ${moduleVar} = {};
  
  ${content}
  
  return ${moduleVar};
})();
`;
    }

    /**
     * Generate ESM bundle
     * @param {Map} moduleContents - Module contents map
     * @param {Map} moduleExports - Module exports map
     * @param {string} entryPoint - Entry point module
     * @returns {string} ESM bundle content
     */
    generateESMBundle(moduleContents, moduleExports, entryPoint) {
        let bundle = `// ESM Bundle generated by Custom Module Builder\n`;
        bundle += `// Entry Point: ${entryPoint}\n`;
        bundle += `// Generated: ${new Date().toISOString()}\n\n`;
        
        // Add all modules
        for (const [moduleId, content] of moduleContents) {
            bundle += content + '\n\n';
        }
        
        // Export entry point
        const entryVar = this.getModuleVariable(entryPoint);
        bundle += `\n// Export entry point\nexport default ${entryVar};\n`;
        
        return bundle;
    }

    /**
     * Generate CommonJS bundle
     * @param {Map} moduleContents - Module contents map
     * @param {Map} moduleExports - Module exports map
     * @param {string} entryPoint - Entry point module
     * @returns {string} CommonJS bundle content
     */
    generateCJSBundle(moduleContents, moduleExports, entryPoint) {
        let bundle = `// CommonJS Bundle generated by Custom Module Builder\n`;
        bundle += `// Entry Point: ${entryPoint}\n`;
        bundle += `// Generated: ${new Date().toISOString()}\n\n`;
        
        // Add all modules
        for (const [moduleId, content] of moduleContents) {
            bundle += content + '\n\n';
        }
        
        // Export entry point
        const entryVar = this.getModuleVariable(entryPoint);
        bundle += `\n// Export entry point\nmodule.exports = ${entryVar};\n`;
        
        return bundle;
    }

    /**
     * Generate IIFE bundle
     * @param {Map} moduleContents - Module contents map
     * @param {Map} moduleExports - Module exports map
     * @param {string} entryPoint - Entry point module
     * @returns {string} IIFE bundle content
     */
    generateIIFEBundle(moduleContents, moduleExports, entryPoint) {
        const bundleName = this.generateBundleName(entryPoint);
        
        let bundle = `// IIFE Bundle generated by Custom Module Builder\n`;
        bundle += `// Entry Point: ${entryPoint}\n`;
        bundle += `// Generated: ${new Date().toISOString()}\n\n`;
        
        bundle += `(function(global) {\n`;
        bundle += `  'use strict';\n\n`;
        
        // Add all modules
        for (const [moduleId, content] of moduleContents) {
            bundle += '  ' + content.replace(/\n/g, '\n  ') + '\n\n';
        }
        
        // Export to global
        const entryVar = this.getModuleVariable(entryPoint);
        bundle += `  // Export to global\n`;
        bundle += `  global.${bundleName} = ${entryVar};\n`;
        bundle += `})(typeof window !== 'undefined' ? window : global);\n`;
        
        return bundle;
    }

    /**
     * Generate UMD bundle
     * @param {Map} moduleContents - Module contents map
     * @param {Map} moduleExports - Module exports map
     * @param {string} entryPoint - Entry point module
     * @returns {string} UMD bundle content
     */
    generateUMDBundle(moduleContents, moduleExports, entryPoint) {
        const bundleName = this.generateBundleName(entryPoint);
        
        let bundle = `// UMD Bundle generated by Custom Module Builder\n`;
        bundle += `// Entry Point: ${entryPoint}\n`;
        bundle += `// Generated: ${new Date().toISOString()}\n\n`;
        
        bundle += `(function (root, factory) {\n`;
        bundle += `  if (typeof define === 'function' && define.amd) {\n`;
        bundle += `    define([], factory);\n`;
        bundle += `  } else if (typeof module === 'object' && module.exports) {\n`;
        bundle += `    module.exports = factory();\n`;
        bundle += `  } else {\n`;
        bundle += `    root.${bundleName} = factory();\n`;
        bundle += `  }\n`;
        bundle += `}(typeof self !== 'undefined' ? self : this, function () {\n`;
        bundle += `  'use strict';\n\n`;
        
        // Add all modules
        for (const [moduleId, content] of moduleContents) {
            bundle += '  ' + content.replace(/\n/g, '\n  ') + '\n\n';
        }
        
        // Return entry point
        const entryVar = this.getModuleVariable(entryPoint);
        bundle += `  return ${entryVar};\n`;
        bundle += `}));\n`;
        
        return bundle;
    }

    /**
     * Optimize bundle content
     * @param {string} content - Bundle content
     * @returns {Promise<string>} Optimized content
     */
    async optimizeBundle(content) {
        let optimized = content;
        const originalSize = content.length;
        
        if (this.options.treeshake) {
            optimized = this.treeshakeBundle(optimized);
        }
        
        if (this.options.minify) {
            optimized = this.minifyBundle(optimized);
        }
        
        const optimizedSize = optimized.length;
        this.stats.optimizationSavings += originalSize - optimizedSize;
        
        return optimized;
    }

    /**
     * Tree shake unused code from bundle
     * @param {string} content - Bundle content
     * @returns {string} Tree-shaken content
     */
    treeshakeBundle(content) {
        // Simple tree shaking - remove unused functions and variables
        // This is a basic implementation; real tree shaking is much more complex
        
        // Remove unused imports (already handled in processing)
        // Remove dead code (unreachable code after return statements)
        content = content.replace(/return\s+[^;]+;[\s\S]*?(?=\n\s*}|\n\s*$)/g, (match) => {
            return match.split('\n')[0];
        });
        
        // Remove empty lines and excessive whitespace
        content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
        
        return content;
    }

    /**
     * Minify bundle content
     * @param {string} content - Bundle content
     * @returns {string} Minified content
     */
    minifyBundle(content) {
        // Basic minification - remove comments and excessive whitespace
        // For production use, integrate with a proper minifier like Terser
        
        // Remove single-line comments
        content = content.replace(/\/\/.*$/gm, '');
        
        // Remove multi-line comments
        content = content.replace(/\/\*[\s\S]*?\*\//g, '');
        
        // Remove excessive whitespace
        content = content.replace(/\s+/g, ' ');
        content = content.replace(/\s*([{}();,])\s*/g, '$1');
        
        // Remove leading/trailing whitespace
        content = content.trim();
        
        return content;
    }

    /**
     * Create shared chunks for code splitting
     * @param {Array<string>} bundleOrder - Module order
     * @param {string} outputDir - Output directory
     * @returns {Promise<Array>} Shared chunks
     */
    async createSharedChunks(bundleOrder, outputDir) {
        console.log('✂️  Creating shared chunks...');
        
        const sharedModules = this.findSharedModules();
        const chunks = [];
        
        if (sharedModules.length > 0) {
            const chunkContent = await this.generateBundleContent(sharedModules, sharedModules[0]);
            const chunkPath = PathUtils.join(outputDir, 'shared.js');
            
            await FileSystemUtils.writeFileContent(chunkPath, chunkContent);
            
            const chunk = {
                name: 'shared',
                modules: sharedModules,
                outputPath: chunkPath,
                size: chunkContent.length
            };
            
            chunks.push(chunk);
            this.chunks.set('shared', chunk);
            this.stats.chunkCount++;
        }
        
        return chunks;
    }

    /**
     * Find modules shared between multiple bundles
     * @returns {Array<string>} Shared module IDs
     */
    findSharedModules() {
        const moduleUsage = new Map();
        
        // Count usage of each module across bundles
        for (const bundle of this.bundles.values()) {
            for (const moduleId of bundle.modules) {
                moduleUsage.set(moduleId, (moduleUsage.get(moduleId) || 0) + 1);
            }
        }
        
        // Find modules used by multiple bundles
        const sharedModules = [];
        for (const [moduleId, usage] of moduleUsage) {
            if (usage > 1) {
                sharedModules.push(moduleId);
            }
        }
        
        return sharedModules;
    }

    /**
     * Generate bundle name from entry point
     * @param {string} entryPoint - Entry point file path
     * @returns {string} Bundle name
     */
    generateBundleName(entryPoint) {
        const basename = PathUtils.basename(entryPoint, PathUtils.extname(entryPoint));
        return basename.replace(/[^a-zA-Z0-9]/g, '_');
    }

    /**
     * Get module variable name
     * @param {string} moduleId - Module ID
     * @returns {string} Variable name
     */
    getModuleVariable(moduleId) {
        const basename = PathUtils.basename(moduleId, PathUtils.extname(moduleId));
        return `module_${basename.replace(/[^a-zA-Z0-9]/g, '_')}`;
    }

    /**
     * Resolve import path relative to current module
     * @param {string} importPath - Import path
     * @param {string} currentModule - Current module ID
     * @returns {string|null} Resolved path
     */
    resolveImportPath(importPath, currentModule) {
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
            const currentDir = PathUtils.dirname(currentModule);
            return PathUtils.resolve(currentDir, importPath);
        }
        return null; // External module
    }

    /**
     * Extract module exports from content
     * @param {string} content - Module content
     * @returns {Object} Exports information
     */
    extractModuleExports(content) {
        const exports = {
            default: null,
            named: []
        };
        
        // Find default export
        const defaultMatch = content.match(/export\s+default\s+(\w+)/);
        if (defaultMatch) {
            exports.default = defaultMatch[1];
        }
        
        // Find named exports
        const namedMatches = content.matchAll(/export\s+(?:const|let|var|function|class)\s+(\w+)/g);
        for (const match of namedMatches) {
            exports.named.push(match[1]);
        }
        
        return exports;
    }

    /**
     * Generate bundle statistics
     * @returns {Object} Bundle statistics
     */
    generateBundleStats() {
        const stats = {
            ...this.stats,
            bundles: Array.from(this.bundles.values()).map(bundle => ({
                name: bundle.name,
                size: bundle.size,
                moduleCount: bundle.moduleCount,
                sizeFormatted: FileSystemUtils.formatFileSize(bundle.size)
            })),
            chunks: Array.from(this.chunks.values()).map(chunk => ({
                name: chunk.name,
                size: chunk.size,
                moduleCount: chunk.modules.length,
                sizeFormatted: FileSystemUtils.formatFileSize(chunk.size)
            })),
            totalSizeFormatted: FileSystemUtils.formatFileSize(this.stats.totalSize),
            optimizationSavingsFormatted: FileSystemUtils.formatFileSize(this.stats.optimizationSavings)
        };
        
        return stats;
    }

    /**
     * Clear bundler state
     */
    clear() {
        this.graph = null;
        this.bundles.clear();
        this.chunks.clear();
        this.stats = {
            totalSize: 0,
            bundleCount: 0,
            chunkCount: 0,
            optimizationSavings: 0
        };
    }
}
