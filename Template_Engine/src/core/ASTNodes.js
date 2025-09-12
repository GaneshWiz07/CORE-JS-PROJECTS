/**
 * Abstract Syntax Tree Node Types for Template Engine
 * Defines the structure and behavior of AST nodes
 */

/**
 * Base AST Node class
 */
export class ASTNode {
    constructor(type, position = null) {
        this.type = type;
        this.position = position;
        this.parent = null;
        this.children = [];
    }

    /**
     * Add child node
     * @param {ASTNode} child - Child node to add
     */
    addChild(child) {
        if (child instanceof ASTNode) {
            child.parent = this;
            this.children.push(child);
        }
    }

    /**
     * Remove child node
     * @param {ASTNode} child - Child node to remove
     */
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parent = null;
        }
    }

    /**
     * Get all descendants of a specific type
     * @param {string} type - Node type to find
     * @returns {Array<ASTNode>} Matching nodes
     */
    findNodesByType(type) {
        const nodes = [];
        if (this.type === type) {
            nodes.push(this);
        }
        for (const child of this.children) {
            nodes.push(...child.findNodesByType(type));
        }
        return nodes;
    }

    /**
     * Visit all nodes with a callback
     * @param {Function} callback - Callback function
     */
    visit(callback) {
        callback(this);
        for (const child of this.children) {
            child.visit(callback);
        }
    }

    /**
     * Clone the node
     * @returns {ASTNode} Cloned node
     */
    clone() {
        const cloned = new this.constructor();
        cloned.type = this.type;
        cloned.position = this.position ? { ...this.position } : null;
        cloned.children = this.children.map(child => child.clone());
        return cloned;
    }

    /**
     * Convert to JSON representation
     * @returns {Object} JSON representation
     */
    toJSON() {
        return {
            type: this.type,
            position: this.position,
            children: this.children.map(child => child.toJSON())
        };
    }

    /**
     * Get string representation
     * @returns {string} String representation
     */
    toString() {
        return `${this.type}(${this.children.length} children)`;
    }
}

/**
 * Root node of the template AST
 */
export class TemplateNode extends ASTNode {
    constructor(position = null) {
        super('TEMPLATE', position);
        this.metadata = {
            variables: new Set(),
            functions: new Set(),
            blocks: new Set()
        };
    }

    /**
     * Add variable reference
     * @param {string} name - Variable name
     */
    addVariable(name) {
        this.metadata.variables.add(name);
    }

    /**
     * Add function reference
     * @param {string} name - Function name
     */
    addFunction(name) {
        this.metadata.functions.add(name);
    }

    /**
     * Add block reference
     * @param {string} type - Block type
     */
    addBlock(type) {
        this.metadata.blocks.add(type);
    }

    toJSON() {
        return {
            ...super.toJSON(),
            metadata: {
                variables: Array.from(this.metadata.variables),
                functions: Array.from(this.metadata.functions),
                blocks: Array.from(this.metadata.blocks)
            }
        };
    }
}

/**
 * Text content node
 */
export class TextNode extends ASTNode {
    constructor(content, position = null) {
        super('TEXT', position);
        this.content = content;
    }

    toString() {
        return `TEXT("${this.content.substring(0, 20)}${this.content.length > 20 ? '...' : ''}")`;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            content: this.content
        };
    }
}

/**
 * Variable interpolation node
 */
export class VariableNode extends ASTNode {
    constructor(name, filters = [], position = null) {
        super('VARIABLE', position);
        this.name = name;
        this.filters = filters;
        this.expression = null; // For complex expressions
    }

    /**
     * Add filter to variable
     * @param {FilterNode} filter - Filter to add
     */
    addFilter(filter) {
        this.filters.push(filter);
    }

    toString() {
        const filterStr = this.filters.length > 0 ? ` | ${this.filters.map(f => f.name).join(' | ')}` : '';
        return `VARIABLE(${this.name}${filterStr})`;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            name: this.name,
            filters: this.filters.map(f => f.toJSON()),
            expression: this.expression ? this.expression.toJSON() : null
        };
    }
}

/**
 * Expression node for complex expressions
 */
export class ExpressionNode extends ASTNode {
    constructor(operator = null, position = null) {
        super('EXPRESSION', position);
        this.operator = operator;
        this.left = null;
        this.right = null;
    }

    /**
     * Set left operand
     * @param {ASTNode} node - Left operand
     */
    setLeft(node) {
        this.left = node;
        if (node) node.parent = this;
    }

    /**
     * Set right operand
     * @param {ASTNode} node - Right operand
     */
    setRight(node) {
        this.right = node;
        if (node) node.parent = this;
    }

    toString() {
        return `EXPRESSION(${this.operator || 'compound'})`;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            operator: this.operator,
            left: this.left ? this.left.toJSON() : null,
            right: this.right ? this.right.toJSON() : null
        };
    }
}

/**
 * Literal value node
 */
export class LiteralNode extends ASTNode {
    constructor(value, dataType, position = null) {
        super('LITERAL', position);
        this.value = value;
        this.dataType = dataType; // 'string', 'number', 'boolean', 'null'
    }

    toString() {
        return `LITERAL(${this.dataType}: ${JSON.stringify(this.value)})`;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            value: this.value,
            dataType: this.dataType
        };
    }
}

/**
 * Identifier node for variable names
 */
export class IdentifierNode extends ASTNode {
    constructor(name, position = null) {
        super('IDENTIFIER', position);
        this.name = name;
    }

    toString() {
        return `IDENTIFIER(${this.name})`;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            name: this.name
        };
    }
}

/**
 * Property access node (object.property)
 */
export class PropertyAccessNode extends ASTNode {
    constructor(object, property, position = null) {
        super('PROPERTY_ACCESS', position);
        this.object = object;
        this.property = property;
    }

    toString() {
        return `PROPERTY_ACCESS(${this.object}.${this.property})`;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            object: this.object,
            property: this.property
        };
    }
}

/**
 * Array access node (array[index])
 */
export class ArrayAccessNode extends ASTNode {
    constructor(array, index, position = null) {
        super('ARRAY_ACCESS', position);
        this.array = array;
        this.index = index;
    }

    toString() {
        return `ARRAY_ACCESS(${this.array}[${this.index}])`;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            array: this.array,
            index: this.index
        };
    }
}

/**
 * Function call node
 */
export class FunctionCallNode extends ASTNode {
    constructor(name, args = [], position = null) {
        super('FUNCTION_CALL', position);
        this.name = name;
        this.arguments = args;
    }

    /**
     * Add argument to function call
     * @param {ASTNode} arg - Argument node
     */
    addArgument(arg) {
        this.arguments.push(arg);
        if (arg instanceof ASTNode) {
            arg.parent = this;
        }
    }

    toString() {
        return `FUNCTION_CALL(${this.name}(${this.arguments.length} args))`;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            name: this.name,
            arguments: this.arguments.map(arg => 
                arg instanceof ASTNode ? arg.toJSON() : arg
            )
        };
    }
}

/**
 * Filter node for variable filters
 */
export class FilterNode extends ASTNode {
    constructor(name, args = [], position = null) {
        super('FILTER', position);
        this.name = name;
        this.arguments = args;
    }

    /**
     * Add argument to filter
     * @param {*} arg - Filter argument
     */
    addArgument(arg) {
        this.arguments.push(arg);
    }

    toString() {
        return `FILTER(${this.name}${this.arguments.length > 0 ? ':' + this.arguments.join(',') : ''})`;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            name: this.name,
            arguments: this.arguments
        };
    }
}

/**
 * Block node for control structures
 */
export class BlockNode extends ASTNode {
    constructor(blockType, condition = null, position = null) {
        super('BLOCK', position);
        this.blockType = blockType; // 'if', 'for', 'while', etc.
        this.condition = condition;
        this.body = [];
        this.elseBody = null;
    }

    /**
     * Add node to block body
     * @param {ASTNode} node - Node to add
     */
    addToBody(node) {
        this.body.push(node);
        if (node instanceof ASTNode) {
            node.parent = this;
        }
    }

    /**
     * Set else body for if blocks
     * @param {Array<ASTNode>} elseBody - Else body nodes
     */
    setElseBody(elseBody) {
        this.elseBody = elseBody;
        if (Array.isArray(elseBody)) {
            elseBody.forEach(node => {
                if (node instanceof ASTNode) {
                    node.parent = this;
                }
            });
        }
    }

    toString() {
        return `BLOCK(${this.blockType}, ${this.body.length} nodes)`;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            blockType: this.blockType,
            condition: this.condition ? this.condition.toJSON() : null,
            body: this.body.map(node => 
                node instanceof ASTNode ? node.toJSON() : node
            ),
            elseBody: this.elseBody ? this.elseBody.map(node => 
                node instanceof ASTNode ? node.toJSON() : node
            ) : null
        };
    }
}

/**
 * If block node
 */
export class IfNode extends BlockNode {
    constructor(condition, position = null) {
        super('if', condition, position);
        this.elseIfBlocks = [];
    }

    /**
     * Add else-if block
     * @param {Object} elseIfBlock - Else-if block with condition and body
     */
    addElseIf(elseIfBlock) {
        this.elseIfBlocks.push(elseIfBlock);
    }

    toJSON() {
        return {
            ...super.toJSON(),
            elseIfBlocks: this.elseIfBlocks.map(block => ({
                condition: block.condition ? block.condition.toJSON() : null,
                body: block.body.map(node => 
                    node instanceof ASTNode ? node.toJSON() : node
                )
            }))
        };
    }
}

/**
 * For loop node
 */
export class ForNode extends BlockNode {
    constructor(variable, iterable, position = null) {
        super('for', null, position);
        this.variable = variable;
        this.iterable = iterable;
        this.index = null; // Optional index variable
    }

    /**
     * Set index variable for enumeration
     * @param {string} indexVar - Index variable name
     */
    setIndex(indexVar) {
        this.index = indexVar;
    }

    toString() {
        return `FOR(${this.variable} in ${this.iterable})`;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            variable: this.variable,
            iterable: this.iterable,
            index: this.index
        };
    }
}

/**
 * While loop node
 */
export class WhileNode extends BlockNode {
    constructor(condition, position = null) {
        super('while', condition, position);
    }

    toString() {
        return `WHILE(${this.condition})`;
    }
}

/**
 * Comment node
 */
export class CommentNode extends ASTNode {
    constructor(content, position = null) {
        super('COMMENT', position);
        this.content = content;
    }

    toString() {
        return `COMMENT("${this.content.substring(0, 30)}${this.content.length > 30 ? '...' : ''}")`;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            content: this.content
        };
    }
}

/**
 * Include node for template inclusion
 */
export class IncludeNode extends ASTNode {
    constructor(templatePath, context = null, position = null) {
        super('INCLUDE', position);
        this.templatePath = templatePath;
        this.context = context;
    }

    toString() {
        return `INCLUDE(${this.templatePath})`;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            templatePath: this.templatePath,
            context: this.context
        };
    }
}

/**
 * Extend node for template inheritance
 */
export class ExtendsNode extends ASTNode {
    constructor(parentTemplate, position = null) {
        super('EXTENDS', position);
        this.parentTemplate = parentTemplate;
        this.blocks = new Map();
    }

    /**
     * Add block override
     * @param {string} name - Block name
     * @param {Array<ASTNode>} content - Block content
     */
    addBlock(name, content) {
        this.blocks.set(name, content);
    }

    toString() {
        return `EXTENDS(${this.parentTemplate})`;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            parentTemplate: this.parentTemplate,
            blocks: Object.fromEntries(
                Array.from(this.blocks.entries()).map(([name, content]) => [
                    name,
                    content.map(node => node instanceof ASTNode ? node.toJSON() : node)
                ])
            )
        };
    }
}

/**
 * Block definition node for template inheritance
 */
export class BlockDefNode extends ASTNode {
    constructor(name, position = null) {
        super('BLOCK_DEF', position);
        this.name = name;
        this.content = [];
    }

    /**
     * Add content to block
     * @param {ASTNode} node - Content node
     */
    addContent(node) {
        this.content.push(node);
        if (node instanceof ASTNode) {
            node.parent = this;
        }
    }

    toString() {
        return `BLOCK_DEF(${this.name})`;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            name: this.name,
            content: this.content.map(node => 
                node instanceof ASTNode ? node.toJSON() : node
            )
        };
    }
}
