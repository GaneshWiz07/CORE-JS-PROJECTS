import { ASTBuilder } from './ASTBuilder.js';
import { ScopeManager } from './ScopeManager.js';

/**
 * Template Compiler for Template Engine
 * Compiles AST into executable template functions
 */
export class TemplateCompiler {
    constructor(options = {}) {
        this.options = {
            autoEscape: true,
            strictMode: false,
            cacheTemplates: true,
            maxCacheSize: 100,
            ...options
        };
        
        this.astBuilder = new ASTBuilder();
        this.templateCache = new Map();
        this.compiledFunctions = new Map();
    }

    /**
     * Compile template string into executable function
     * @param {string} template - Template string
     * @param {string} name - Template name for caching
     * @returns {Function} Compiled template function
     */
    compile(template, name = null) {
        console.log('⚙️  Compiling template...');
        
        // Check cache first
        if (name && this.options.cacheTemplates && this.compiledFunctions.has(name)) {
            console.log('📋 Using cached template');
            return this.compiledFunctions.get(name);
        }
        
        try {
            // Build AST
            const ast = this.astBuilder.build(template);
            
            // Generate JavaScript code
            const jsCode = this.generateCode(ast);
            
            // Create executable function
            const compiledFunction = this.createFunction(jsCode);
            
            // Cache if name provided
            if (name && this.options.cacheTemplates) {
                this.cacheTemplate(name, template, ast, compiledFunction);
            }
            
            console.log('✅ Template compiled successfully');
            return compiledFunction;
            
        } catch (error) {
            console.error('❌ Template compilation failed:', error.message);
            throw new Error(`Template compilation failed: ${error.message}`);
        }
    }

    /**
     * Generate JavaScript code from AST
     * @param {ASTNode} ast - Template AST
     * @returns {string} Generated JavaScript code
     */
    generateCode(ast) {
        const codeGenerator = new CodeGenerator(this.options);
        return codeGenerator.generate(ast);
    }

    /**
     * Create executable function from JavaScript code
     * @param {string} jsCode - Generated JavaScript code
     * @returns {Function} Executable template function
     */
    createFunction(jsCode) {
        // Wrap code in function that accepts context and scope manager
        const functionCode = `
            return function(context = {}, scopeManager = null) {
                const scope = scopeManager || new ScopeManager();
                
                // Add context variables to scope
                for (const [key, value] of Object.entries(context)) {
                    scope.setVariable(key, value);
                }
                
                let output = '';
                
                ${jsCode}
                
                return output;
            };
        `;
        
        try {
            // Create function with ScopeManager in scope
            const factory = new Function('ScopeManager', functionCode);
            return factory(ScopeManager);
        } catch (error) {
            throw new Error(`Function creation failed: ${error.message}`);
        }
    }

    /**
     * Cache compiled template
     * @param {string} name - Template name
     * @param {string} template - Original template
     * @param {ASTNode} ast - Template AST
     * @param {Function} compiledFunction - Compiled function
     */
    cacheTemplate(name, template, ast, compiledFunction) {
        // Implement LRU cache
        if (this.templateCache.size >= this.options.maxCacheSize) {
            const firstKey = this.templateCache.keys().next().value;
            this.templateCache.delete(firstKey);
            this.compiledFunctions.delete(firstKey);
        }
        
        this.templateCache.set(name, {
            template,
            ast,
            compiledAt: new Date()
        });
        
        this.compiledFunctions.set(name, compiledFunction);
    }

    /**
     * Clear template cache
     */
    clearCache() {
        this.templateCache.clear();
        this.compiledFunctions.clear();
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return {
            size: this.templateCache.size,
            maxSize: this.options.maxCacheSize,
            templates: Array.from(this.templateCache.keys())
        };
    }
}

/**
 * Code Generator for converting AST to JavaScript
 */
class CodeGenerator {
    constructor(options = {}) {
        this.options = options;
        this.indentLevel = 0;
        this.code = [];
    }

    /**
     * Generate JavaScript code from AST
     * @param {ASTNode} ast - Template AST
     * @returns {string} Generated code
     */
    generate(ast) {
        this.code = [];
        this.indentLevel = 0;
        
        this.visitNode(ast);
        
        return this.code.join('\n');
    }

    /**
     * Visit AST node and generate code
     * @param {ASTNode} node - AST node to visit
     */
    visitNode(node) {
        switch (node.type) {
            case 'TEMPLATE':
                this.visitTemplate(node);
                break;
                
            case 'TEXT':
                this.visitText(node);
                break;
                
            case 'VARIABLE':
                this.visitVariable(node);
                break;
                
            case 'BLOCK':
                this.visitBlock(node);
                break;
                
            case 'EXPRESSION':
                return this.visitExpression(node);
                
            case 'LITERAL':
                return this.visitLiteral(node);
                
            case 'IDENTIFIER':
                return this.visitIdentifier(node);
                
            case 'PROPERTY_ACCESS':
                return this.visitPropertyAccess(node);
                
            case 'ARRAY_ACCESS':
                return this.visitArrayAccess(node);
                
            case 'FUNCTION_CALL':
                return this.visitFunctionCall(node);
                
            case 'COMMENT':
                this.visitComment(node);
                break;
                
            default:
                this.addCode(`// Unknown node type: ${node.type}`);
        }
    }

    /**
     * Visit template root node
     * @param {TemplateNode} node - Template node
     */
    visitTemplate(node) {
        this.addCode('// Template execution');
        
        for (const child of node.children) {
            this.visitNode(child);
        }
    }

    /**
     * Visit text node
     * @param {TextNode} node - Text node
     */
    visitText(node) {
        const escapedText = this.escapeString(node.content);
        this.addCode(`output += ${JSON.stringify(escapedText)};`);
    }

    /**
     * Visit variable node
     * @param {VariableNode} node - Variable node
     */
    visitVariable(node) {
        let valueExpression;
        
        if (node.expression) {
            valueExpression = this.visitExpression(node.expression);
        } else {
            valueExpression = `scope.getVariable(${JSON.stringify(node.name)})`;
        }
        
        // Apply filters if present
        if (node.filters && node.filters.length > 0) {
            for (const filter of node.filters) {
                const filterArgs = filter.arguments.map(arg => JSON.stringify(arg)).join(', ');
                valueExpression = `scope.applyFilter(${valueExpression}, ${JSON.stringify(filter.name)}${filterArgs ? ', [' + filterArgs + ']' : ''})`;
            }
        }
        
        // Auto-escape if enabled
        if (this.options.autoEscape) {
            valueExpression = `scope.applyFilter(${valueExpression}, 'escape')`;
        }
        
        this.addCode(`output += String(${valueExpression} || '');`);
    }

    /**
     * Visit block node
     * @param {BlockNode} node - Block node
     */
    visitBlock(node) {
        switch (node.blockType) {
            case 'if':
                this.visitIfBlock(node);
                break;
                
            case 'for':
            case 'each':
                this.visitForBlock(node);
                break;
                
            case 'while':
                this.visitWhileBlock(node);
                break;
                
            default:
                this.addCode(`// Unknown block type: ${node.blockType}`);
        }
    }

    /**
     * Visit if block
     * @param {IfNode} node - If block node
     */
    visitIfBlock(node) {
        const condition = node.condition ? this.visitExpression(node.condition) : 'false';
        
        this.addCode(`if (${condition}) {`);
        this.indent();
        
        for (const child of node.body) {
            this.visitNode(child);
        }
        
        this.dedent();
        
        // Handle else-if blocks
        if (node.elseIfBlocks && node.elseIfBlocks.length > 0) {
            for (const elseIf of node.elseIfBlocks) {
                const elseIfCondition = elseIf.condition ? this.visitExpression(elseIf.condition) : 'false';
                this.addCode(`} else if (${elseIfCondition}) {`);
                this.indent();
                
                for (const child of elseIf.body) {
                    this.visitNode(child);
                }
                
                this.dedent();
            }
        }
        
        // Handle else block
        if (node.elseBody && node.elseBody.length > 0) {
            this.addCode('} else {');
            this.indent();
            
            for (const child of node.elseBody) {
                this.visitNode(child);
            }
            
            this.dedent();
        }
        
        this.addCode('}');
    }

    /**
     * Visit for block
     * @param {ForNode} node - For block node
     */
    visitForBlock(node) {
        const iterable = `scope.getVariable(${JSON.stringify(node.iterable)})`;
        const loopVar = `loop_${Math.random().toString(36).substr(2, 9)}`;
        
        this.addCode(`const ${loopVar} = ${iterable};`);
        this.addCode(`if (Array.isArray(${loopVar})) {`);
        this.indent();
        
        this.addCode(`for (let i = 0; i < ${loopVar}.length; i++) {`);
        this.indent();
        
        // Create loop scope
        this.addCode('scope.pushScope({');
        this.addCode(`  ${JSON.stringify(node.variable)}: ${loopVar}[i],`);
        if (node.index) {
            this.addCode(`  ${JSON.stringify(node.index)}: i,`);
        }
        this.addCode('  loop: {');
        this.addCode('    index: i,');
        this.addCode(`    length: ${loopVar}.length,`);
        this.addCode('    first: i === 0,');
        this.addCode(`    last: i === ${loopVar}.length - 1`);
        this.addCode('  }');
        this.addCode('});');
        
        // Loop body
        for (const child of node.body) {
            this.visitNode(child);
        }
        
        // Pop loop scope
        this.addCode('scope.popScope();');
        
        this.dedent();
        this.addCode('}');
        
        this.dedent();
        this.addCode('}');
    }

    /**
     * Visit while block
     * @param {WhileNode} node - While block node
     */
    visitWhileBlock(node) {
        const condition = node.condition ? this.visitExpression(node.condition) : 'false';
        
        this.addCode(`while (${condition}) {`);
        this.indent();
        
        for (const child of node.body) {
            this.visitNode(child);
        }
        
        this.dedent();
        this.addCode('}');
    }

    /**
     * Visit expression node
     * @param {ExpressionNode} node - Expression node
     * @returns {string} Expression code
     */
    visitExpression(node) {
        if (node.operator) {
            const left = node.left ? this.visitNode(node.left) : 'null';
            const right = node.right ? this.visitNode(node.right) : 'null';
            
            // Handle different operator types
            if (['==', '!=', '<', '>', '<=', '>='].includes(node.operator)) {
                return `scope.evaluateComparison(${left}, ${JSON.stringify(node.operator)}, ${right})`;
            } else if (['&&', '||'].includes(node.operator)) {
                return `scope.evaluateLogical(${left}, ${JSON.stringify(node.operator)}, ${right})`;
            } else if (['+', '-', '*', '/', '%'].includes(node.operator)) {
                return `scope.evaluateArithmetic(${left}, ${JSON.stringify(node.operator)}, ${right})`;
            }
            
            return `(${left} ${node.operator} ${right})`;
        }
        
        // Compound expression
        if (node.children.length > 0) {
            return this.visitNode(node.children[0]);
        }
        
        return 'null';
    }

    /**
     * Visit literal node
     * @param {LiteralNode} node - Literal node
     * @returns {string} Literal code
     */
    visitLiteral(node) {
        return JSON.stringify(node.value);
    }

    /**
     * Visit identifier node
     * @param {IdentifierNode} node - Identifier node
     * @returns {string} Identifier code
     */
    visitIdentifier(node) {
        return `scope.getVariable(${JSON.stringify(node.name)})`;
    }

    /**
     * Visit property access node
     * @param {PropertyAccessNode} node - Property access node
     * @returns {string} Property access code
     */
    visitPropertyAccess(node) {
        return `scope.resolveProperty(${JSON.stringify(node.object)}, ${JSON.stringify(node.property)})`;
    }

    /**
     * Visit array access node
     * @param {ArrayAccessNode} node - Array access node
     * @returns {string} Array access code
     */
    visitArrayAccess(node) {
        return `scope.resolveArrayAccess(${JSON.stringify(node.array)}, ${JSON.stringify(node.index)})`;
    }

    /**
     * Visit function call node
     * @param {FunctionCallNode} node - Function call node
     * @returns {string} Function call code
     */
    visitFunctionCall(node) {
        const args = node.arguments.map(arg => {
            if (typeof arg === 'object' && arg.type) {
                return this.visitNode(arg);
            }
            return JSON.stringify(arg);
        }).join(', ');
        
        return `scope.callFunction(${JSON.stringify(node.name)}, [${args}])`;
    }

    /**
     * Visit comment node
     * @param {CommentNode} node - Comment node
     */
    visitComment(node) {
        this.addCode(`// ${node.content}`);
    }

    /**
     * Add code line with proper indentation
     * @param {string} line - Code line
     */
    addCode(line) {
        const indent = '  '.repeat(this.indentLevel);
        this.code.push(indent + line);
    }

    /**
     * Increase indentation level
     */
    indent() {
        this.indentLevel++;
    }

    /**
     * Decrease indentation level
     */
    dedent() {
        this.indentLevel = Math.max(0, this.indentLevel - 1);
    }

    /**
     * Escape string for JavaScript
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    escapeString(str) {
        return str
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/'/g, "\\'")
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
    }
}
