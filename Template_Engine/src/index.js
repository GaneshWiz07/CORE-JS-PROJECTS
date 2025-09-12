import { RegexParser } from './core/RegexParser.js';
import { Tokenizer, TokenType, Token } from './core/Tokenizer.js';
import { ASTBuilder } from './core/ASTBuilder.js';
import { ScopeManager } from './core/ScopeManager.js';
import { TemplateCompiler } from './core/TemplateCompiler.js';

/**
 * Custom Template Engine - Main Entry Point
 * Demonstrates Regex Parsing, Tokenization, Abstract Syntax Tree, and Scope Handling
 */
export class TemplateEngine {
    constructor(options = {}) {
        this.options = {
            autoEscape: true,
            strictMode: false,
            cacheTemplates: true,
            maxCacheSize: 100,
            preserveWhitespace: false,
            allowUndefinedVariables: true,
            ...options
        };

        // Initialize core components
        this.parser = new RegexParser();
        this.tokenizer = new Tokenizer({
            preserveWhitespace: this.options.preserveWhitespace,
            preserveComments: false,
            trackPositions: true
        });
        this.astBuilder = new ASTBuilder({
            allowUndefinedVariables: this.options.allowUndefinedVariables,
            strictMode: this.options.strictMode,
            maxDepth: 100
        });
        this.compiler = new TemplateCompiler({
            autoEscape: this.options.autoEscape,
            strictMode: this.options.strictMode,
            cacheTemplates: this.options.cacheTemplates,
            maxCacheSize: this.options.maxCacheSize
        });

        // Global scope manager for shared functions and filters
        this.globalScope = new ScopeManager();
        this.templates = new Map();
        
        this.initializeGlobalFilters();
    }

    /**
     * Initialize global filters and functions
     */
    initializeGlobalFilters() {
        // Additional custom filters
        this.globalScope.registerFilter('truncate', (str, length = 50, suffix = '...') => {
            const s = String(str);
            return s.length > length ? s.substring(0, length) + suffix : s;
        });

        this.globalScope.registerFilter('pluralize', (count, singular, plural) => {
            return count === 1 ? singular : (plural || singular + 's');
        });

        this.globalScope.registerFilter('currency', (amount, symbol = '$') => {
            const num = parseFloat(amount);
            return isNaN(num) ? amount : symbol + num.toFixed(2);
        });

        this.globalScope.registerFilter('json', (obj) => {
            try {
                return JSON.stringify(obj, null, 2);
            } catch (error) {
                return String(obj);
            }
        });

        // Additional utility functions
        this.globalScope.registerFunction('now', () => new Date());
        this.globalScope.registerFunction('random', (min = 0, max = 1) => {
            return Math.random() * (max - min) + min;
        });
        this.globalScope.registerFunction('round', (num, decimals = 0) => {
            const factor = Math.pow(10, decimals);
            return Math.round(num * factor) / factor;
        });
    }

    /**
     * Render template with context data
     * @param {string} template - Template string
     * @param {Object} context - Context data
     * @param {string} name - Template name for caching
     * @returns {string} Rendered output
     */
    render(template, context = {}, name = null) {
        console.log('🎨 Rendering template...');
        
        try {
            // Compile template
            const compiledTemplate = this.compiler.compile(template, name);
            
            // Create scope with global functions/filters
            const renderScope = this.globalScope.clone();
            
            // Render with context
            const output = compiledTemplate(context, renderScope);
            
            console.log('✅ Template rendered successfully');
            return output;
            
        } catch (error) {
            console.error('❌ Template rendering failed:', error.message);
            throw new Error(`Template rendering failed: ${error.message}`);
        }
    }

    /**
     * Parse template and return detailed analysis
     * @param {string} template - Template string
     * @returns {Object} Template analysis
     */
    analyze(template) {
        console.log('🔍 Analyzing template...');
        
        try {
            // Step 1: Regex parsing
            const regexAnalysis = this.parser.parseAll(template);
            
            // Step 2: Tokenization
            const tokens = this.tokenizer.tokenize(template);
            const tokenStats = this.tokenizer.getStatistics();
            
            // Step 3: AST building
            const ast = this.astBuilder.build(template);
            const astStats = this.astBuilder.getASTStatistics(ast);
            const astErrors = this.astBuilder.getErrors();
            
            // Step 4: Validation
            const validation = this.parser.validateSyntax(template);
            const astValidation = this.astBuilder.validateAST(ast);
            
            console.log('✅ Template analysis complete');
            
            return {
                template,
                regexAnalysis,
                tokens: {
                    list: tokens,
                    statistics: tokenStats
                },
                ast: {
                    tree: ast,
                    statistics: astStats,
                    errors: astErrors
                },
                validation: {
                    syntax: validation,
                    ast: astValidation
                },
                summary: {
                    isValid: validation.valid && astValidation.valid,
                    totalTokens: tokens.length,
                    totalNodes: astStats.totalNodes,
                    variables: astStats.variables,
                    functions: astStats.functions,
                    blocks: astStats.blocks
                }
            };
            
        } catch (error) {
            console.error('❌ Template analysis failed:', error.message);
            throw new Error(`Template analysis failed: ${error.message}`);
        }
    }

    /**
     * Register custom filter
     * @param {string} name - Filter name
     * @param {Function} filter - Filter function
     */
    registerFilter(name, filter) {
        this.globalScope.registerFilter(name, filter);
    }

    /**
     * Register custom function
     * @param {string} name - Function name
     * @param {Function} func - Function implementation
     */
    registerFunction(name, func) {
        this.globalScope.registerFunction(name, func);
    }

    /**
     * Compile template without rendering
     * @param {string} template - Template string
     * @param {string} name - Template name
     * @returns {Function} Compiled template function
     */
    compile(template, name = null) {
        return this.compiler.compile(template, name);
    }

    /**
     * Precompile and store template
     * @param {string} name - Template name
     * @param {string} template - Template string
     */
    precompile(name, template) {
        const compiled = this.compile(template, name);
        this.templates.set(name, {
            template,
            compiled,
            compiledAt: new Date()
        });
    }

    /**
     * Render precompiled template
     * @param {string} name - Template name
     * @param {Object} context - Context data
     * @returns {string} Rendered output
     */
    renderTemplate(name, context = {}) {
        if (!this.templates.has(name)) {
            throw new Error(`Template '${name}' not found. Use precompile() first.`);
        }
        
        const templateData = this.templates.get(name);
        const renderScope = this.globalScope.clone();
        
        return templateData.compiled(context, renderScope);
    }

    /**
     * Get template cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return {
            compiler: this.compiler.getCacheStats(),
            precompiled: {
                size: this.templates.size,
                templates: Array.from(this.templates.keys())
            }
        };
    }

    /**
     * Clear all caches
     */
    clearCache() {
        this.compiler.clearCache();
        this.templates.clear();
    }

    /**
     * Create template from file (Node.js only)
     * @param {string} filePath - Path to template file
     * @param {Object} context - Context data
     * @returns {Promise<string>} Rendered output
     */
    async renderFile(filePath, context = {}) {
        try {
            const fs = await import('fs/promises');
            const template = await fs.readFile(filePath, 'utf8');
            return this.render(template, context, filePath);
        } catch (error) {
            throw new Error(`Failed to render file ${filePath}: ${error.message}`);
        }
    }

    /**
     * Batch render multiple templates
     * @param {Array} templates - Array of {template, context, name} objects
     * @returns {Array} Array of rendered outputs
     */
    renderBatch(templates) {
        return templates.map(({ template, context = {}, name = null }) => {
            try {
                return {
                    success: true,
                    output: this.render(template, context, name),
                    name
                };
            } catch (error) {
                return {
                    success: false,
                    error: error.message,
                    name
                };
            }
        });
    }

    /**
     * Debug template processing
     * @param {string} template - Template string
     * @returns {Object} Debug information
     */
    debug(template) {
        console.log('🐛 Debug mode: analyzing template step by step...');
        
        const debug = {
            template,
            steps: {}
        };
        
        try {
            // Step 1: Regex parsing
            console.log('Step 1: Regex parsing...');
            debug.steps.regexParsing = this.parser.parseAll(template);
            
            // Step 2: Tokenization
            console.log('Step 2: Tokenization...');
            const tokens = this.tokenizer.tokenize(template);
            debug.steps.tokenization = {
                tokens: tokens.map(t => t.toJSON()),
                statistics: this.tokenizer.getStatistics()
            };
            
            // Step 3: AST building
            console.log('Step 3: AST building...');
            const ast = this.astBuilder.build(template);
            debug.steps.astBuilding = {
                ast: ast.toJSON(),
                statistics: this.astBuilder.getASTStatistics(ast),
                errors: this.astBuilder.getErrors()
            };
            
            // Step 4: Code generation
            console.log('Step 4: Code generation...');
            const jsCode = this.compiler.generateCode(ast);
            debug.steps.codeGeneration = {
                code: jsCode
            };
            
            // Step 5: Scope analysis
            console.log('Step 5: Scope analysis...');
            debug.steps.scopeAnalysis = this.globalScope.debug();
            
            console.log('✅ Debug analysis complete');
            
        } catch (error) {
            debug.error = {
                message: error.message,
                stack: error.stack
            };
            console.error('❌ Debug analysis failed:', error.message);
        }
        
        return debug;
    }

    /**
     * Get engine statistics
     * @returns {Object} Engine statistics
     */
    getStats() {
        return {
            options: this.options,
            cache: this.getCacheStats(),
            globalScope: {
                variables: Object.keys(this.globalScope.getAllVariables()).length,
                functions: this.globalScope.functions.size,
                filters: this.globalScope.filters.size
            },
            precompiledTemplates: this.templates.size
        };
    }

    /**
     * Create a new engine instance with different options
     * @param {Object} options - New options
     * @returns {TemplateEngine} New engine instance
     */
    withOptions(options) {
        return new TemplateEngine({ ...this.options, ...options });
    }

    /**
     * Export template as different formats
     * @param {string} template - Template string
     * @param {string} format - Export format ('ast', 'tokens', 'code')
     * @returns {string} Exported template
     */
    export(template, format = 'ast') {
        const analysis = this.analyze(template);
        
        switch (format.toLowerCase()) {
            case 'ast':
                return JSON.stringify(analysis.ast.tree.toJSON(), null, 2);
                
            case 'tokens':
                return JSON.stringify(analysis.tokens.list.map(t => t.toJSON()), null, 2);
                
            case 'code':
                const jsCode = this.compiler.generateCode(analysis.ast.tree);
                return jsCode;
                
            case 'analysis':
                return JSON.stringify(analysis, null, 2);
                
            default:
                throw new Error(`Unknown export format: ${format}`);
        }
    }
}

// Export core components for advanced usage
export {
    RegexParser,
    Tokenizer,
    TokenType,
    Token,
    ASTBuilder,
    ScopeManager,
    TemplateCompiler
};

// Default export
export default TemplateEngine;
