import { Tokenizer, TokenType } from './Tokenizer.js';
import {
    ASTNode, TemplateNode, TextNode, VariableNode, ExpressionNode,
    LiteralNode, IdentifierNode, PropertyAccessNode, ArrayAccessNode,
    FunctionCallNode, FilterNode, BlockNode, IfNode, ForNode, WhileNode,
    CommentNode, IncludeNode, ExtendsNode, BlockDefNode
} from './ASTNodes.js';

/**
 * Abstract Syntax Tree Builder for Template Engine
 * Converts tokens into a structured AST representation
 */
export class ASTBuilder {
    constructor(options = {}) {
        this.options = {
            allowUndefinedVariables: true,
            strictMode: false,
            maxDepth: 100,
            ...options
        };
        
        this.tokenizer = new Tokenizer();
        this.tokens = [];
        this.current = 0;
        this.depth = 0;
        this.errors = [];
    }

    /**
     * Build AST from template content
     * @param {string} template - Template content
     * @returns {TemplateNode} Root AST node
     */
    build(template) {
        console.log('🌳 Building Abstract Syntax Tree...');
        
        // Tokenize the template
        this.tokens = this.tokenizer.tokenize(template);
        this.current = 0;
        this.depth = 0;
        this.errors = [];
        
        // Create root template node
        const root = new TemplateNode();
        
        try {
            // Parse all tokens into AST nodes
            while (this.hasTokens()) {
                const node = this.parseNode();
                if (node) {
                    root.addChild(node);
                    this.updateTemplateMetadata(root, node);
                }
            }
            
            console.log(`✅ AST built successfully: ${root.children.length} top-level nodes`);
            
            if (this.errors.length > 0) {
                console.warn(`⚠️  ${this.errors.length} parsing errors encountered`);
            }
            
        } catch (error) {
            console.error('❌ AST building failed:', error.message);
            this.errors.push({
                type: 'build_error',
                message: error.message,
                position: this.getCurrentToken()?.position
            });
        }
        
        return root;
    }

    /**
     * Parse next node from token stream
     * @returns {ASTNode|null} Parsed AST node
     */
    parseNode() {
        const token = this.getCurrentToken();
        if (!token) return null;

        switch (token.type) {
            case TokenType.TEXT:
                return this.parseTextNode();
                
            case TokenType.VARIABLE:
                return this.parseVariableNode();
                
            case TokenType.BLOCK_START:
                return this.parseBlockNode();
                
            case TokenType.COMMENT:
                return this.parseCommentNode();
                
            case TokenType.WHITESPACE:
            case TokenType.NEWLINE:
                // Skip whitespace tokens in non-preserving mode
                this.advance();
                return this.parseNode();
                
            case TokenType.EOF:
                return null;
                
            default:
                this.addError(`Unexpected token: ${token.type}`, token.position);
                this.advance();
                return this.parseNode();
        }
    }

    /**
     * Parse text node
     * @returns {TextNode} Text AST node
     */
    parseTextNode() {
        const token = this.consume(TokenType.TEXT);
        return new TextNode(token.value, token.position);
    }

    /**
     * Parse variable interpolation node
     * @returns {VariableNode} Variable AST node
     */
    parseVariableNode() {
        const token = this.consume(TokenType.VARIABLE);
        const variable = new VariableNode(token.value, [], token.position);
        
        // Parse complex expressions within the variable
        if (token.metadata && token.metadata.expression) {
            variable.expression = this.parseExpression(token.metadata.expression);
        }
        
        return variable;
    }

    /**
     * Parse expression from expression tokens
     * @param {Array} expressionTokens - Tokens representing the expression
     * @returns {ExpressionNode|ASTNode} Expression AST node
     */
    parseExpression(expressionTokens) {
        if (!expressionTokens || expressionTokens.length === 0) {
            return null;
        }
        
        // Simple expression parsing using operator precedence
        return this.parseExpressionTokens(expressionTokens, 0);
    }

    /**
     * Parse expression tokens with operator precedence
     * @param {Array} tokens - Expression tokens
     * @param {number} minPrecedence - Minimum operator precedence
     * @returns {ASTNode} Expression node
     */
    parseExpressionTokens(tokens, minPrecedence) {
        if (tokens.length === 0) return null;
        if (tokens.length === 1) return this.parseAtomicExpression(tokens[0]);
        
        // Find operator with lowest precedence (right-associative)
        let operatorIndex = -1;
        let minPrec = Infinity;
        
        for (let i = tokens.length - 1; i >= 0; i--) {
            const token = tokens[i];
            if (token.type === TokenType.OPERATOR) {
                const precedence = this.getOperatorPrecedence(token.value);
                if (precedence <= minPrec && precedence >= minPrecedence) {
                    minPrec = precedence;
                    operatorIndex = i;
                }
            }
        }
        
        if (operatorIndex === -1) {
            // No operator found, parse as atomic or function call
            return this.parseComplexExpression(tokens);
        }
        
        // Split tokens around operator
        const leftTokens = tokens.slice(0, operatorIndex);
        const operatorToken = tokens[operatorIndex];
        const rightTokens = tokens.slice(operatorIndex + 1);
        
        // Create expression node
        const expression = new ExpressionNode(operatorToken.value, operatorToken.position);
        expression.setLeft(this.parseExpressionTokens(leftTokens, 0));
        expression.setRight(this.parseExpressionTokens(rightTokens, minPrec + 1));
        
        return expression;
    }

    /**
     * Parse atomic expression (single token)
     * @param {Token} token - Single token
     * @returns {ASTNode} Atomic expression node
     */
    parseAtomicExpression(token) {
        switch (token.type) {
            case TokenType.LITERAL:
                return new LiteralNode(
                    token.metadata.value,
                    token.metadata.type,
                    token.position
                );
                
            case TokenType.IDENTIFIER:
                return new IdentifierNode(token.value, token.position);
                
            case TokenType.PROPERTY_ACCESS:
                return new PropertyAccessNode(
                    token.metadata.object,
                    token.metadata.property,
                    token.position
                );
                
            case TokenType.ARRAY_ACCESS:
                return new ArrayAccessNode(
                    token.metadata.array,
                    token.metadata.index,
                    token.position
                );
                
            default:
                return new IdentifierNode(token.value, token.position);
        }
    }

    /**
     * Parse complex expression (function calls, etc.)
     * @param {Array} tokens - Expression tokens
     * @returns {ASTNode} Complex expression node
     */
    parseComplexExpression(tokens) {
        // Check for function call pattern
        const functionTokens = tokens.filter(t => t.type === TokenType.FUNCTION);
        if (functionTokens.length > 0) {
            const funcToken = functionTokens[0];
            return new FunctionCallNode(
                funcToken.metadata.name,
                funcToken.metadata.arguments || [],
                funcToken.position
            );
        }
        
        // Default to first token as identifier
        return this.parseAtomicExpression(tokens[0]);
    }

    /**
     * Parse block node (if, for, while, etc.)
     * @returns {BlockNode} Block AST node
     */
    parseBlockNode() {
        const startToken = this.consume(TokenType.BLOCK_START);
        const blockType = startToken.value;
        
        let blockNode;
        
        switch (blockType) {
            case 'if':
                blockNode = this.parseIfBlock(startToken);
                break;
                
            case 'for':
            case 'each':
                blockNode = this.parseForBlock(startToken);
                break;
                
            case 'while':
                blockNode = this.parseWhileBlock(startToken);
                break;
                
            default:
                blockNode = this.parseGenericBlock(startToken);
                break;
        }
        
        return blockNode;
    }

    /**
     * Parse if block with else/elseif support
     * @param {Token} startToken - Block start token
     * @returns {IfNode} If block node
     */
    parseIfBlock(startToken) {
        const condition = this.parseCondition(startToken.metadata.condition);
        const ifNode = new IfNode(condition, startToken.position);
        
        // Parse if body
        const body = this.parseBlockBody('if');
        body.forEach(node => ifNode.addToBody(node));
        
        // Check for else/elseif
        while (this.hasTokens()) {
            const token = this.getCurrentToken();
            if (token && token.type === TokenType.BLOCK_START) {
                if (token.value === 'elseif') {
                    this.advance();
                    const elseIfCondition = this.parseCondition(token.metadata.condition);
                    const elseIfBody = this.parseBlockBody('elseif');
                    ifNode.addElseIf({
                        condition: elseIfCondition,
                        body: elseIfBody
                    });
                } else if (token.value === 'else') {
                    this.advance();
                    const elseBody = this.parseBlockBody('else');
                    ifNode.setElseBody(elseBody);
                    break;
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        
        return ifNode;
    }

    /**
     * Parse for/each block
     * @param {Token} startToken - Block start token
     * @returns {ForNode} For block node
     */
    parseForBlock(startToken) {
        const condition = startToken.metadata.condition;
        const parts = condition.split(/\s+in\s+/);
        
        if (parts.length !== 2) {
            this.addError('Invalid for loop syntax', startToken.position);
            return new ForNode('item', 'items', startToken.position);
        }
        
        const variable = parts[0].trim();
        const iterable = parts[1].trim();
        
        const forNode = new ForNode(variable, iterable, startToken.position);
        
        // Parse for body
        const body = this.parseBlockBody('for');
        body.forEach(node => forNode.addToBody(node));
        
        return forNode;
    }

    /**
     * Parse while block
     * @param {Token} startToken - Block start token
     * @returns {WhileNode} While block node
     */
    parseWhileBlock(startToken) {
        const condition = this.parseCondition(startToken.metadata.condition);
        const whileNode = new WhileNode(condition, startToken.position);
        
        // Parse while body
        const body = this.parseBlockBody('while');
        body.forEach(node => whileNode.addToBody(node));
        
        return whileNode;
    }

    /**
     * Parse generic block
     * @param {Token} startToken - Block start token
     * @returns {BlockNode} Generic block node
     */
    parseGenericBlock(startToken) {
        const condition = startToken.metadata.condition ? 
            this.parseCondition(startToken.metadata.condition) : null;
        const blockNode = new BlockNode(startToken.value, condition, startToken.position);
        
        // Parse block body
        const body = this.parseBlockBody(startToken.value);
        body.forEach(node => blockNode.addToBody(node));
        
        return blockNode;
    }

    /**
     * Parse block body until matching end token
     * @param {string} blockType - Type of block
     * @returns {Array<ASTNode>} Body nodes
     */
    parseBlockBody(blockType) {
        const body = [];
        this.depth++;
        
        if (this.depth > this.options.maxDepth) {
            throw new Error('Maximum parsing depth exceeded');
        }
        
        while (this.hasTokens()) {
            const token = this.getCurrentToken();
            
            if (token && token.type === TokenType.BLOCK_END) {
                if (token.value === blockType) {
                    this.advance(); // Consume end token
                    break;
                }
            }
            
            const node = this.parseNode();
            if (node) {
                body.push(node);
            }
        }
        
        this.depth--;
        return body;
    }

    /**
     * Parse condition expression
     * @param {string} conditionStr - Condition string
     * @returns {ExpressionNode} Condition expression node
     */
    parseCondition(conditionStr) {
        if (!conditionStr) return null;
        
        // Tokenize the condition string
        const conditionTokenizer = new Tokenizer();
        const conditionTokens = conditionTokenizer.tokenizeExpression(conditionStr);
        
        return this.parseExpression(conditionTokens);
    }

    /**
     * Parse comment node
     * @returns {CommentNode} Comment AST node
     */
    parseCommentNode() {
        const token = this.consume(TokenType.COMMENT);
        return new CommentNode(token.value, token.position);
    }

    /**
     * Update template metadata with node information
     * @param {TemplateNode} template - Template root node
     * @param {ASTNode} node - Node to analyze
     */
    updateTemplateMetadata(template, node) {
        node.visit(n => {
            switch (n.type) {
                case 'VARIABLE':
                case 'IDENTIFIER':
                    template.addVariable(n.name || n.value);
                    break;
                    
                case 'FUNCTION_CALL':
                    template.addFunction(n.name);
                    break;
                    
                case 'BLOCK':
                    template.addBlock(n.blockType);
                    break;
            }
        });
    }

    /**
     * Get operator precedence
     * @param {string} operator - Operator string
     * @returns {number} Precedence level
     */
    getOperatorPrecedence(operator) {
        const precedence = {
            '||': 1,
            '&&': 2,
            '==': 3, '!=': 3,
            '<': 4, '>': 4, '<=': 4, '>=': 4,
            '+': 5, '-': 5,
            '*': 6, '/': 6
        };
        return precedence[operator] || 0;
    }

    /**
     * Get current token without advancing
     * @returns {Token|null} Current token
     */
    getCurrentToken() {
        return this.current < this.tokens.length ? this.tokens[this.current] : null;
    }

    /**
     * Advance to next token
     * @returns {Token|null} Previous current token
     */
    advance() {
        const token = this.getCurrentToken();
        if (this.current < this.tokens.length) {
            this.current++;
        }
        return token;
    }

    /**
     * Consume token of expected type
     * @param {string} expectedType - Expected token type
     * @returns {Token} Consumed token
     */
    consume(expectedType) {
        const token = this.getCurrentToken();
        
        if (!token) {
            throw new Error(`Expected ${expectedType} but reached end of input`);
        }
        
        if (token.type !== expectedType) {
            throw new Error(`Expected ${expectedType} but got ${token.type} at position ${token.position.start}`);
        }
        
        this.advance();
        return token;
    }

    /**
     * Check if more tokens are available
     * @returns {boolean} True if more tokens available
     */
    hasTokens() {
        return this.current < this.tokens.length && 
               this.getCurrentToken()?.type !== TokenType.EOF;
    }

    /**
     * Add parsing error
     * @param {string} message - Error message
     * @param {Object} position - Error position
     */
    addError(message, position) {
        this.errors.push({
            type: 'parse_error',
            message,
            position
        });
    }

    /**
     * Get parsing errors
     * @returns {Array} Parsing errors
     */
    getErrors() {
        return this.errors;
    }

    /**
     * Validate AST structure
     * @param {ASTNode} ast - AST to validate
     * @returns {Object} Validation result
     */
    validateAST(ast) {
        const errors = [];
        const warnings = [];
        
        ast.visit(node => {
            // Check for undefined variables in strict mode
            if (this.options.strictMode && node.type === 'IDENTIFIER') {
                if (!this.options.allowUndefinedVariables) {
                    warnings.push({
                        type: 'undefined_variable',
                        message: `Variable '${node.name}' may be undefined`,
                        position: node.position
                    });
                }
            }
            
            // Check for empty blocks
            if (node.type === 'BLOCK' && node.body.length === 0) {
                warnings.push({
                    type: 'empty_block',
                    message: `Empty ${node.blockType} block`,
                    position: node.position
                });
            }
        });
        
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Get AST statistics
     * @param {ASTNode} ast - AST to analyze
     * @returns {Object} AST statistics
     */
    getASTStatistics(ast) {
        const stats = {
            totalNodes: 0,
            nodeTypes: {},
            depth: 0,
            variables: new Set(),
            functions: new Set(),
            blocks: new Set()
        };
        
        const calculateDepth = (node, currentDepth = 0) => {
            stats.totalNodes++;
            stats.depth = Math.max(stats.depth, currentDepth);
            
            // Count node types
            stats.nodeTypes[node.type] = (stats.nodeTypes[node.type] || 0) + 1;
            
            // Collect metadata
            if (node.type === 'VARIABLE' || node.type === 'IDENTIFIER') {
                stats.variables.add(node.name || node.value);
            }
            if (node.type === 'FUNCTION_CALL') {
                stats.functions.add(node.name);
            }
            if (node.type === 'BLOCK') {
                stats.blocks.add(node.blockType);
            }
            
            // Recurse through children
            for (const child of node.children) {
                calculateDepth(child, currentDepth + 1);
            }
        };
        
        calculateDepth(ast);
        
        // Convert sets to arrays for JSON serialization
        stats.variables = Array.from(stats.variables);
        stats.functions = Array.from(stats.functions);
        stats.blocks = Array.from(stats.blocks);
        
        return stats;
    }

    /**
     * Pretty print AST structure
     * @param {ASTNode} ast - AST to print
     * @param {number} indent - Indentation level
     * @returns {string} Pretty printed AST
     */
    printAST(ast, indent = 0) {
        const spaces = '  '.repeat(indent);
        let result = `${spaces}${ast.toString()}\n`;
        
        for (const child of ast.children) {
            result += this.printAST(child, indent + 1);
        }
        
        return result;
    }
}
