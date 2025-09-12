/**
 * Canvas Manager - Handles Canvas API operations and state snapshoting
 * Manages drawing operations, state capture, and restoration
 */

class CanvasManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.stateStack = [];
        this.maxStates = 50;
        this.currentPath = [];
        this.isDrawing = false;
        
        // Initialize canvas settings
        this.initializeCanvas();
    }

    initializeCanvas() {
        // Set default canvas properties
        this.context.lineCap = 'round';
        this.context.lineJoin = 'round';
        this.context.imageSmoothingEnabled = true;
        
        // Set canvas background
        this.context.fillStyle = '#ffffff';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save initial state
        this.saveState();
    }

    // State Snapshoting Methods
    saveState() {
        const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const state = {
            imageData: imageData,
            timestamp: Date.now(),
            size: this.calculateStateSize(imageData)
        };
        
        this.stateStack.push(state);
        
        // Limit stack size
        if (this.stateStack.length > this.maxStates) {
            this.stateStack.shift();
        }
        
        return state;
    }

    restoreState(stateIndex = -1) {
        const index = stateIndex < 0 ? this.stateStack.length + stateIndex : stateIndex;
        
        if (index >= 0 && index < this.stateStack.length) {
            const state = this.stateStack[index];
            this.context.putImageData(state.imageData, 0, 0);
            return true;
        }
        
        return false;
    }

    getCurrentState() {
        return this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    calculateStateSize(imageData) {
        // Estimate memory usage in KB
        return Math.round((imageData.data.length * 4) / 1024);
    }

    getStateStackInfo() {
        return {
            count: this.stateStack.length,
            totalSize: this.stateStack.reduce((total, state) => total + state.size, 0),
            maxStates: this.maxStates,
            oldestTimestamp: this.stateStack.length > 0 ? this.stateStack[0].timestamp : null,
            newestTimestamp: this.stateStack.length > 0 ? this.stateStack[this.stateStack.length - 1].timestamp : null
        };
    }

    // Drawing Methods
    startDrawing(x, y, style) {
        this.isDrawing = true;
        this.currentPath = [{ x, y }];
        
        // Apply drawing style
        this.context.strokeStyle = style.color;
        this.context.lineWidth = style.lineWidth;
        this.context.lineCap = style.lineCap || 'round';
        this.context.lineJoin = style.lineJoin || 'round';
        
        // Begin path
        this.context.beginPath();
        this.context.moveTo(x, y);
    }

    continueDrawing(x, y) {
        if (!this.isDrawing) return;
        
        this.currentPath.push({ x, y });
        this.context.lineTo(x, y);
        this.context.stroke();
    }

    stopDrawing() {
        if (!this.isDrawing) return null;
        
        this.isDrawing = false;
        const path = [...this.currentPath];
        this.currentPath = [];
        
        return path;
    }

    // Direct drawing methods
    drawPath(path, style) {
        if (path.length === 0) return;
        
        this.context.strokeStyle = style.color;
        this.context.lineWidth = style.lineWidth;
        this.context.lineCap = style.lineCap || 'round';
        this.context.lineJoin = style.lineJoin || 'round';
        
        this.context.beginPath();
        this.context.moveTo(path[0].x, path[0].y);
        
        for (let i = 1; i < path.length; i++) {
            this.context.lineTo(path[i].x, path[i].y);
        }
        
        this.context.stroke();
    }

    drawSmoothPath(path, style) {
        if (path.length < 2) return;
        
        this.context.strokeStyle = style.color;
        this.context.lineWidth = style.lineWidth;
        this.context.lineCap = style.lineCap || 'round';
        this.context.lineJoin = style.lineJoin || 'round';
        
        this.context.beginPath();
        this.context.moveTo(path[0].x, path[0].y);
        
        // Use quadratic curves for smoother lines
        for (let i = 1; i < path.length - 1; i++) {
            const cpx = (path[i].x + path[i + 1].x) / 2;
            const cpy = (path[i].y + path[i + 1].y) / 2;
            this.context.quadraticCurveTo(path[i].x, path[i].y, cpx, cpy);
        }
        
        // Draw final segment
        if (path.length > 1) {
            const lastPoint = path[path.length - 1];
            this.context.lineTo(lastPoint.x, lastPoint.y);
        }
        
        this.context.stroke();
    }

    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // Restore white background
        this.context.fillStyle = '#ffffff';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Utility methods
    getCanvasCoordinates(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        };
    }

    // Export/Import methods
    exportAsDataURL(format = 'image/png', quality = 1.0) {
        return this.canvas.toDataURL(format, quality);
    }

    exportAsBlob(callback, format = 'image/png', quality = 1.0) {
        this.canvas.toBlob(callback, format, quality);
    }

    importFromImage(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.clear();
                this.context.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
                this.saveState();
                resolve();
            };
            img.onerror = reject;
            img.src = imageUrl;
        });
    }

    // Performance optimization methods
    setImageSmoothingEnabled(enabled) {
        this.context.imageSmoothingEnabled = enabled;
    }

    optimizeForDrawing() {
        // Disable image smoothing for better performance during drawing
        this.context.imageSmoothingEnabled = false;
    }

    optimizeForDisplay() {
        // Enable image smoothing for better visual quality
        this.context.imageSmoothingEnabled = true;
    }

    // Debug and analysis methods
    getCanvasInfo() {
        return {
            width: this.canvas.width,
            height: this.canvas.height,
            pixelRatio: window.devicePixelRatio || 1,
            contextType: this.context.constructor.name,
            imageSmoothingEnabled: this.context.imageSmoothingEnabled,
            isDrawing: this.isDrawing,
            currentPathLength: this.currentPath.length,
            stateStackInfo: this.getStateStackInfo()
        };
    }

    analyzeCanvas() {
        const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        let nonWhitePixels = 0;
        let totalAlpha = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            totalAlpha += a;
            
            // Check if pixel is not white (allowing for slight variations)
            if (r < 250 || g < 250 || b < 250) {
                nonWhitePixels++;
            }
        }
        
        const totalPixels = (data.length / 4);
        
        return {
            totalPixels,
            nonWhitePixels,
            drawingCoverage: (nonWhitePixels / totalPixels * 100).toFixed(2) + '%',
            averageAlpha: (totalAlpha / totalPixels / 255 * 100).toFixed(2) + '%',
            isEmpty: nonWhitePixels === 0
        };
    }

    // Event handling helpers
    setupEventListeners() {
        let isDrawing = false;
        let currentStyle = {
            color: '#000000',
            lineWidth: 5,
            lineCap: 'round',
            lineJoin: 'round'
        };

        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => {
            const coords = this.getCanvasCoordinates(e);
            this.startDrawing(coords.x, coords.y, currentStyle);
            isDrawing = true;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (isDrawing) {
                const coords = this.getCanvasCoordinates(e);
                this.continueDrawing(coords.x, coords.y);
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            if (isDrawing) {
                const path = this.stopDrawing();
                isDrawing = false;
                
                // Emit custom event with path data
                const event = new CustomEvent('pathCompleted', {
                    detail: { path, style: { ...currentStyle } }
                });
                this.canvas.dispatchEvent(event);
            }
        });

        // Touch events for mobile support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const coords = this.getCanvasCoordinates(touch);
            this.startDrawing(coords.x, coords.y, currentStyle);
            isDrawing = true;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (isDrawing) {
                const touch = e.touches[0];
                const coords = this.getCanvasCoordinates(touch);
                this.continueDrawing(coords.x, coords.y);
            }
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (isDrawing) {
                const path = this.stopDrawing();
                isDrawing = false;
                
                const event = new CustomEvent('pathCompleted', {
                    detail: { path, style: { ...currentStyle } }
                });
                this.canvas.dispatchEvent(event);
            }
        });

        // Style update method
        this.updateStyle = (newStyle) => {
            currentStyle = { ...currentStyle, ...newStyle };
        };
    }
}

// Stack-based Undo/Redo System
class UndoRedoStack {
    constructor(maxSize = 50) {
        this.undoStack = [];
        this.redoStack = [];
        this.maxSize = maxSize;
    }

    push(state) {
        // Add to undo stack
        this.undoStack.push(state);
        
        // Clear redo stack when new action is performed
        this.redoStack = [];
        
        // Limit stack size
        if (this.undoStack.length > this.maxSize) {
            this.undoStack.shift();
        }
    }

    undo() {
        if (this.undoStack.length > 1) {
            // Move current state to redo stack
            const currentState = this.undoStack.pop();
            this.redoStack.push(currentState);
            
            // Return previous state
            return this.undoStack[this.undoStack.length - 1];
        }
        return null;
    }

    redo() {
        if (this.redoStack.length > 0) {
            // Move state back to undo stack
            const state = this.redoStack.pop();
            this.undoStack.push(state);
            
            return state;
        }
        return null;
    }

    canUndo() {
        return this.undoStack.length > 1;
    }

    canRedo() {
        return this.redoStack.length > 0;
    }

    clear() {
        this.undoStack = [];
        this.redoStack = [];
    }

    getStats() {
        return {
            undoCount: this.undoStack.length,
            redoCount: this.redoStack.length,
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            totalMemory: this.calculateTotalMemory()
        };
    }

    calculateTotalMemory() {
        let total = 0;
        
        [...this.undoStack, ...this.redoStack].forEach(state => {
            if (state && state.imageData) {
                total += state.imageData.data.length * 4; // 4 bytes per pixel (RGBA)
            }
        });
        
        return Math.round(total / 1024); // Return in KB
    }
}

// Export classes
window.CanvasManager = CanvasManager;
window.UndoRedoStack = UndoRedoStack;
