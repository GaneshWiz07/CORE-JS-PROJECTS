/**
 * Custom Hooks System - Framework-free state and effect management
 * Demonstrates hook patterns without React or other frameworks
 */

class HooksSystem {
    constructor() {
        this.hooks = new Map();
        this.currentComponent = null;
        this.hookIndex = 0;
        this.subscribers = new Map();
        this.effects = [];
        this.cleanups = [];
    }

    // Set current component context for hooks
    setCurrentComponent(component) {
        this.currentComponent = component;
        this.hookIndex = 0;
    }

    // useState hook implementation
    useState(initialValue) {
        const component = this.currentComponent;
        const index = this.hookIndex++;
        const key = `${component}-state-${index}`;

        if (!this.hooks.has(key)) {
            this.hooks.set(key, initialValue);
        }

        const setState = (newValue) => {
            const currentValue = this.hooks.get(key);
            const nextValue = typeof newValue === 'function' ? newValue(currentValue) : newValue;
            
            if (currentValue !== nextValue) {
                this.hooks.set(key, nextValue);
                this.notifySubscribers(key, nextValue);
                this.triggerRerender(component);
            }
        };

        return [this.hooks.get(key), setState];
    }

    // useEffect hook implementation
    useEffect(callback, dependencies = []) {
        const component = this.currentComponent;
        const index = this.hookIndex++;
        const key = `${component}-effect-${index}`;

        const prevDeps = this.hooks.get(`${key}-deps`);
        const hasChanged = !prevDeps || dependencies.some((dep, i) => dep !== prevDeps[i]);

        if (hasChanged) {
            // Cleanup previous effect
            const cleanup = this.hooks.get(`${key}-cleanup`);
            if (cleanup && typeof cleanup === 'function') {
                cleanup();
            }

            // Run new effect
            const newCleanup = callback();
            this.hooks.set(`${key}-cleanup`, newCleanup);
            this.hooks.set(`${key}-deps`, dependencies);
        }
    }

    // useRef hook implementation
    useRef(initialValue) {
        const component = this.currentComponent;
        const index = this.hookIndex++;
        const key = `${component}-ref-${index}`;

        if (!this.hooks.has(key)) {
            this.hooks.set(key, { current: initialValue });
        }

        return this.hooks.get(key);
    }

    // useMemo hook implementation
    useMemo(factory, dependencies = []) {
        const component = this.currentComponent;
        const index = this.hookIndex++;
        const key = `${component}-memo-${index}`;

        const prevDeps = this.hooks.get(`${key}-deps`);
        const hasChanged = !prevDeps || dependencies.some((dep, i) => dep !== prevDeps[i]);

        if (hasChanged) {
            const value = factory();
            this.hooks.set(key, value);
            this.hooks.set(`${key}-deps`, dependencies);
        }

        return this.hooks.get(key);
    }

    // useCallback hook implementation
    useCallback(callback, dependencies = []) {
        return this.useMemo(() => callback, dependencies);
    }

    // Custom hook: useLocalStorage
    useLocalStorage(key, initialValue) {
        const [storedValue, setStoredValue] = this.useState(() => {
            try {
                const item = window.localStorage.getItem(key);
                return item ? JSON.parse(item) : initialValue;
            } catch (error) {
                console.warn(`Error reading localStorage key "${key}":`, error);
                return initialValue;
            }
        });

        const setValue = (value) => {
            try {
                const valueToStore = typeof value === 'function' ? value(storedValue) : value;
                setStoredValue(valueToStore);
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            } catch (error) {
                console.warn(`Error setting localStorage key "${key}":`, error);
            }
        };

        return [storedValue, setValue];
    }

    // Custom hook: useCanvas
    useCanvas(canvasRef) {
        const [context, setContext] = this.useState(null);
        const [dimensions, setDimensions] = this.useState({ width: 0, height: 0 });

        this.useEffect(() => {
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                setContext(ctx);
                
                const updateDimensions = () => {
                    setDimensions({
                        width: canvasRef.current.width,
                        height: canvasRef.current.height
                    });
                };

                updateDimensions();
                window.addEventListener('resize', updateDimensions);

                return () => {
                    window.removeEventListener('resize', updateDimensions);
                };
            }
        }, [canvasRef.current]);

        return { context, dimensions };
    }

    // Custom hook: useCommandStack
    useCommandStack() {
        const [undoStack, setUndoStack] = this.useState([]);
        const [redoStack, setRedoStack] = this.useState([]);

        const executeCommand = (command) => {
            command.execute();
            setUndoStack(prev => [...prev, command]);
            setRedoStack([]); // Clear redo stack when new command is executed
        };

        const undo = () => {
            if (undoStack.length > 0) {
                const command = undoStack[undoStack.length - 1];
                command.undo();
                setUndoStack(prev => prev.slice(0, -1));
                setRedoStack(prev => [...prev, command]);
            }
        };

        const redo = () => {
            if (redoStack.length > 0) {
                const command = redoStack[redoStack.length - 1];
                command.execute();
                setRedoStack(prev => prev.slice(0, -1));
                setUndoStack(prev => [...prev, command]);
            }
        };

        const clear = () => {
            setUndoStack([]);
            setRedoStack([]);
        };

        return {
            undoStack,
            redoStack,
            executeCommand,
            undo,
            redo,
            clear,
            canUndo: undoStack.length > 0,
            canRedo: redoStack.length > 0
        };
    }

    // Custom hook: useDrawingState
    useDrawingState() {
        const [isDrawing, setIsDrawing] = this.useState(false);
        const [brushSize, setBrushSize] = this.useState(5);
        const [color, setColor] = this.useState('#000000');
        const [tool, setTool] = this.useState('brush');

        return {
            isDrawing,
            setIsDrawing,
            brushSize,
            setBrushSize,
            color,
            setColor,
            tool,
            setTool
        };
    }

    // Subscribe to hook state changes
    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        this.subscribers.get(key).add(callback);

        // Return unsubscribe function
        return () => {
            const subs = this.subscribers.get(key);
            if (subs) {
                subs.delete(callback);
            }
        };
    }

    // Notify subscribers of state changes
    notifySubscribers(key, value) {
        const subs = this.subscribers.get(key);
        if (subs) {
            subs.forEach(callback => callback(value));
        }
    }

    // Trigger component re-render
    triggerRerender(component) {
        // In a real framework, this would trigger a re-render
        // For our demo, we'll emit a custom event
        const event = new CustomEvent('hookStateChange', {
            detail: { component, hooks: this.getComponentHooks(component) }
        });
        document.dispatchEvent(event);
    }

    // Get all hooks for a component
    getComponentHooks(component) {
        const componentHooks = {};
        for (const [key, value] of this.hooks.entries()) {
            if (key.startsWith(component)) {
                componentHooks[key] = value;
            }
        }
        return componentHooks;
    }

    // Get hook statistics
    getStats() {
        const stats = {
            totalHooks: this.hooks.size,
            components: new Set(),
            hookTypes: {
                state: 0,
                effect: 0,
                ref: 0,
                memo: 0
            }
        };

        for (const key of this.hooks.keys()) {
            const [component, type] = key.split('-');
            stats.components.add(component);
            
            if (stats.hookTypes.hasOwnProperty(type)) {
                stats.hookTypes[type]++;
            }
        }

        stats.components = stats.components.size;
        return stats;
    }

    // Cleanup all hooks
    cleanup() {
        // Run all cleanup functions
        for (const [key, value] of this.hooks.entries()) {
            if (key.includes('-cleanup') && typeof value === 'function') {
                value();
            }
        }
        
        this.hooks.clear();
        this.subscribers.clear();
        this.effects = [];
        this.cleanups = [];
    }
}

// Global hooks instance
const hooksSystem = new HooksSystem();

// Export hooks for use in components
window.useState = hooksSystem.useState.bind(hooksSystem);
window.useEffect = hooksSystem.useEffect.bind(hooksSystem);
window.useRef = hooksSystem.useRef.bind(hooksSystem);
window.useMemo = hooksSystem.useMemo.bind(hooksSystem);
window.useCallback = hooksSystem.useCallback.bind(hooksSystem);
window.useLocalStorage = hooksSystem.useLocalStorage.bind(hooksSystem);
window.useCanvas = hooksSystem.useCanvas.bind(hooksSystem);
window.useCommandStack = hooksSystem.useCommandStack.bind(hooksSystem);
window.useDrawingState = hooksSystem.useDrawingState.bind(hooksSystem);
window.hooksSystem = hooksSystem;
