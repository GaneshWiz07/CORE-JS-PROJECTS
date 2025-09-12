import { RegexParser } from './RegexParser.js';

/**
 * Token types for the template engine
 */
export const TokenType = {
    TEXT: 'TEXT',
    VARIABLE: 'VARIABLE',
    BLOCK_START: 'BLOCK_START',
    BLOCK_END: 'BLOCK_END',
    COMMENT: 'COMMENT',
    FILTER: 'FILTER',
    FUNCTION: 'FUNCTION',
    OPERATOR: 'OPERATOR',
    LITERAL: 'LITERAL',
    IDENTIFIER: 'IDENTIFIER',
    PROPERTY_ACCESS: 'PROPERTY_ACCESS',
    ARRAY_ACCESS: 'ARRAY_ACCESS',
    WHITESPACE: 'WHITESPACE',
    NEWLINE: 'NEWLINE',
    EOF: 'EOF'
};

/**
 * Token class representing a single token
 */
export class Token {
    constructor(type, value, position, metadata = {}) {
        this.type = type;
        this.value = value;
        this.position = position;
        this.metadata = metadata;
    }

    toString() {
        return `Token(${this.type}, "${this.value}", ${this.position.start}-${this.position.end})`;
    }

    toJSON() {
        return {
            type: this.type,
            value: this.value,
            position: this.position,
            metadata: this.metadata
        };
    }
}

/**
 * Tokenizer for Template Engine
 * Converts template strings into a stream of tokens for parsing
 */
export class Tokenizer {
    constructor(options = {}) {
        this.options = {
            preserveWhitespace: false,
            preserveComments: false,
            trackPositions: true,
            ...options
        };

        this.parser = new RegexParser();
        this.reset();
    }

    /**
     * Reset tokenizer state
     */
    reset() {
        this.input = '';
        this.position = 0;
        this.line = 1;
        this.column = 1;
        this.tokens = [];
        this.current = 0;
    }

    /**
     * Tokenize template content
     * @param {string} input - Template content to tokenize
     * @returns {Array<Token>} Array of tokens
     */
    tokenize(input) {
        this.reset();
        this.input = input;
        
        console.log('🔤 Starting tokenization...');
        
        // Find all template elements using regex parser
        const elements = this.findAllElements();
        
        // Sort elements by position
        elements.sort((a, b) => a.position.start - b.position.start);
        
        // Generate tokens from elements
        this.generateTokens(elements);
        
        // Add EOF token
        this.tokens.push(new Token(
            TokenType.EOF,
            '',
            { start: this.input.length, end: this.input.length, line: this.line, column: this.column }
        ));

        console.log(`✅ Tokenization complete: ${this.tokens.length} tokens generated`);
        return this.tokens;
    }

    /**
     * Find all template elements using regex parser
     * @returns {Array} All template elements with positions
     */
    findAllElements() {
        const elements = [];
        
        // Parse all template syntax elements
        const parsed = this.parser.parseAll(this.input);
        
        // Add variables
        for (const variable of parsed.variables) {
            elements.push({
                type: 'variable',
                data: variable,
                position: variable.position
            });
        }
        
        // Add blocks
        for (const block of parsed.blocks) {
            // Add block start
            elements.push({
                type: 'block_start',
                data: block,
                position: block.start.position
            });
            
            // Add block end
            elements.push({
                type: 'block_end',
                data: block,
                position: block.end.position
            });
        }
        
        // Add comments
        if (this.options.preserveComments) {
            for (const comment of parsed.comments) {
                elements.push({
                    type: 'comment',
                    data: comment,
                    position: comment.position
                });
            }
        }
        
        return elements;
    }

    /**
     * Generate tokens from parsed elements
     * @param {Array} elements - Parsed template elements
     */
    generateTokens(elements) {
        let lastPosition = 0;
        
        for (const element of elements) {
            // Add text token for content before this element
            if (element.position.start > lastPosition) {
                const textContent = this.input.slice(lastPosition, element.position.start);
                if (textContent.length > 0) {
                    this.addTextTokens(textContent, lastPosition);
                }
            }
            
            // Add token for this element
            this.addElementToken(element);
            
            lastPosition = element.position.end;
        }
        
        // Add remaining text
        if (lastPosition < this.input.length) {
            const textContent = this.input.slice(lastPosition);
            if (textContent.length > 0) {
                this.addTextTokens(textContent, lastPosition);
            }
        }
    }

    /**
     * Add text tokens (handling whitespace and newlines)
     * @param {string} text - Text content
     * @param {number} startPos - Starting position
     */
    addTextTokens(text, startPos) {
        if (!this.options.preserveWhitespace) {
            // Simple text token
            if (text.trim().length > 0) {
                const position = this.calculatePosition(startPos, startPos + text.length);
                this.tokens.push(new Token(TokenType.TEXT, text, position));
            }
        } else {
            // Detailed whitespace handling
            let pos = startPos;
            let i = 0;
            
            while (i < text.length) {
                if (text[i] === '\n') {
                    const position = this.calculatePosition(pos, pos + 1);
                    this.tokens.push(new Token(TokenType.NEWLINE, '\n', position));
                    pos++;
                    i++;
                } else if (/\s/.test(text[i])) {
                    // Collect consecutive whitespace
                    let whitespace = '';
                    while (i < text.length && /\s/.test(text[i]) && text[i] !== '\n') {
                        whitespace += text[i];
                        i++;
                    }
                    if (whitespace.length > 0) {
                        const position = this.calculatePosition(pos, pos + whitespace.length);
                        this.tokens.push(new Token(TokenType.WHITESPACE, whitespace, position));
                        pos += whitespace.length;
                    }
                } else {
                    // Collect non-whitespace text
                    let textPart = '';
                    while (i < text.length && !/\s/.test(text[i])) {
                        textPart += text[i];
                        i++;
                    }
                    if (textPart.length > 0) {
                        const position = this.calculatePosition(pos, pos + textPart.length);
                        this.tokens.push(new Token(TokenType.TEXT, textPart, position));
                        pos += textPart.length;
                    }
                }
            }
        }
    }

    /**
     * Add token for template element
     * @param {Object} element - Template element
     */
    addElementToken(element) {
        const position = this.calculatePosition(element.position.start, element.position.end);
        
        switch (element.type) {
            case 'variable':
                this.addVariableTokens(element.data, position);
                break;
                
            case 'block_start':
                this.addBlockStartTokens(element.data, position);
                break;
                
            case 'block_end':
                this.addBlockEndToken(element.data, position);
                break;
                
            case 'comment':
                this.tokens.push(new Token(
                    TokenType.COMMENT,
                    element.data.content,
                    position,
                    { raw: element.data.raw }
                ));
                break;
        }
    }

    /**
     * Add tokens for variable interpolation
     * @param {Object} variable - Variable data
     * @param {Object} position - Position info
     */
    addVariableTokens(variable, position) {
        // Parse the content inside {{ }}
        const content = variable.raw.slice(2, -2).trim(); // Remove {{ }}
        const innerTokens = this.tokenizeExpression(content);
        
        // Add variable token with inner expression tokens
        this.tokens.push(new Token(
            TokenType.VARIABLE,
            variable.name,
            position,
            {
                raw: variable.raw,
                expression: innerTokens
            }
        ));
    }

    /**
     * Add tokens for block start
     * @param {Object} block - Block data
     * @param {Object} position - Position info
     */
    addBlockStartTokens(block, position) {
        this.tokens.push(new Token(
            TokenType.BLOCK_START,
            block.blockType,
            position,
            {
                condition: block.condition,
                raw: block.start.raw,
                conditionTokens: this.tokenizeExpression(block.condition)
            }
        ));
    }

    /**
     * Add token for block end
     * @param {Object} block - Block data
     * @param {Object} position - Position info
     */
    addBlockEndToken(block, position) {
        this.tokens.push(new Token(
            TokenType.BLOCK_END,
            block.blockType,
            position,
            {
                raw: block.end.raw
            }
        ));
    }

    /**
     * Tokenize expression content (inside {{ }} or {% %})
     * @param {string} expression - Expression string
     * @returns {Array<Token>} Expression tokens
     */
    tokenizeExpression(expression) {
        const tokens = [];
        const trimmed = expression.trim();
        
        if (!trimmed) return tokens;
        
        // Parse expression elements
        const literals = this.parser.parseLiterals(trimmed);
        const operators = this.parser.parseOperators(trimmed);
        const functions = this.parser.parseFunctions(trimmed);
        const accessors = this.parser.parseAccessors(trimmed);
        
        // Collect all elements with positions
        const elements = [];
        
        // Add literals
        for (const stringLit of literals.strings) {
            elements.push({ ...stringLit, tokenType: TokenType.LITERAL });
        }
        for (const numberLit of literals.numbers) {
            elements.push({ ...numberLit, tokenType: TokenType.LITERAL });
        }
        for (const boolLit of literals.booleans) {
            elements.push({ ...boolLit, tokenType: TokenType.LITERAL });
        }
        
        // Add operators
        for (const op of operators) {
            elements.push({ ...op, tokenType: TokenType.OPERATOR });
        }
        
        // Add functions
        for (const func of functions) {
            elements.push({ ...func, tokenType: TokenType.FUNCTION });
        }
        
        // Add property access
        for (const prop of accessors.properties) {
            elements.push({ ...prop, tokenType: TokenType.PROPERTY_ACCESS });
        }
        
        // Add array access
        for (const arr of accessors.arrays) {
            elements.push({ ...arr, tokenType: TokenType.ARRAY_ACCESS });
        }
        
        // Sort by position and create tokens
        elements.sort((a, b) => a.position.start - b.position.start);
        
        let lastPos = 0;
        for (const element of elements) {
            // Add identifier tokens for gaps
            if (element.position.start > lastPos) {
                const gap = trimmed.slice(lastPos, element.position.start).trim();
                if (gap && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(gap)) {
                    tokens.push(new Token(
                        TokenType.IDENTIFIER,
                        gap,
                        { start: lastPos, end: element.position.start }
                    ));
                }
            }
            
            // Add element token
            tokens.push(new Token(
                element.tokenType,
                element.value || element.raw,
                element.position,
                element
            ));
            
            lastPos = element.position.end;
        }
        
        // Handle remaining content
        if (lastPos < trimmed.length) {
            const remaining = trimmed.slice(lastPos).trim();
            if (remaining && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(remaining)) {
                tokens.push(new Token(
                    TokenType.IDENTIFIER,
                    remaining,
                    { start: lastPos, end: trimmed.length }
                ));
            }
        }
        
        return tokens;
    }

    /**
     * Calculate position with line and column info
     * @param {number} start - Start position
     * @param {number} end - End position
     * @returns {Object} Position object
     */
    calculatePosition(start, end) {
        const position = { start, end };
        
        if (this.options.trackPositions) {
            // Calculate line and column for start position
            let line = 1;
            let column = 1;
            
            for (let i = 0; i < start; i++) {
                if (this.input[i] === '\n') {
                    line++;
                    column = 1;
                } else {
                    column++;
                }
            }
            
            position.line = line;
            position.column = column;
        }
        
        return position;
    }

    /**
     * Peek at next token without consuming it
     * @returns {Token|null} Next token or null if at end
     */
    peek() {
        if (this.current < this.tokens.length) {
            return this.tokens[this.current];
        }
        return null;
    }

    /**
     * Consume and return next token
     * @returns {Token|null} Next token or null if at end
     */
    next() {
        if (this.current < this.tokens.length) {
            return this.tokens[this.current++];
        }
        return null;
    }

    /**
     * Check if there are more tokens
     * @returns {boolean} True if more tokens available
     */
    hasNext() {
        return this.current < this.tokens.length;
    }

    /**
     * Get current position in token stream
     * @returns {number} Current position
     */
    getCurrentPosition() {
        return this.current;
    }

    /**
     * Set position in token stream
     * @param {number} position - Position to set
     */
    setPosition(position) {
        this.current = Math.max(0, Math.min(position, this.tokens.length));
    }

    /**
     * Get all tokens
     * @returns {Array<Token>} All tokens
     */
    getTokens() {
        return this.tokens;
    }

    /**
     * Filter tokens by type
     * @param {string} type - Token type to filter
     * @returns {Array<Token>} Filtered tokens
     */
    getTokensByType(type) {
        return this.tokens.filter(token => token.type === type);
    }

    /**
     * Get token statistics
     * @returns {Object} Token statistics
     */
    getStatistics() {
        const stats = {
            total: this.tokens.length,
            byType: {}
        };
        
        for (const token of this.tokens) {
            stats.byType[token.type] = (stats.byType[token.type] || 0) + 1;
        }
        
        return stats;
    }

    /**
     * Export tokens as JSON
     * @returns {string} JSON representation of tokens
     */
    toJSON() {
        return JSON.stringify(this.tokens.map(token => token.toJSON()), null, 2);
    }

    /**
     * Create a new tokenizer with different options
     * @param {Object} options - New options
     * @returns {Tokenizer} New tokenizer instance
     */
    withOptions(options) {
        return new Tokenizer({ ...this.options, ...options });
    }
}
