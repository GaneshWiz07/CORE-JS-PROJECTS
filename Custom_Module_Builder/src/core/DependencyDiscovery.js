import { FileSystemUtils } from '../utils/FileSystemUtils.js';
import { PathUtils } from '../utils/PathUtils.js';

/**
 * Dependency Discovery Engine using Recursion
 * Recursively traverses files and discovers import/require dependencies
 */
export class DependencyDiscovery {
    constructor(options = {}) {
        this.options = {
            extensions: ['.js', '.mjs', '.ts', '.jsx', '.tsx'],
            maxDepth: 20,
            followSymlinks: false,
            ignorePatterns: [
                /node_modules/,
                /\.git/,
                /dist/,
                /build/,
                /coverage/
            ],
            ...options
        };
        
        this.cache = new Map();
        this.visitedFiles = new Set();
        this.stats = {
            filesScanned: 0,
            dependenciesFound: 0,
            circularDependencies: 0,
            errors: 0
        };
    }

    /**
     * Discover all dependencies starting from entry points (recursive)
     * @param {string|Array<string>} entryPoints - Entry point file(s)
     * @param {string} rootPath - Root project path
     * @returns {Promise<Object>} Dependency discovery result
     */
    async discoverDependencies(entryPoints, rootPath) {
        const entries = Array.isArray(entryPoints) ? entryPoints : [entryPoints];
        const dependencies = new Map();
        const errors = [];

        console.log(`🔍 Starting dependency discovery from ${entries.length} entry point(s)...`);

        for (const entry of entries) {
            const entryPath = PathUtils.resolve(rootPath, entry);
            
            try {
                await this.discoverRecursive(entryPath, rootPath, dependencies, [], 0);
            } catch (error) {
                errors.push({
                    file: entryPath,
                    error: error.message
                });
                this.stats.errors++;
            }
        }

        return {
            dependencies: Object.fromEntries(dependencies),
            stats: this.stats,
            errors,
            rootPath,
            entryPoints: entries
        };
    }

    /**
     * Recursive dependency discovery function
     * @param {string} filePath - Current file path
     * @param {string} rootPath - Root project path
     * @param {Map} dependencies - Dependencies map
     * @param {Array} currentPath - Current dependency path (for circular detection)
     * @param {number} depth - Current recursion depth
     * @returns {Promise<void>}
     */
    async discoverRecursive(filePath, rootPath, dependencies, currentPath, depth) {
        // Prevent infinite recursion
        if (depth > this.options.maxDepth) {
            console.warn(`⚠️  Max depth reached for ${filePath}`);
            return;
        }

        // Check if already visited
        if (this.visitedFiles.has(filePath)) {
            return;
        }

        // Check for circular dependencies
        if (currentPath.includes(filePath)) {
            console.warn(`🔄 Circular dependency detected: ${currentPath.join(' -> ')} -> ${filePath}`);
            this.stats.circularDependencies++;
            return;
        }

        // Check if file exists and is supported
        if (!await FileSystemUtils.exists(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const stats = await FileSystemUtils.getFileStats(filePath);
        if (!stats.isFile) {
            return;
        }

        // Check file extension
        const ext = PathUtils.extname(filePath);
        if (!this.options.extensions.includes(ext)) {
            return;
        }

        // Check ignore patterns
        if (this.shouldIgnore(filePath)) {
            return;
        }

        this.visitedFiles.add(filePath);
        this.stats.filesScanned++;

        console.log(`📄 Analyzing: ${PathUtils.relative(rootPath, filePath)} (depth: ${depth})`);

        try {
            // Read and parse file content
            const content = await FileSystemUtils.readFileContent(filePath);
            const fileDependencies = this.parseFileDependencies(content, filePath, rootPath);

            // Store file dependencies
            dependencies.set(filePath, {
                path: filePath,
                relativePath: PathUtils.relative(rootPath, filePath),
                dependencies: fileDependencies,
                stats,
                depth,
                lastModified: stats.modified
            });

            this.stats.dependenciesFound += fileDependencies.length;

            // Recursively process dependencies
            const newPath = [...currentPath, filePath];
            
            for (const dep of fileDependencies) {
                if (dep.resolved && dep.type === 'local') {
                    try {
                        await this.discoverRecursive(
                            dep.resolved,
                            rootPath,
                            dependencies,
                            newPath,
                            depth + 1
                        );
                    } catch (error) {
                        console.error(`❌ Error processing dependency ${dep.resolved}:`, error.message);
                        this.stats.errors++;
                    }
                }
            }

        } catch (error) {
            console.error(`❌ Error analyzing ${filePath}:`, error.message);
            this.stats.errors++;
            throw error;
        }
    }

    /**
     * Parse file content to extract dependencies
     * @param {string} content - File content
     * @param {string} filePath - Current file path
     * @param {string} rootPath - Root project path
     * @returns {Array} Array of dependency objects
     */
    parseFileDependencies(content, filePath, rootPath) {
        const dependencies = [];
        const fileDir = PathUtils.dirname(filePath);

        // ES6 import patterns
        const importPatterns = [
            // import ... from '...'
            /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"`]([^'"`]+)['"`]/g,
            // import('...')
            /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
            // export ... from '...'
            /export\s+(?:\{[^}]*\}|\*)\s+from\s+['"`]([^'"`]+)['"`]/g
        ];

        // CommonJS require patterns
        const requirePatterns = [
            // require('...')
            /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g
        ];

        // Process ES6 imports
        for (const pattern of importPatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const importPath = match[1];
                const dependency = this.resolveDependency(importPath, fileDir, rootPath);
                dependencies.push({
                    ...dependency,
                    type: dependency.type || 'es6',
                    line: this.getLineNumber(content, match.index)
                });
            }
        }

        // Process CommonJS requires
        for (const pattern of requirePatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const requirePath = match[1];
                const dependency = this.resolveDependency(requirePath, fileDir, rootPath);
                dependencies.push({
                    ...dependency,
                    type: dependency.type || 'commonjs',
                    line: this.getLineNumber(content, match.index)
                });
            }
        }

        return dependencies;
    }

    /**
     * Resolve dependency path to absolute path
     * @param {string} importPath - Import path from code
     * @param {string} fileDir - Directory of current file
     * @param {string} rootPath - Root project path
     * @returns {Object} Dependency resolution result
     */
    resolveDependency(importPath, fileDir, rootPath) {
        const dependency = {
            original: importPath,
            resolved: null,
            type: null,
            exists: false
        };

        // Determine dependency type
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
            dependency.type = 'local';
        } else if (importPath.startsWith('/')) {
            dependency.type = 'absolute';
        } else {
            dependency.type = 'external';
        }

        // Only resolve local and absolute dependencies
        if (dependency.type === 'local' || dependency.type === 'absolute') {
            const resolution = PathUtils.resolveImport(importPath, fileDir, this.options.extensions);
            
            // Try each candidate path
            for (const candidate of resolution.candidates) {
                if (this.cache.has(candidate)) {
                    dependency.resolved = candidate;
                    dependency.exists = this.cache.get(candidate);
                    break;
                }
                
                // Check if file exists (async operation would be better, but keeping sync for simplicity)
                try {
                    const exists = require('fs').existsSync(candidate);
                    this.cache.set(candidate, exists);
                    
                    if (exists) {
                        dependency.resolved = candidate;
                        dependency.exists = true;
                        break;
                    }
                } catch (error) {
                    this.cache.set(candidate, false);
                }
            }
        }

        return dependency;
    }

    /**
     * Get line number for a character index in content
     * @param {string} content - File content
     * @param {number} index - Character index
     * @returns {number} Line number
     */
    getLineNumber(content, index) {
        return content.substring(0, index).split('\n').length;
    }

    /**
     * Check if file should be ignored
     * @param {string} filePath - File path to check
     * @returns {boolean} True if should be ignored
     */
    shouldIgnore(filePath) {
        return this.options.ignorePatterns.some(pattern => {
            if (pattern instanceof RegExp) {
                return pattern.test(filePath);
            }
            return filePath.includes(pattern);
        });
    }

    /**
     * Find all JavaScript/TypeScript files recursively
     * @param {string} rootPath - Root directory path
     * @returns {Promise<Array>} Array of file paths
     */
    async findSourceFiles(rootPath) {
        const extensions = this.options.extensions;
        const pattern = new RegExp(`\\.(${extensions.map(ext => ext.slice(1)).join('|')})$`);
        
        const files = await FileSystemUtils.findFiles(rootPath, pattern, {
            maxDepth: this.options.maxDepth
        });

        return files
            .filter(file => !this.shouldIgnore(file.path))
            .map(file => file.path);
    }

    /**
     * Analyze project structure and suggest entry points
     * @param {string} rootPath - Root project path
     * @returns {Promise<Object>} Analysis result with suggested entry points
     */
    async analyzeProjectStructure(rootPath) {
        console.log(`🔍 Analyzing project structure in ${rootPath}...`);

        const sourceFiles = await this.findSourceFiles(rootPath);
        const entryPointCandidates = [];
        const packageJsonPath = PathUtils.join(rootPath, 'package.json');

        // Check package.json for entry points
        if (await FileSystemUtils.exists(packageJsonPath)) {
            try {
                const packageContent = await FileSystemUtils.readFileContent(packageJsonPath);
                const packageJson = JSON.parse(packageContent);
                
                if (packageJson.main) {
                    entryPointCandidates.push({
                        path: PathUtils.resolve(rootPath, packageJson.main),
                        source: 'package.json main',
                        priority: 10
                    });
                }
                
                if (packageJson.module) {
                    entryPointCandidates.push({
                        path: PathUtils.resolve(rootPath, packageJson.module),
                        source: 'package.json module',
                        priority: 9
                    });
                }
            } catch (error) {
                console.warn(`⚠️  Could not parse package.json: ${error.message}`);
            }
        }

        // Look for common entry point patterns
        const commonEntryPoints = [
            'index.js', 'index.mjs', 'index.ts',
            'main.js', 'main.mjs', 'main.ts',
            'app.js', 'app.mjs', 'app.ts',
            'src/index.js', 'src/index.mjs', 'src/index.ts',
            'src/main.js', 'src/main.mjs', 'src/main.ts'
        ];

        for (const entryPoint of commonEntryPoints) {
            const fullPath = PathUtils.resolve(rootPath, entryPoint);
            if (await FileSystemUtils.exists(fullPath)) {
                entryPointCandidates.push({
                    path: fullPath,
                    source: 'common pattern',
                    priority: 5
                });
            }
        }

        // Sort by priority
        entryPointCandidates.sort((a, b) => b.priority - a.priority);

        return {
            rootPath,
            totalFiles: sourceFiles.length,
            sourceFiles,
            suggestedEntryPoints: entryPointCandidates,
            analysis: {
                hasPackageJson: await FileSystemUtils.exists(packageJsonPath),
                fileTypes: this.analyzeFileTypes(sourceFiles),
                directoryStructure: await this.analyzeDirectoryStructure(rootPath, sourceFiles)
            }
        };
    }

    /**
     * Analyze file types in the project
     * @param {Array<string>} sourceFiles - Array of source file paths
     * @returns {Object} File type analysis
     */
    analyzeFileTypes(sourceFiles) {
        const types = {};
        
        for (const file of sourceFiles) {
            const ext = PathUtils.extname(file);
            types[ext] = (types[ext] || 0) + 1;
        }
        
        return types;
    }

    /**
     * Analyze directory structure
     * @param {string} rootPath - Root project path
     * @param {Array<string>} sourceFiles - Array of source file paths
     * @returns {Promise<Object>} Directory structure analysis
     */
    async analyzeDirectoryStructure(rootPath, sourceFiles) {
        const directories = new Set();
        
        for (const file of sourceFiles) {
            const relativePath = PathUtils.relative(rootPath, file);
            const dir = PathUtils.dirname(relativePath);
            if (dir !== '.') {
                directories.add(dir);
            }
        }
        
        const structure = Array.from(directories).sort();
        
        return {
            directories: structure,
            depth: Math.max(...structure.map(dir => PathUtils.getDepth(dir)), 0),
            commonPatterns: this.identifyCommonPatterns(structure)
        };
    }

    /**
     * Identify common directory patterns
     * @param {Array<string>} directories - Array of directory paths
     * @returns {Array<string>} Common patterns found
     */
    identifyCommonPatterns(directories) {
        const patterns = [];
        const dirSet = new Set(directories);
        
        // Check for common patterns
        if (dirSet.has('src')) patterns.push('src-based');
        if (dirSet.has('lib')) patterns.push('lib-based');
        if (dirSet.has('components')) patterns.push('component-based');
        if (dirSet.has('modules')) patterns.push('module-based');
        if (dirSet.has('utils') || dirSet.has('utilities')) patterns.push('utility-based');
        if (dirSet.has('services')) patterns.push('service-based');
        
        return patterns;
    }

    /**
     * Clear cache and reset stats
     */
    reset() {
        this.cache.clear();
        this.visitedFiles.clear();
        this.stats = {
            filesScanned: 0,
            dependenciesFound: 0,
            circularDependencies: 0,
            errors: 0
        };
    }

    /**
     * Get discovery statistics
     * @returns {Object} Current statistics
     */
    getStats() {
        return { ...this.stats };
    }
}
