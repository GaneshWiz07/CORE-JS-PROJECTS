# 🎨 Canvas Whiteboard - Custom Hooks & Command Pattern Demo

A comprehensive demonstration of advanced JavaScript concepts including Custom Hooks System, Command Pattern, Stacks, Canvas API, and State Snapshoting - all built without frameworks.

## 🚀 Features

### 🪝 Custom Hooks System
- **useState** - State management without React
- **useEffect** - Side effect handling and cleanup
- **useRef** - Mutable references
- **useMemo** - Computed values with dependency tracking
- **useCallback** - Memoized callbacks
- **useLocalStorage** - Persistent settings storage
- **useCanvas** - Canvas context and dimension management
- **useCommandStack** - Undo/redo stack operations
- **useDrawingState** - Drawing state management

### 🎯 Command Pattern Implementation
- **DrawCommand** - Encapsulates drawing operations
- **ClearCommand** - Canvas clearing operations
- **CompositeCommand** - Groups multiple commands
- **BatchCommand** - Optimized batch operations
- **CommandFactory** - Creates commands by type
- **CommandHistory** - Tracks command execution

### 📚 Stack-Based Undo/Redo
- **UndoRedoStack** - Manages state history
- **State Snapshoting** - Canvas state capture/restore
- **Memory Management** - Automatic cleanup and size limits
- **Performance Optimization** - Efficient state storage

### 🎨 Canvas API Features
- **Drawing Operations** - Smooth brush strokes
- **State Management** - Save/restore canvas states
- **Event Handling** - Mouse and touch support
- **Export/Import** - Save as PNG, load images
- **Performance Modes** - Optimized rendering

## 🏃‍♂️ Getting Started

### 1. Open the Application
```bash
# Simply open index.html in your browser
# Or use a local server:
python -m http.server 8000
# Then visit: http://localhost:8000
```

### 2. Start Drawing
- **Click and drag** to draw on the canvas
- **Adjust brush size** with the slider (1-50px)
- **Change colors** with the color picker
- **Use undo/redo** buttons or Ctrl+Z/Ctrl+Y
- **Clear canvas** with the clear button
- **Save image** as PNG file

### 3. Explore Features
- Watch the **Custom Hooks panel** update in real-time
- Monitor **command counts** and **stack sizes**
- Check **state memory usage**
- Use **keyboard shortcuts** for quick actions

## 🛠️ Architecture

### File Structure
```
Canvas_Whiteboard/
├── index.html          # Main HTML interface
├── styles.css          # Modern CSS styling
├── js/
│   ├── hooks.js         # Custom Hooks System
│   ├── commands.js      # Command Pattern Implementation
│   ├── canvas-manager.js # Canvas API & State Management
│   └── whiteboard.js    # Main Application Logic
└── README.md           # This file
```

### Core Components

#### 1. Custom Hooks System (`hooks.js`)
```javascript
// Framework-free state management
const [state, setState] = useState(initialValue);
const canvasHook = useCanvas(canvasRef);
const { executeCommand, undo, redo } = useCommandStack();
```

#### 2. Command Pattern (`commands.js`)
```javascript
// Encapsulated operations with undo capability
const drawCommand = new DrawCommand(canvas, path, style);
drawCommand.execute();
drawCommand.undo();
```

#### 3. Canvas Manager (`canvas-manager.js`)
```javascript
// State snapshoting and canvas operations
const state = canvasManager.saveState();
canvasManager.restoreState(state);
canvasManager.drawPath(path, style);
```

#### 4. Main Application (`whiteboard.js`)
```javascript
// Integrates all components
const app = new WhiteboardApp();
app.undo(); // Uses both command pattern and state snapshots
```

## 🎯 Concepts Demonstrated

### 1. Command Pattern
Every drawing action is encapsulated as a command:
- **Encapsulation**: Each command contains all data needed for execution
- **Undo/Redo**: Commands implement both execute() and undo() methods
- **Logging**: Command history tracks all operations
- **Composition**: Commands can be grouped and batched

### 2. Stack Data Structures
Two types of stacks manage different aspects:
- **Command Stack**: Manages command objects for undo/redo
- **State Stack**: Manages canvas image data snapshots
- **Memory Management**: Automatic cleanup when stacks exceed limits

### 3. Canvas API Integration
Direct manipulation of HTML5 Canvas:
- **Drawing Context**: 2D rendering context operations
- **Image Data**: Pixel-level state capture and restoration
- **Event Handling**: Mouse and touch coordinate mapping
- **Performance**: Optimized rendering modes

### 4. State Snapshoting
Efficient state management:
- **Image Data Capture**: Full canvas state preservation
- **Memory Optimization**: Compressed state storage
- **Restoration**: Pixel-perfect state recovery
- **Cleanup**: Automatic old state removal

### 5. Custom Hooks System
Framework-free reactive programming:
- **State Management**: Component-scoped state
- **Effect System**: Side effect handling with cleanup
- **Dependency Tracking**: Automatic re-computation
- **Custom Hooks**: Reusable stateful logic

## 🎮 Usage Examples

### Basic Drawing
```javascript
// Start drawing
canvasManager.startDrawing(x, y, style);

// Continue path
canvasManager.continueDrawing(x, y);

// Complete and save
const path = canvasManager.stopDrawing();
const command = new DrawCommand(canvas, path, style);
commandStack.executeCommand(command);
```

### Undo/Redo Operations
```javascript
// Undo last action
if (commandStack.canUndo) {
    commandStack.undo();
    const previousState = undoRedoStack.undo();
    canvasManager.restoreState(previousState);
}

// Redo action
if (commandStack.canRedo) {
    commandStack.redo();
    const nextState = undoRedoStack.redo();
    canvasManager.restoreState(nextState);
}
```

### Custom Hook Usage
```javascript
// In component context
hooksSystem.setCurrentComponent('myComponent');

// Use hooks
const [drawing, setDrawing] = useState(false);
const canvasRef = useRef(null);
const { context } = useCanvas(canvasRef);

useEffect(() => {
    // Setup canvas
    if (context) {
        context.lineCap = 'round';
    }
}, [context]);
```

## 🔧 Keyboard Shortcuts

- **Ctrl+Z** - Undo last action
- **Ctrl+Shift+Z** - Redo last action
- **Ctrl+Y** - Redo last action (alternative)
- **Ctrl+S** - Save canvas as PNG

## 📊 Performance Features

### Memory Management
- **State Compression**: Efficient image data storage
- **Stack Limits**: Automatic cleanup of old states
- **Memory Monitoring**: Real-time memory usage display

### Rendering Optimization
- **Smooth Drawing**: Optimized path rendering
- **Image Smoothing**: Toggleable for performance/quality
- **Event Throttling**: Efficient mouse/touch handling

## 🧪 Debug Features

### Real-time Monitoring
- **Hook States**: Live hook value display
- **Command Counts**: Active command tracking
- **Memory Usage**: Stack size monitoring
- **Performance Metrics**: Drawing statistics

### Debug Methods
```javascript
// Get comprehensive debug info
const debugInfo = whiteboardApp.getDebugInfo();

// Export debug data
whiteboardApp.exportDebugInfo();

// Analyze canvas content
const analysis = canvasManager.analyzeCanvas();
```

## 🎨 Customization

### Drawing Styles
```javascript
const style = {
    color: '#ff0000',
    lineWidth: 10,
    lineCap: 'round',
    lineJoin: 'round'
};
```

### Hook Configuration
```javascript
// Custom hook example
function useCustomDrawing() {
    const [paths, setPaths] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    
    const startRecording = useCallback(() => {
        setIsRecording(true);
        setPaths([]);
    }, []);
    
    return { paths, isRecording, startRecording };
}
```

## 🌟 Educational Value

This project demonstrates:
- **Design Patterns**: Command pattern implementation
- **Data Structures**: Stack-based undo/redo systems
- **State Management**: Custom hooks without frameworks
- **Canvas Programming**: Direct Canvas API manipulation
- **Performance Optimization**: Memory and rendering efficiency
- **Event Handling**: Mouse and touch input processing
- **Modular Architecture**: Clean separation of concerns

Perfect for learning advanced JavaScript concepts and understanding how modern frameworks implement similar features under the hood!

## 🚀 Try It Now

1. Open `index.html` in your browser
2. Start drawing on the canvas
3. Experiment with undo/redo functionality
4. Watch the hooks panel update in real-time
5. Monitor performance metrics
6. Save your artwork as PNG

Experience the power of vanilla JavaScript with modern patterns! 🎨✨
