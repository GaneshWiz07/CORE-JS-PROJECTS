/**
 * Command Pattern Implementation for Canvas Drawing Operations
 * Each drawing action is encapsulated as a command with execute/undo methods
 */

// Base Command interface
class Command {
    execute() {
        throw new Error('Command must implement execute method');
    }

    undo() {
        throw new Error('Command must implement undo method');
    }

    getType() {
        return this.constructor.name;
    }

    getTimestamp() {
        return this.timestamp || Date.now();
    }
}

// Draw Command - handles drawing operations
class DrawCommand extends Command {
    constructor(canvas, path, style) {
        super();
        this.canvas = canvas;
        this.path = path; // Array of {x, y} points
        this.style = { ...style }; // {color, lineWidth, lineCap, lineJoin}
        this.timestamp = Date.now();
        this.previousImageData = null;
    }

    execute() {
        const ctx = this.canvas.getContext('2d');
        
        // Save current state before drawing
        this.previousImageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply drawing style
        ctx.strokeStyle = this.style.color;
        ctx.lineWidth = this.style.lineWidth;
        ctx.lineCap = this.style.lineCap || 'round';
        ctx.lineJoin = this.style.lineJoin || 'round';
        
        // Draw the path
        if (this.path.length > 0) {
            ctx.beginPath();
            ctx.moveTo(this.path[0].x, this.path[0].y);
            
            for (let i = 1; i < this.path.length; i++) {
                ctx.lineTo(this.path[i].x, this.path[i].y);
            }
            
            ctx.stroke();
        }
    }

    undo() {
        if (this.previousImageData) {
            const ctx = this.canvas.getContext('2d');
            ctx.putImageData(this.previousImageData, 0, 0);
        }
    }

    // Get command metadata
    getMetadata() {
        return {
            type: 'draw',
            pointCount: this.path.length,
            color: this.style.color,
            lineWidth: this.style.lineWidth,
            timestamp: this.timestamp,
            pathLength: this.calculatePathLength()
        };
    }

    calculatePathLength() {
        let length = 0;
        for (let i = 1; i < this.path.length; i++) {
            const dx = this.path[i].x - this.path[i-1].x;
            const dy = this.path[i].y - this.path[i-1].y;
            length += Math.sqrt(dx * dx + dy * dy);
        }
        return Math.round(length);
    }
}

// Clear Command - clears the entire canvas
class ClearCommand extends Command {
    constructor(canvas) {
        super();
        this.canvas = canvas;
        this.timestamp = Date.now();
        this.previousImageData = null;
    }

    execute() {
        const ctx = this.canvas.getContext('2d');
        
        // Save current state before clearing
        this.previousImageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // Clear the canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    undo() {
        if (this.previousImageData) {
            const ctx = this.canvas.getContext('2d');
            ctx.putImageData(this.previousImageData, 0, 0);
        }
    }

    getMetadata() {
        return {
            type: 'clear',
            timestamp: this.timestamp,
            canvasSize: `${this.canvas.width}x${this.canvas.height}`
        };
    }
}

// Composite Command - groups multiple commands together
class CompositeCommand extends Command {
    constructor(commands = []) {
        super();
        this.commands = commands;
        this.timestamp = Date.now();
    }

    addCommand(command) {
        this.commands.push(command);
    }

    execute() {
        this.commands.forEach(command => command.execute());
    }

    undo() {
        // Undo in reverse order
        for (let i = this.commands.length - 1; i >= 0; i--) {
            this.commands[i].undo();
        }
    }

    getMetadata() {
        return {
            type: 'composite',
            commandCount: this.commands.length,
            timestamp: this.timestamp,
            subCommands: this.commands.map(cmd => cmd.getType())
        };
    }
}

// Batch Command - for optimized batch operations
class BatchCommand extends Command {
    constructor(canvas, operations) {
        super();
        this.canvas = canvas;
        this.operations = operations; // Array of drawing operations
        this.timestamp = Date.now();
        this.previousImageData = null;
    }

    execute() {
        const ctx = this.canvas.getContext('2d');
        
        // Save current state
        this.previousImageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // Execute all operations in batch
        this.operations.forEach(operation => {
            this.executeOperation(ctx, operation);
        });
    }

    executeOperation(ctx, operation) {
        switch (operation.type) {
            case 'draw':
                ctx.strokeStyle = operation.style.color;
                ctx.lineWidth = operation.style.lineWidth;
                ctx.lineCap = operation.style.lineCap || 'round';
                ctx.lineJoin = operation.style.lineJoin || 'round';
                
                ctx.beginPath();
                ctx.moveTo(operation.path[0].x, operation.path[0].y);
                for (let i = 1; i < operation.path.length; i++) {
                    ctx.lineTo(operation.path[i].x, operation.path[i].y);
                }
                ctx.stroke();
                break;
                
            case 'clear':
                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                break;
        }
    }

    undo() {
        if (this.previousImageData) {
            const ctx = this.canvas.getContext('2d');
            ctx.putImageData(this.previousImageData, 0, 0);
        }
    }

    getMetadata() {
        return {
            type: 'batch',
            operationCount: this.operations.length,
            timestamp: this.timestamp
        };
    }
}

// Command Factory - creates commands based on type
class CommandFactory {
    static createDrawCommand(canvas, path, style) {
        return new DrawCommand(canvas, path, style);
    }

    static createClearCommand(canvas) {
        return new ClearCommand(canvas);
    }

    static createCompositeCommand(commands = []) {
        return new CompositeCommand(commands);
    }

    static createBatchCommand(canvas, operations) {
        return new BatchCommand(canvas, operations);
    }

    // Create command from serialized data
    static fromJSON(canvas, data) {
        switch (data.type) {
            case 'DrawCommand':
                return new DrawCommand(canvas, data.path, data.style);
            case 'ClearCommand':
                return new ClearCommand(canvas);
            case 'CompositeCommand':
                const commands = data.commands.map(cmdData => 
                    CommandFactory.fromJSON(canvas, cmdData)
                );
                return new CompositeCommand(commands);
            case 'BatchCommand':
                return new BatchCommand(canvas, data.operations);
            default:
                throw new Error(`Unknown command type: ${data.type}`);
        }
    }
}

// Command History Manager - manages command execution and history
class CommandHistory {
    constructor() {
        this.history = [];
        this.maxHistorySize = 100;
        this.listeners = [];
    }

    execute(command) {
        command.execute();
        this.history.push({
            command,
            timestamp: Date.now(),
            metadata: command.getMetadata ? command.getMetadata() : {}
        });

        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }

        this.notifyListeners('execute', command);
    }

    getHistory() {
        return this.history.map(entry => ({
            type: entry.command.getType(),
            timestamp: entry.timestamp,
            metadata: entry.metadata
        }));
    }

    clear() {
        this.history = [];
        this.notifyListeners('clear');
    }

    addListener(callback) {
        this.listeners.push(callback);
    }

    removeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    notifyListeners(action, command = null) {
        this.listeners.forEach(callback => {
            callback({ action, command, history: this.getHistory() });
        });
    }

    // Export history as JSON
    exportHistory() {
        return JSON.stringify(this.history.map(entry => ({
            type: entry.command.constructor.name,
            timestamp: entry.timestamp,
            metadata: entry.metadata,
            // Add serializable command data here if needed
        })));
    }

    // Get statistics
    getStats() {
        const stats = {
            totalCommands: this.history.length,
            commandTypes: {},
            timeRange: null,
            avgCommandsPerMinute: 0
        };

        if (this.history.length > 0) {
            const firstTimestamp = this.history[0].timestamp;
            const lastTimestamp = this.history[this.history.length - 1].timestamp;
            const timeSpan = (lastTimestamp - firstTimestamp) / 1000 / 60; // minutes

            stats.timeRange = {
                start: new Date(firstTimestamp).toLocaleTimeString(),
                end: new Date(lastTimestamp).toLocaleTimeString(),
                duration: `${Math.round(timeSpan)} minutes`
            };

            stats.avgCommandsPerMinute = timeSpan > 0 ? Math.round(this.history.length / timeSpan) : 0;

            // Count command types
            this.history.forEach(entry => {
                const type = entry.command.getType();
                stats.commandTypes[type] = (stats.commandTypes[type] || 0) + 1;
            });
        }

        return stats;
    }
}

// Export classes
window.Command = Command;
window.DrawCommand = DrawCommand;
window.ClearCommand = ClearCommand;
window.CompositeCommand = CompositeCommand;
window.BatchCommand = BatchCommand;
window.CommandFactory = CommandFactory;
window.CommandHistory = CommandHistory;
