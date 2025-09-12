/**
 * Simplified Template Engine - Working Implementation
 * Fixes the dashboard rendering issues
 */
export class SimpleTemplateEngine {
    constructor() {
        this.filters = new Map();
        this.functions = new Map();
        
        this.initializeBuiltins();
    }
    
    initializeBuiltins() {
        // Built-in filters
        this.filters.set('upper', str => String(str).toUpperCase());
        this.filters.set('lower', str => String(str).toLowerCase());
        this.filters.set('capitalize', str => {
            const s = String(str);
            return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        });
        this.filters.set('currency', (amount, currency = 'USD') => {
            const num = parseFloat(amount);
            if (isNaN(num)) return amount;
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency
            }).format(num);
        });
        this.filters.set('date', (date, format = 'YYYY-MM-DD') => {
            const d = new Date(date);
            if (isNaN(d.getTime())) return date;
            
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            
            return format
                .replace('YYYY', year)
                .replace('MM', month)
                .replace('DD', day)
                .replace('HH', hours)
                .replace('mm', minutes)
                .replace('dddd', d.toLocaleDateString('en-US', { weekday: 'long' }))
                .replace('MMMM', d.toLocaleDateString('en-US', { month: 'long' }));
        });
        this.filters.set('len', arr => Array.isArray(arr) ? arr.length : String(arr).length);
        this.filters.set('join', (arr, separator = ',') => Array.isArray(arr) ? arr.join(separator) : arr);
        this.filters.set('default', (value, defaultValue) => value != null ? value : defaultValue);
        this.filters.set('abs', num => Math.abs(parseFloat(num)));
        
        // Built-in functions
        this.functions.set('now', () => new Date());
        this.functions.set('random', (min = 0, max = 1) => Math.random() * (max - min) + min);
    }
    
    render(template, context = {}) {
        let output = template;
        
        // Create loop context for tracking
        const loopStack = [];
        
        // Process for loops first
        output = this.processForLoops(output, context, loopStack);
        
        // Process if statements
        output = this.processIfStatements(output, context);
        
        // Process variables and filters
        output = this.processVariables(output, context);
        
        return output;
    }
    
    processForLoops(template, context, loopStack = []) {
        const forRegex = /\{\%\s*for\s+(\w+)\s+in\s+([^%]+)\s*\%\}([\s\S]*?)\{\%\s*endfor\s*\%\}/g;
        
        return template.replace(forRegex, (match, itemVar, arrayExpr, loopBody) => {
            const arrayValue = this.evaluateExpression(arrayExpr.trim(), context);
            
            if (!Array.isArray(arrayValue)) {
                return '';
            }
            
            let result = '';
            
            arrayValue.forEach((item, index) => {
                const loopContext = {
                    ...context,
                    [itemVar]: item,
                    loop: {
                        index: index + 1,
                        first: index === 0,
                        last: index === arrayValue.length - 1
                    }
                };
                
                // Recursively process nested loops
                let processedBody = this.processForLoops(loopBody, loopContext, [...loopStack, itemVar]);
                processedBody = this.processIfStatements(processedBody, loopContext);
                processedBody = this.processVariables(processedBody, loopContext);
                
                result += processedBody;
            });
            
            return result;
        });
    }
    
    processIfStatements(template, context) {
        // Handle if/elseif/else/endif blocks
        const ifRegex = /\{\%\s*if\s+([^%]+)\s*\%\}([\s\S]*?)(?:\{\%\s*elseif\s+([^%]+)\s*\%\}([\s\S]*?))*(?:\{\%\s*else\s*\%\}([\s\S]*?))?\{\%\s*endif\s*\%\}/g;
        
        return template.replace(ifRegex, (match, condition, ifBody, elseifCondition, elseifBody, elseBody) => {
            if (this.evaluateCondition(condition.trim(), context)) {
                return ifBody;
            } else if (elseifCondition && this.evaluateCondition(elseifCondition.trim(), context)) {
                return elseifBody || '';
            } else if (elseBody) {
                return elseBody;
            }
            return '';
        });
    }
    
    processVariables(template, context) {
        const varRegex = /\{\{\s*([^}]+)\s*\}\}/g;
        
        return template.replace(varRegex, (match, expression) => {
            try {
                const value = this.evaluateExpression(expression.trim(), context);
                return value != null ? String(value) : '';
            } catch (error) {
                console.warn(`Variable evaluation failed: ${expression}`, error);
                return match; // Return original if evaluation fails
            }
        });
    }
    
    evaluateExpression(expression, context) {
        // Handle filters (e.g., "value | filter:param")
        const parts = expression.split('|').map(p => p.trim());
        let value = this.evaluateBasicExpression(parts[0], context);
        
        // Apply filters
        for (let i = 1; i < parts.length; i++) {
            const filterPart = parts[i];
            const [filterName, ...filterArgs] = filterPart.split(':').map(p => p.trim());
            
            if (this.filters.has(filterName)) {
                const filter = this.filters.get(filterName);
                const args = filterArgs.map(arg => {
                    // Remove quotes and evaluate
                    if (arg.startsWith("'") && arg.endsWith("'")) {
                        return arg.slice(1, -1);
                    }
                    return this.evaluateBasicExpression(arg, context);
                });
                value = filter(value, ...args);
            }
        }
        
        return value;
    }
    
    evaluateBasicExpression(expression, context) {
        // Handle function calls
        const funcMatch = expression.match(/^(\w+)\s*\(\s*(.*?)\s*\)$/);
        if (funcMatch) {
            const [, funcName, argsStr] = funcMatch;
            if (this.functions.has(funcName)) {
                const func = this.functions.get(funcName);
                const args = argsStr ? argsStr.split(',').map(arg => this.evaluateBasicExpression(arg.trim(), context)) : [];
                return func(...args);
            }
        }
        
        // Handle property access (e.g., "user.name", "items[0]")
        if (expression.includes('.') || expression.includes('[')) {
            return this.getNestedProperty(context, expression);
        }
        
        // Handle literals
        if (expression.startsWith("'") && expression.endsWith("'")) {
            return expression.slice(1, -1);
        }
        
        if (!isNaN(expression)) {
            return parseFloat(expression);
        }
        
        // Handle simple variable
        return context[expression];
    }
    
    evaluateCondition(condition, context) {
        // Simple condition evaluation
        if (condition.includes('==')) {
            const [left, right] = condition.split('==').map(s => s.trim());
            const leftVal = this.evaluateBasicExpression(left, context);
            const rightVal = this.evaluateBasicExpression(right, context);
            return leftVal == rightVal;
        }
        
        if (condition.includes('>')) {
            const [left, right] = condition.split('>').map(s => s.trim());
            const leftVal = this.evaluateBasicExpression(left, context);
            const rightVal = this.evaluateBasicExpression(right, context);
            return parseFloat(leftVal) > parseFloat(rightVal);
        }
        
        // Simple truthiness check
        const value = this.evaluateBasicExpression(condition, context);
        return !!value;
    }
    
    getNestedProperty(obj, path) {
        const keys = path.split(/[.\[\]]/).filter(key => key !== '');
        let current = obj;
        
        for (const key of keys) {
            if (current == null) return null;
            current = current[key];
        }
        
        return current;
    }
    
    registerFilter(name, filter) {
        this.filters.set(name, filter);
    }
    
    registerFunction(name, func) {
        this.functions.set(name, func);
    }
}
