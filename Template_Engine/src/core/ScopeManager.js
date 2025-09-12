/**
 * Scope Manager for Template Engine
 * Handles variable and function resolution with lexical scoping
 */
export class ScopeManager {
    constructor() {
        this.scopes = [];
        this.globalScope = new Map();
        this.builtins = new Map();
        this.functions = new Map();
        this.filters = new Map();
        
        this.initializeBuiltins();
        this.pushScope(); // Global scope
    }

    /**
     * Initialize built-in variables and functions
     */
    initializeBuiltins() {
        // Built-in variables
        this.builtins.set('true', true);
        this.builtins.set('false', false);
        this.builtins.set('null', null);
        this.builtins.set('undefined', undefined);
        
        // Built-in functions
        this.functions.set('len', (value) => {
            if (Array.isArray(value)) return value.length;
            if (typeof value === 'string') return value.length;
            if (typeof value === 'object' && value !== null) return Object.keys(value).length;
            return 0;
        });
        
        this.functions.set('keys', (obj) => {
            if (typeof obj === 'object' && obj !== null) return Object.keys(obj);
            return [];
        });
        
        this.functions.set('values', (obj) => {
            if (typeof obj === 'object' && obj !== null) return Object.values(obj);
            return [];
        });
        
        this.functions.set('range', (start, end, step = 1) => {
            const result = [];
            if (step > 0) {
                for (let i = start; i < end; i += step) {
                    result.push(i);
                }
            } else if (step < 0) {
                for (let i = start; i > end; i += step) {
                    result.push(i);
                }
            }
            return result;
        });
        
        this.functions.set('default', (value, defaultValue) => {
            return (value === null || value === undefined || value === '') ? defaultValue : value;
        });
        
        // Built-in filters
        this.filters.set('upper', (str) => String(str).toUpperCase());
        this.filters.set('lower', (str) => String(str).toLowerCase());
        this.filters.set('capitalize', (str) => {
            const s = String(str);
            return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        });
        this.filters.set('trim', (str) => String(str).trim());
        this.filters.set('reverse', (arr) => Array.isArray(arr) ? [...arr].reverse() : String(arr).split('').reverse().join(''));
        this.filters.set('sort', (arr) => Array.isArray(arr) ? [...arr].sort() : arr);
        this.filters.set('join', (arr, separator = ',') => Array.isArray(arr) ? arr.join(separator) : String(arr));
        this.filters.set('split', (str, separator = ',') => String(str).split(separator));
        this.filters.set('slice', (arr, start, end) => Array.isArray(arr) ? arr.slice(start, end) : String(arr).slice(start, end));
        this.filters.set('first', (arr) => Array.isArray(arr) ? arr[0] : String(arr)[0]);
        this.filters.set('last', (arr) => Array.isArray(arr) ? arr[arr.length - 1] : String(arr).slice(-1));
        this.filters.set('escape', (str) => {
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;');
        });
        this.filters.set('date', (date, format = 'YYYY-MM-DD') => {
            const d = new Date(date);
            if (isNaN(d.getTime())) return String(date);
            
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const seconds = String(d.getSeconds()).padStart(2, '0');
            
            return format
                .replace('YYYY', year)
                .replace('MM', month)
                .replace('DD', day)
                .replace('HH', hours)
                .replace('mm', minutes)
                .replace('ss', seconds);
        });
    }

    /**
     * Push a new scope onto the stack
     * @param {Object} initialVars - Initial variables for the scope
     */
    pushScope(initialVars = {}) {
        const scope = new Map();
        
        // Add initial variables
        for (const [key, value] of Object.entries(initialVars)) {
            scope.set(key, value);
        }
        
        this.scopes.push(scope);
    }

    /**
     * Pop the current scope from the stack
     * @returns {Map} Popped scope
     */
    popScope() {
        if (this.scopes.length <= 1) {
            throw new Error('Cannot pop global scope');
        }
        return this.scopes.pop();
    }

    /**
     * Get current scope
     * @returns {Map} Current scope
     */
    getCurrentScope() {
        return this.scopes[this.scopes.length - 1];
    }

    /**
     * Get global scope
     * @returns {Map} Global scope
     */
    getGlobalScope() {
        return this.scopes[0];
    }

    /**
     * Set variable in current scope
     * @param {string} name - Variable name
     * @param {*} value - Variable value
     */
    setVariable(name, value) {
        const currentScope = this.getCurrentScope();
        currentScope.set(name, value);
    }

    /**
     * Set variable in global scope
     * @param {string} name - Variable name
     * @param {*} value - Variable value
     */
    setGlobalVariable(name, value) {
        this.getGlobalScope().set(name, value);
    }

    /**
     * Get variable value with scope resolution
     * @param {string} name - Variable name
     * @returns {*} Variable value or undefined
     */
    getVariable(name) {
        // Check built-ins first
        if (this.builtins.has(name)) {
            return this.builtins.get(name);
        }
        
        // Search scopes from current to global
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            const scope = this.scopes[i];
            if (scope.has(name)) {
                return scope.get(name);
            }
        }
        
        // Variable not found
        return undefined;
    }

    /**
     * Check if variable exists in any scope
     * @param {string} name - Variable name
     * @returns {boolean} True if variable exists
     */
    hasVariable(name) {
        // Check built-ins
        if (this.builtins.has(name)) {
            return true;
        }
        
        // Check all scopes
        for (const scope of this.scopes) {
            if (scope.has(name)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Resolve property access (object.property)
     * @param {string} objectName - Object variable name
     * @param {string} propertyName - Property name
     * @returns {*} Property value
     */
    resolveProperty(objectName, propertyName) {
        const object = this.getVariable(objectName);
        
        if (object === null || object === undefined) {
            return undefined;
        }
        
        if (typeof object === 'object') {
            return object[propertyName];
        }
        
        // Handle string/array properties
        if (typeof object === 'string' || Array.isArray(object)) {
            if (propertyName === 'length') {
                return object.length;
            }
        }
        
        return undefined;
    }

    /**
     * Resolve array access (array[index])
     * @param {string} arrayName - Array variable name
     * @param {*} index - Array index
     * @returns {*} Array element value
     */
    resolveArrayAccess(arrayName, index) {
        const array = this.getVariable(arrayName);
        
        if (array === null || array === undefined) {
            return undefined;
        }
        
        // Handle arrays and strings
        if (Array.isArray(array) || typeof array === 'string') {
            const numIndex = Number(index);
            if (!isNaN(numIndex)) {
                return array[numIndex];
            }
        }
        
        // Handle objects with string keys
        if (typeof array === 'object') {
            return array[String(index)];
        }
        
        return undefined;
    }

    /**
     * Resolve complex property path (object.nested.property)
     * @param {string} path - Property path (dot notation)
     * @returns {*} Resolved value
     */
    resolvePropertyPath(path) {
        const parts = path.split('.');
        let current = this.getVariable(parts[0]);
        
        for (let i = 1; i < parts.length; i++) {
            if (current === null || current === undefined) {
                return undefined;
            }
            
            if (typeof current === 'object') {
                current = current[parts[i]];
            } else {
                return undefined;
            }
        }
        
        return current;
    }

    /**
     * Register a function
     * @param {string} name - Function name
     * @param {Function} func - Function implementation
     */
    registerFunction(name, func) {
        this.functions.set(name, func);
    }

    /**
     * Call a function with arguments
     * @param {string} name - Function name
     * @param {Array} args - Function arguments
     * @returns {*} Function result
     */
    callFunction(name, args = []) {
        if (!this.functions.has(name)) {
            throw new Error(`Unknown function: ${name}`);
        }
        
        const func = this.functions.get(name);
        
        try {
            return func.apply(null, args);
        } catch (error) {
            throw new Error(`Error calling function ${name}: ${error.message}`);
        }
    }

    /**
     * Check if function exists
     * @param {string} name - Function name
     * @returns {boolean} True if function exists
     */
    hasFunction(name) {
        return this.functions.has(name);
    }

    /**
     * Register a filter
     * @param {string} name - Filter name
     * @param {Function} filter - Filter implementation
     */
    registerFilter(name, filter) {
        this.filters.set(name, filter);
    }

    /**
     * Apply a filter to a value
     * @param {*} value - Value to filter
     * @param {string} filterName - Filter name
     * @param {Array} args - Filter arguments
     * @returns {*} Filtered value
     */
    applyFilter(value, filterName, args = []) {
        if (!this.filters.has(filterName)) {
            throw new Error(`Unknown filter: ${filterName}`);
        }
        
        const filter = this.filters.get(filterName);
        
        try {
            return filter.apply(null, [value, ...args]);
        } catch (error) {
            throw new Error(`Error applying filter ${filterName}: ${error.message}`);
        }
    }

    /**
     * Check if filter exists
     * @param {string} name - Filter name
     * @returns {boolean} True if filter exists
     */
    hasFilter(name) {
        return this.filters.has(name);
    }

    /**
     * Create a child scope for loops/blocks
     * @param {Object} loopVars - Loop variables (item, index, etc.)
     * @returns {ScopeManager} New scope manager instance
     */
    createChildScope(loopVars = {}) {
        const childScope = new ScopeManager();
        
        // Copy all parent scopes
        childScope.scopes = [...this.scopes];
        childScope.builtins = this.builtins;
        childScope.functions = this.functions;
        childScope.filters = this.filters;
        
        // Push new scope with loop variables
        childScope.pushScope(loopVars);
        
        return childScope;
    }

    /**
     * Evaluate expression in current scope
     * @param {string} expression - Expression to evaluate
     * @returns {*} Expression result
     */
    evaluateExpression(expression) {
        // Simple expression evaluation
        // This is a basic implementation - a full implementation would use the AST
        
        // Handle simple variable references
        if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(expression)) {
            return this.getVariable(expression);
        }
        
        // Handle property access
        if (expression.includes('.')) {
            return this.resolvePropertyPath(expression);
        }
        
        // Handle string literals
        if (/^['"].*['"]$/.test(expression)) {
            return expression.slice(1, -1);
        }
        
        // Handle number literals
        if (/^\d+(\.\d+)?$/.test(expression)) {
            return parseFloat(expression);
        }
        
        // Handle boolean literals
        if (expression === 'true') return true;
        if (expression === 'false') return false;
        if (expression === 'null') return null;
        
        // For complex expressions, return as-is (would need full parser)
        return expression;
    }

    /**
     * Evaluate comparison operations
     * @param {*} left - Left operand
     * @param {string} operator - Comparison operator
     * @param {*} right - Right operand
     * @returns {boolean} Comparison result
     */
    evaluateComparison(left, operator, right) {
        switch (operator) {
            case '==': return left == right;
            case '!=': return left != right;
            case '===': return left === right;
            case '!==': return left !== right;
            case '<': return left < right;
            case '>': return left > right;
            case '<=': return left <= right;
            case '>=': return left >= right;
            default: return false;
        }
    }

    /**
     * Evaluate logical operations
     * @param {*} left - Left operand
     * @param {string} operator - Logical operator
     * @param {*} right - Right operand
     * @returns {*} Logical result
     */
    evaluateLogical(left, operator, right) {
        switch (operator) {
            case '&&': return left && right;
            case '||': return left || right;
            case '!': return !right;
            default: return false;
        }
    }

    /**
     * Evaluate arithmetic operations
     * @param {*} left - Left operand
     * @param {string} operator - Arithmetic operator
     * @param {*} right - Right operand
     * @returns {*} Arithmetic result
     */
    evaluateArithmetic(left, operator, right) {
        const leftNum = Number(left);
        const rightNum = Number(right);
        
        switch (operator) {
            case '+': 
                // Handle string concatenation
                if (typeof left === 'string' || typeof right === 'string') {
                    return String(left) + String(right);
                }
                return leftNum + rightNum;
            case '-': return leftNum - rightNum;
            case '*': return leftNum * rightNum;
            case '/': return rightNum !== 0 ? leftNum / rightNum : 0;
            case '%': return rightNum !== 0 ? leftNum % rightNum : 0;
            default: return 0;
        }
    }

    /**
     * Get all variables in current scope chain
     * @returns {Object} All variables
     */
    getAllVariables() {
        const allVars = {};
        
        // Add built-ins
        for (const [key, value] of this.builtins) {
            allVars[key] = value;
        }
        
        // Add variables from all scopes (global to current)
        for (const scope of this.scopes) {
            for (const [key, value] of scope) {
                allVars[key] = value;
            }
        }
        
        return allVars;
    }

    /**
     * Get scope chain information
     * @returns {Array} Scope chain details
     */
    getScopeChain() {
        return this.scopes.map((scope, index) => ({
            level: index,
            isGlobal: index === 0,
            variables: Object.fromEntries(scope),
            size: scope.size
        }));
    }

    /**
     * Clear all scopes except global
     */
    clearScopes() {
        this.scopes = [this.scopes[0]]; // Keep only global scope
    }

    /**
     * Reset to initial state
     */
    reset() {
        this.scopes = [];
        this.globalScope.clear();
        this.initializeBuiltins();
        this.pushScope(); // Global scope
    }

    /**
     * Debug scope information
     * @returns {Object} Debug information
     */
    debug() {
        return {
            scopeCount: this.scopes.length,
            currentScopeSize: this.getCurrentScope().size,
            globalScopeSize: this.getGlobalScope().size,
            builtinCount: this.builtins.size,
            functionCount: this.functions.size,
            filterCount: this.filters.size,
            scopeChain: this.getScopeChain(),
            allVariables: this.getAllVariables()
        };
    }

    /**
     * Clone the scope manager
     * @returns {ScopeManager} Cloned scope manager
     */
    clone() {
        const cloned = new ScopeManager();
        
        // Copy scopes
        cloned.scopes = this.scopes.map(scope => new Map(scope));
        cloned.builtins = new Map(this.builtins);
        cloned.functions = new Map(this.functions);
        cloned.filters = new Map(this.filters);
        
        return cloned;
    }
}
