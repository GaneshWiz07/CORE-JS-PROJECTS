/**
 * Regex Parser for Template Engine
 * Demonstrates advanced regex parsing techniques for template syntax recognition
 */
export class RegexParser {
    constructor() {
        // Template syntax patterns using regex
        this.patterns = {
            // Variable interpolation: {{ variable }}
            variable: /\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*)\s*\}\}/g,
            
            // Block statements: {% if condition %} {% endif %}
            blockStart: /\{\%\s*(if|for|while|unless|each)\s+([^%]+)\s*\%\}/g,
            blockEnd: /\{\%\s*(endif|endfor|endwhile|endunless|endeach)\s*\%\}/g,
            
            // Comments: {# comment #}
            comment: /\{\#[\s\S]*?\#\}/g,
            
            // Filters: {{ variable | filter:arg }}
            filter: /\|\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?:\:\s*([^|}]+))?\s*/g,
            
            // Function calls: {{ function(arg1, arg2) }}
            functionCall: /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(\s*([^)]*)\s*\)/g,
            
            // Operators: ==, !=, <, >, <=, >=, &&, ||
            operator: /(==|!=|<=|>=|<|>|&&|\|\||[+\-*/])/g,
            
            // String literals: "string" or 'string'
            stringLiteral: /(['"])((?:(?!\1)[^\\]|\\.)*)(\1)/g,
            
            // Number literals: 123, 123.45
            numberLiteral: /\b\d+(?:\.\d+)?\b/g,
            
            // Boolean literals: true, false
            booleanLiteral: /\b(true|false)\b/g,
            
            // Array access: array[index]
            arrayAccess: /([a-zA-Z_$][a-zA-Z0-9_$]*)\[([^\]]+)\]/g,
            
            // Object property access: object.property
            propertyAccess: /([a-zA-Z_$][a-zA-Z0-9_$]*)\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
            
            // Whitespace and newlines
            whitespace: /\s+/g,
            newline: /\r?\n/g
        };

        // Compiled regex patterns for better performance
        this.compiledPatterns = new Map();
        this.compilePatterns();
    }

    /**
     * Compile regex patterns for better performance
     */
    compilePatterns() {
        for (const [name, pattern] of Object.entries(this.patterns)) {
            this.compiledPatterns.set(name, new RegExp(pattern.source, pattern.flags));
        }
    }

    /**
     * Parse template content and extract all matches for a specific pattern
     * @param {string} content - Template content
     * @param {string} patternName - Name of the pattern to match
     * @returns {Array} Array of match objects
     */
    parsePattern(content, patternName) {
        const pattern = this.compiledPatterns.get(patternName);
        if (!pattern) {
            throw new Error(`Unknown pattern: ${patternName}`);
        }

        const matches = [];
        let match;

        // Reset regex lastIndex to ensure fresh parsing
        pattern.lastIndex = 0;

        while ((match = pattern.exec(content)) !== null) {
            matches.push({
                match: match[0],
                groups: match.slice(1),
                index: match.index,
                length: match[0].length,
                end: match.index + match[0].length
            });

            // Prevent infinite loop on zero-length matches
            if (match[0].length === 0) {
                pattern.lastIndex++;
            }
        }

        return matches;
    }

    /**
     * Parse all template syntax elements from content
     * @param {string} content - Template content
     * @returns {Object} Parsed elements categorized by type
     */
    parseAll(content) {
        const parsed = {
            variables: this.parseVariables(content),
            blocks: this.parseBlocks(content),
            comments: this.parseComments(content),
            filters: this.parseFilters(content),
            functions: this.parseFunctions(content),
            literals: this.parseLiterals(content),
            operators: this.parseOperators(content),
            accessors: this.parseAccessors(content)
        };

        return parsed;
    }

    /**
     * Parse variable interpolations
     * @param {string} content - Template content
     * @returns {Array} Variable matches
     */
    parseVariables(content) {
        const matches = this.parsePattern(content, 'variable');
        return matches.map(match => ({
            type: 'variable',
            name: match.groups[0],
            raw: match.match,
            position: {
                start: match.index,
                end: match.end
            }
        }));
    }

    /**
     * Parse block statements (if, for, while, etc.)
     * @param {string} content - Template content
     * @returns {Array} Block matches with paired start/end
     */
    parseBlocks(content) {
        const startMatches = this.parsePattern(content, 'blockStart');
        const endMatches = this.parsePattern(content, 'blockEnd');
        const blocks = [];

        // Match start and end blocks
        for (const startMatch of startMatches) {
            const blockType = startMatch.groups[0];
            const condition = startMatch.groups[1];
            const expectedEnd = this.getBlockEndType(blockType);

            // Find corresponding end block
            const endMatch = endMatches.find(end => 
                end.groups[0] === expectedEnd && 
                end.index > startMatch.end
            );

            if (endMatch) {
                blocks.push({
                    type: 'block',
                    blockType,
                    condition: condition.trim(),
                    start: {
                        raw: startMatch.match,
                        position: { start: startMatch.index, end: startMatch.end }
                    },
                    end: {
                        raw: endMatch.match,
                        position: { start: endMatch.index, end: endMatch.end }
                    },
                    content: content.slice(startMatch.end, endMatch.index)
                });
            }
        }

        return blocks;
    }

    /**
     * Parse comments
     * @param {string} content - Template content
     * @returns {Array} Comment matches
     */
    parseComments(content) {
        const matches = this.parsePattern(content, 'comment');
        return matches.map(match => ({
            type: 'comment',
            content: match.match.slice(2, -2).trim(), // Remove {# #}
            raw: match.match,
            position: {
                start: match.index,
                end: match.end
            }
        }));
    }

    /**
     * Parse filters in variable expressions
     * @param {string} content - Template content
     * @returns {Array} Filter matches
     */
    parseFilters(content) {
        // First get all variable expressions
        const variables = this.parseVariables(content);
        const filters = [];

        for (const variable of variables) {
            const variableContent = variable.raw.slice(2, -2); // Remove {{ }}
            const filterMatches = this.parsePattern(variableContent, 'filter');

            for (const filterMatch of filterMatches) {
                filters.push({
                    type: 'filter',
                    name: filterMatch.groups[0],
                    argument: filterMatch.groups[1] ? filterMatch.groups[1].trim() : null,
                    variable: variable.name,
                    raw: filterMatch.match,
                    position: {
                        start: variable.position.start + filterMatch.index + 2,
                        end: variable.position.start + filterMatch.end + 2
                    }
                });
            }
        }

        return filters;
    }

    /**
     * Parse function calls
     * @param {string} content - Template content
     * @returns {Array} Function call matches
     */
    parseFunctions(content) {
        const matches = this.parsePattern(content, 'functionCall');
        return matches.map(match => ({
            type: 'function',
            name: match.groups[0],
            arguments: this.parseArguments(match.groups[1]),
            raw: match.match,
            position: {
                start: match.index,
                end: match.end
            }
        }));
    }

    /**
     * Parse literals (strings, numbers, booleans)
     * @param {string} content - Template content
     * @returns {Object} Categorized literals
     */
    parseLiterals(content) {
        return {
            strings: this.parsePattern(content, 'stringLiteral').map(match => ({
                type: 'string',
                value: match.groups[1], // Content without quotes
                quote: match.groups[0], // Quote type
                raw: match.match,
                position: { start: match.index, end: match.end }
            })),
            numbers: this.parsePattern(content, 'numberLiteral').map(match => ({
                type: 'number',
                value: parseFloat(match.match),
                raw: match.match,
                position: { start: match.index, end: match.end }
            })),
            booleans: this.parsePattern(content, 'booleanLiteral').map(match => ({
                type: 'boolean',
                value: match.match === 'true',
                raw: match.match,
                position: { start: match.index, end: match.end }
            }))
        };
    }

    /**
     * Parse operators
     * @param {string} content - Template content
     * @returns {Array} Operator matches
     */
    parseOperators(content) {
        const matches = this.parsePattern(content, 'operator');
        return matches.map(match => ({
            type: 'operator',
            operator: match.match,
            precedence: this.getOperatorPrecedence(match.match),
            position: {
                start: match.index,
                end: match.end
            }
        }));
    }

    /**
     * Parse property and array accessors
     * @param {string} content - Template content
     * @returns {Object} Categorized accessors
     */
    parseAccessors(content) {
        return {
            properties: this.parsePattern(content, 'propertyAccess').map(match => ({
                type: 'property',
                object: match.groups[0],
                property: match.groups[1],
                raw: match.match,
                position: { start: match.index, end: match.end }
            })),
            arrays: this.parsePattern(content, 'arrayAccess').map(match => ({
                type: 'array',
                array: match.groups[0],
                index: match.groups[1].trim(),
                raw: match.match,
                position: { start: match.index, end: match.end }
            }))
        };
    }

    /**
     * Parse function arguments
     * @param {string} argsString - Arguments string
     * @returns {Array} Parsed arguments
     */
    parseArguments(argsString) {
        if (!argsString || argsString.trim() === '') {
            return [];
        }

        const args = [];
        const argPattern = /(?:(['"])((?:(?!\1)[^\\]|\\.)*)(\1)|([^,]+))/g;
        let match;

        while ((match = argPattern.exec(argsString)) !== null) {
            if (match[1]) {
                // String argument
                args.push({
                    type: 'string',
                    value: match[2],
                    raw: match[0].trim()
                });
            } else {
                // Other argument (variable, number, etc.)
                const arg = match[4].trim();
                args.push({
                    type: this.inferArgumentType(arg),
                    value: this.parseArgumentValue(arg),
                    raw: arg
                });
            }
        }

        return args;
    }

    /**
     * Infer argument type from string
     * @param {string} arg - Argument string
     * @returns {string} Inferred type
     */
    inferArgumentType(arg) {
        if (/^\d+(\.\d+)?$/.test(arg)) return 'number';
        if (/^(true|false)$/.test(arg)) return 'boolean';
        if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(arg)) return 'variable';
        return 'expression';
    }

    /**
     * Parse argument value based on type
     * @param {string} arg - Argument string
     * @returns {*} Parsed value
     */
    parseArgumentValue(arg) {
        const type = this.inferArgumentType(arg);
        switch (type) {
            case 'number': return parseFloat(arg);
            case 'boolean': return arg === 'true';
            case 'variable': return arg;
            default: return arg;
        }
    }

    /**
     * Get corresponding end block type
     * @param {string} startType - Start block type
     * @returns {string} End block type
     */
    getBlockEndType(startType) {
        const endTypes = {
            'if': 'endif',
            'for': 'endfor',
            'while': 'endwhile',
            'unless': 'endunless',
            'each': 'endeach'
        };
        return endTypes[startType] || `end${startType}`;
    }

    /**
     * Get operator precedence for parsing
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
     * Validate template syntax
     * @param {string} content - Template content
     * @returns {Object} Validation result
     */
    validateSyntax(content) {
        const errors = [];
        const warnings = [];

        try {
            // Check for unmatched blocks
            const blocks = this.parseBlocks(content);
            const startMatches = this.parsePattern(content, 'blockStart');
            const endMatches = this.parsePattern(content, 'blockEnd');

            if (startMatches.length !== endMatches.length) {
                errors.push({
                    type: 'unmatched_blocks',
                    message: 'Unmatched block statements found',
                    starts: startMatches.length,
                    ends: endMatches.length
                });
            }

            // Check for invalid variable names
            const variables = this.parseVariables(content);
            for (const variable of variables) {
                if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*$/.test(variable.name)) {
                    errors.push({
                        type: 'invalid_variable',
                        message: `Invalid variable name: ${variable.name}`,
                        position: variable.position
                    });
                }
            }

            // Check for unclosed interpolations
            const openBraces = (content.match(/\{\{/g) || []).length;
            const closeBraces = (content.match(/\}\}/g) || []).length;
            
            if (openBraces !== closeBraces) {
                errors.push({
                    type: 'unclosed_interpolation',
                    message: 'Unclosed variable interpolation',
                    opens: openBraces,
                    closes: closeBraces
                });
            }

        } catch (error) {
            errors.push({
                type: 'parse_error',
                message: error.message,
                error
            });
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Get pattern by name
     * @param {string} name - Pattern name
     * @returns {RegExp} Compiled pattern
     */
    getPattern(name) {
        return this.compiledPatterns.get(name);
    }

    /**
     * Add custom pattern
     * @param {string} name - Pattern name
     * @param {RegExp} pattern - Regex pattern
     */
    addPattern(name, pattern) {
        this.patterns[name] = pattern;
        this.compiledPatterns.set(name, new RegExp(pattern.source, pattern.flags));
    }

    /**
     * Remove pattern
     * @param {string} name - Pattern name
     */
    removePattern(name) {
        delete this.patterns[name];
        this.compiledPatterns.delete(name);
    }
}
