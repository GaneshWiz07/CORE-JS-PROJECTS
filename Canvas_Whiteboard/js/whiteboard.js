/**
 * Main Whiteboard Application - Integrates all components
 * Demonstrates Custom Hooks, Command Pattern, Stacks, Canvas API, and State Snapshoting
 */

class WhiteboardApp {
    constructor() {
        this.canvas = null;
        this.canvasManager = null;
        this.undoRedoStack = null;
        this.commandHistory = null;
        this.currentDrawingStyle = {
            color: '#000000',
            lineWidth: 5,
            lineCap: 'round',
            lineJoin: 'round'
        };
        
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupApplication());
        } else {
            this.setupApplication();
        }
    }

    setupApplication() {
        // Initialize canvas and managers
        this.canvas = document.getElementById('whiteboard');
        this.canvasManager = new CanvasManager(this.canvas);
        this.undoRedoStack = new UndoRedoStack();
        this.commandHistory = new CommandHistory();
        
        // Setup hooks system
        this.setupHooks();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup UI updates
        this.setupUIUpdates();
        
        // Initialize hooks display
        this.updateHooksDisplay();
        
        // Initial UI update to set correct button states
        this.updateUI();
        
        console.log('🎨 Whiteboard Application Initialized');
        console.log('📊 Features: Custom Hooks, Command Pattern, Stacks, Canvas API, State Snapshoting');
    }

    setupHooks() {
        // Set component context for hooks
        hooksSystem.setCurrentComponent('whiteboard');
        
        // Initialize drawing state hook
        const drawingState = useDrawingState();
        this.drawingState = drawingState;
        
        // Initialize command stack hook
        const commandStack = useCommandStack();
        this.commandStack = commandStack;
        
        // Initialize canvas hook
        const canvasRef = useRef(this.canvas);
        const canvasHook = useCanvas(canvasRef);
        this.canvasHook = canvasHook;
        
        // Initialize local storage hook for settings
        const [settings, setSettings] = useLocalStorage('whiteboardSettings', {
            brushSize: 5,
            color: '#000000',
            autoSave: true
        });
        this.settings = settings;
        this.setSettings = setSettings;
        
        // Setup effect for auto-save
        useEffect(() => {
            if (this.settings.autoSave) {
                const interval = setInterval(() => {
                    this.autoSave();
                }, 30000); // Auto-save every 30 seconds
                
                return () => clearInterval(interval);
            }
        }, [this.settings.autoSave]);
        
        // Setup effect for canvas state management
        useEffect(() => {
            if (this.canvasManager) {
                // Save initial state
                const initialState = this.canvasManager.saveState();
                this.undoRedoStack.push(initialState);
                this.updateUI();
            }
        }, [this.canvasManager]);
    }

    setupEventListeners() {
        // Canvas drawing events
        let isDrawing = false;
        let currentPath = [];
        
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => {
            const coords = this.canvasManager.getCanvasCoordinates(e);
            isDrawing = true;
            currentPath = [coords];
            
            this.canvasManager.startDrawing(coords.x, coords.y, this.currentDrawingStyle);
            this.drawingState.setIsDrawing(true);
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (isDrawing) {
                const coords = this.canvasManager.getCanvasCoordinates(e);
                currentPath.push(coords);
                this.canvasManager.continueDrawing(coords.x, coords.y);
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            if (isDrawing) {
                isDrawing = false;
                this.drawingState.setIsDrawing(false);
                
                // Create and execute draw command
                const drawCommand = CommandFactory.createDrawCommand(
                    this.canvas,
                    currentPath,
                    { ...this.currentDrawingStyle }
                );
                
                // Execute command through command stack
                this.commandStack.executeCommand(drawCommand);
                
                // Add to command history
                this.commandHistory.execute(drawCommand);
                
                console.log('Command executed. Undo stack:', this.commandStack.undoStack.length);
                
                currentPath = [];
                this.updateUI();
            }
        });
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const coords = this.canvasManager.getCanvasCoordinates(touch);
            isDrawing = true;
            currentPath = [coords];
            
            this.canvasManager.startDrawing(coords.x, coords.y, this.currentDrawingStyle);
            this.drawingState.setIsDrawing(true);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (isDrawing) {
                const touch = e.touches[0];
                const coords = this.canvasManager.getCanvasCoordinates(touch);
                currentPath.push(coords);
                this.canvasManager.continueDrawing(coords.x, coords.y);
            }
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (isDrawing) {
                isDrawing = false;
                this.drawingState.setIsDrawing(false);
                
                const drawCommand = CommandFactory.createDrawCommand(
                    this.canvas,
                    currentPath,
                    { ...this.currentDrawingStyle }
                );
                
                this.commandStack.executeCommand(drawCommand);
                
                this.commandHistory.execute(drawCommand);
                
                console.log('Touch command executed. Undo stack:', this.commandStack.undoStack.length);
                
                currentPath = [];
                this.updateUI();
            }
        });
        
        // Setup UI Controls
        this.setupUIControls();
        
        // Ensure buttons are clickable initially
        setTimeout(() => {
            const undoBtn = document.getElementById('undoBtn');
            const redoBtn = document.getElementById('redoBtn');
            
            if (undoBtn) {
                undoBtn.disabled = false; // Enable initially for testing
                undoBtn.style.pointerEvents = 'auto';
            }
            
            if (redoBtn) {
                redoBtn.disabled = false; // Enable initially for testing  
                redoBtn.style.pointerEvents = 'auto';
            }
        }, 100);
    }

    setupUIControls() {
        // Brush size control
        const brushSizeSlider = document.getElementById('brushSize');
        const brushSizeValue = document.getElementById('brushSizeValue');
        
        brushSizeSlider.addEventListener('input', (e) => {
            const size = parseInt(e.target.value);
            this.currentDrawingStyle.lineWidth = size;
            this.drawingState.setBrushSize(size);
            brushSizeValue.textContent = `${size}px`;
            
            // Update settings
            this.setSettings({ ...this.settings, brushSize: size });
        });
        
        // Color picker
        const colorPicker = document.getElementById('colorPicker');
        colorPicker.addEventListener('change', (e) => {
            const color = e.target.value;
            this.currentDrawingStyle.color = color;
            this.drawingState.setColor(color);
            
            // Update settings
            this.setSettings({ ...this.settings, color: color });
        });
        
        // Undo button
        const undoBtn = document.getElementById('undoBtn');
        undoBtn.addEventListener('click', () => {
            this.undo();
        });
        
        // Redo button
        const redoBtn = document.getElementById('redoBtn');
        redoBtn.addEventListener('click', () => {
            this.redo();
        });
        
        // Clear button
        const clearBtn = document.getElementById('clearBtn');
        clearBtn.addEventListener('click', () => {
            this.clear();
        });
        
        // Save button
        const saveBtn = document.getElementById('saveBtn');
        saveBtn.addEventListener('click', () => {
            this.saveImage();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.redo();
                        } else {
                            this.undo();
                        }
                        break;
                    case 'y':
                        e.preventDefault();
                        this.redo();
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveImage();
                        break;
                }
            }
        });
    }

    setupUIUpdates() {
        // Listen for hook state changes
        document.addEventListener('hookStateChange', (e) => {
            this.updateHooksDisplay();
        });
        
        // Update UI periodically
        setInterval(() => {
            this.updateUI();
        }, 1000);
    }

    undo() {
        console.log('Undo button clicked');
        if (this.commandStack && this.commandStack.canUndo) {
            this.commandStack.undo();
            
            // Also handle canvas state undo
            const previousState = this.undoRedoStack.undo();
            if (previousState) {
                this.canvasManager.context.putImageData(previousState.imageData, 0, 0);
            }
            
            this.updateUI();
        } else if (this.undoRedoStack && this.undoRedoStack.canUndo()) {
            // Fallback to just canvas state undo
            const previousState = this.undoRedoStack.undo();
            if (previousState) {
                this.canvasManager.context.putImageData(previousState.imageData, 0, 0);
            }
            this.updateUI();
        }
    }

    redo() {
        console.log('Redo button clicked');
        if (this.commandStack && this.commandStack.canRedo) {
            this.commandStack.redo();
            
            // Also handle canvas state redo
            const nextState = this.undoRedoStack.redo();
            if (nextState) {
                this.canvasManager.context.putImageData(nextState.imageData, 0, 0);
            }
            
            this.updateUI();
        } else if (this.undoRedoStack && this.undoRedoStack.canRedo()) {
            // Fallback to just canvas state redo
            const nextState = this.undoRedoStack.redo();
            if (nextState) {
                this.canvasManager.context.putImageData(nextState.imageData, 0, 0);
            }
            this.updateUI();
        }
    }

    clear() {
        // Create clear command
        const clearCommand = CommandFactory.createClearCommand(this.canvas);
        
        // Execute through command stack
        this.commandStack.executeCommand(clearCommand);
        
        // Clear canvas manager
        this.canvasManager.clear();
        
        // Save new state
        const newState = this.canvasManager.saveState();
        this.undoRedoStack.push(newState);
        
        // Add to command history
        this.commandHistory.execute(clearCommand);
        
        this.updateUI();
    }

    saveImage() {
        const dataURL = this.canvasManager.exportAsDataURL();
        
        // Create download link
        const link = document.createElement('a');
        link.download = `whiteboard-${Date.now()}.png`;
        link.href = dataURL;
        link.click();
        
        console.log('💾 Image saved successfully');
    }

    autoSave() {
        if (this.settings.autoSave) {
            const dataURL = this.canvasManager.exportAsDataURL();
            localStorage.setItem('whiteboardAutoSave', dataURL);
            console.log('🔄 Auto-saved to localStorage');
        }
    }

    updateUI() {
        // Update command count
        const commandCount = document.getElementById('commandCount');
        if (commandCount) {
            commandCount.textContent = this.commandHistory ? this.commandHistory.getHistory().length : 0;
        }
        
        // Update undo/redo counts - show actual stack counts
        const undoCount = document.getElementById('undoCount');
        const redoCount = document.getElementById('redoCount');
        
        if (undoCount) {
            let undoLength = 0;
            // Debug: Check what stacks exist
            console.log('CommandStack exists:', !!this.commandStack);
            console.log('UndoRedoStack exists:', !!this.undoRedoStack);
            
            if (this.commandStack && this.commandStack.undoStack) {
                undoLength = this.commandStack.undoStack.length;
                console.log('Using commandStack undo length:', undoLength);
            }
            
            // Also add canvas state stack count
            if (this.undoRedoStack) {
                const canvasUndoLength = this.undoRedoStack.undoStack ? this.undoRedoStack.undoStack.length : 0;
                console.log('Canvas undo stack length:', canvasUndoLength);
                undoLength = Math.max(undoLength, canvasUndoLength);
            }
            
            undoCount.textContent = undoLength;
        }
        
        if (redoCount) {
            let redoLength = 0;
            
            if (this.commandStack && this.commandStack.redoStack) {
                redoLength = this.commandStack.redoStack.length;
                console.log('Using commandStack redo length:', redoLength);
            }
            
            // Also add canvas state stack count
            if (this.undoRedoStack) {
                const canvasRedoLength = this.undoRedoStack.redoStack ? this.undoRedoStack.redoStack.length : 0;
                console.log('Canvas redo stack length:', canvasRedoLength);
                redoLength = Math.max(redoLength, canvasRedoLength);
            }
            
            redoCount.textContent = redoLength;
        }
        
        // Update state size
        const stateSize = document.getElementById('stateSize');
        if (stateSize && this.canvasManager) {
            const stackInfo = this.canvasManager.getStateStackInfo();
            stateSize.textContent = `${stackInfo.totalSize} KB`;
        }
        
        // Update button states - ensure buttons are enabled initially
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn) {
            // Enable undo if we have commands in stack OR canvas states to undo
            const canUndo = (this.commandStack && this.commandStack.canUndo) || 
                           (this.undoRedoStack && this.undoRedoStack.canUndo());
            undoBtn.disabled = !canUndo;
        }
        
        if (redoBtn) {
            // Enable redo if we have commands in redo stack OR canvas states to redo
            const canRedo = (this.commandStack && this.commandStack.canRedo) || 
                           (this.undoRedoStack && this.undoRedoStack.canRedo());
            redoBtn.disabled = !canRedo;
        }
    }

    updateHooksDisplay() {
        const hooksList = document.getElementById('hooksList');
        if (!hooksList) return;
        
        const hooks = [
            {
                name: 'useDrawingState',
                description: 'Manages drawing state (isDrawing, brushSize, color)',
                state: `Drawing: ${this.drawingState?.isDrawing || false}, Size: ${this.drawingState?.brushSize || 5}px`
            },
            {
                name: 'useCommandStack',
                description: 'Handles undo/redo command stack operations',
                state: `Undo: ${this.commandStack?.undoStack?.length || 0}, Redo: ${this.commandStack?.redoStack?.length || 0}`
            },
            {
                name: 'useCanvas',
                description: 'Manages canvas context and dimensions',
                state: `${this.canvasHook?.dimensions?.width || 0}x${this.canvasHook?.dimensions?.height || 0}`
            },
            {
                name: 'useLocalStorage',
                description: 'Persists settings to localStorage',
                state: `AutoSave: ${this.settings?.autoSave || false}`
            },
            {
                name: 'useEffect',
                description: 'Handles side effects (auto-save, state management)',
                state: 'Active effects: 2'
            }
        ];
        
        hooksList.innerHTML = hooks.map(hook => `
            <div class="hook-item">
                <div class="hook-name">${hook.name}</div>
                <div class="hook-description">${hook.description}</div>
                <div class="hook-state">${hook.state}</div>
            </div>
        `).join('');
    }

    // Debug methods
    getDebugInfo() {
        return {
            canvas: this.canvasManager.getCanvasInfo(),
            commands: this.commandHistory.getStats(),
            undoRedo: this.undoRedoStack.getStats(),
            hooks: hooksSystem.getStats(),
            settings: this.settings
        };
    }

    exportDebugInfo() {
        const debugInfo = this.getDebugInfo();
        const blob = new Blob([JSON.stringify(debugInfo, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = `whiteboard-debug-${Date.now()}.json`;
        link.href = url;
        link.click();
        
        URL.revokeObjectURL(url);
    }
}

// Initialize application when DOM is ready
let whiteboardApp;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        whiteboardApp = new WhiteboardApp();
        window.whiteboardApp = whiteboardApp;
    });
} else {
    whiteboardApp = new WhiteboardApp();
    window.whiteboardApp = whiteboardApp;
}

// Export for debugging
window.WhiteboardApp = WhiteboardApp;
