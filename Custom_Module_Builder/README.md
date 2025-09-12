# Custom Module Builder

A comprehensive Node.js module builder demonstrating advanced JavaScript concepts including FileSystem API, Path API, Recursion, and Dependency Graphs.

## 🚀 Features

### Core APIs Demonstrated
- **FileSystem API**: Comprehensive file operations with async/await patterns
- **Path API**: Cross-platform path handling and manipulation
- **Recursion**: Deep dependency traversal and discovery
- **Dependency Graphs**: Graph construction, analysis, and visualization

### Key Capabilities
- 📊 **Project Analysis**: Analyze project structure and suggest entry points
- 🔍 **Dependency Discovery**: Recursively discover module dependencies
- 🕸️ **Dependency Graphs**: Build and analyze dependency relationships
- 📦 **Module Bundling**: Bundle modules with optimization
- 🔄 **Circular Dependency Detection**: Identify and handle circular dependencies
- ✂️ **Code Splitting**: Generate shared chunks for optimization
- 📋 **Multiple Output Formats**: ESM, CommonJS, IIFE, UMD
- 🎯 **Tree Shaking**: Remove unused code
- 📈 **Performance Monitoring**: Track build metrics and optimization

## 📁 Project Structure

```
Custom_Module_Builder/
├── src/
│   ├── core/
│   │   ├── DependencyDiscovery.js    # Recursive dependency discovery
│   │   ├── DependencyGraph.js        # Graph construction and analysis
│   │   └── ModuleBundler.js          # Module bundling engine
│   ├── utils/
│   │   ├── FileSystemUtils.js        # FileSystem API utilities
│   │   └── PathUtils.js              # Path API utilities
│   └── index.js                      # Main entry point
├── bin/
│   └── cli.js                        # Command-line interface
├── examples/
│   ├── demo.js                       # Interactive demo
│   └── sample-project/               # Sample project for testing
└── package.json
```

## 🛠️ Installation

```bash
# Clone or navigate to the project
cd Custom_Module_Builder

# Install dependencies
npm install

# Make CLI globally available (optional)
npm link
```

## 🎯 Usage

### Command Line Interface

```bash
# Build modules from project
npm run build
# or
module-builder build --root ./examples/sample-project --output dist

# Analyze project structure
module-builder analyze --root ./examples/sample-project

# Generate dependency graphs
module-builder graph --root ./examples/sample-project --format dot

# Show project statistics
module-builder stats --root ./examples/sample-project
```

### Programmatic API

```javascript
import { CustomModuleBuilder } from './src/index.js';

const builder = new CustomModuleBuilder({
    rootPath: './my-project',
    outputDir: 'dist',
    bundleFormat: 'esm',
    treeshake: true,
    minify: true
});

// Build the project
const result = await builder.build({
    entryPoints: ['src/index.js'],
    verbose: true
});

// Analyze a specific file
const analysis = await builder.analyzeFile('src/main.js');

// Get project statistics
const stats = await builder.getProjectStats();
```

## 🔍 Core Concepts Explained

### 1. FileSystem API Utilities

The `FileSystemUtils` class demonstrates comprehensive file operations:

```javascript
// Recursive directory reading with filtering
const files = await FileSystemUtils.readDirectoryRecursive('./src', {
    includeFiles: true,
    includeDirectories: true,
    maxDepth: 5,
    filter: (name, path, entry) => !name.startsWith('.')
});

// File operations with error handling
const content = await FileSystemUtils.readFileContent('./file.js');
await FileSystemUtils.writeFileContent('./output.js', processedContent);

// Directory tree structure
const tree = await FileSystemUtils.getDirectoryTree('./project');
```

**Key Features:**
- Async/await patterns for all operations
- Recursive directory traversal with depth control
- File watching and change detection
- Cross-platform compatibility
- Comprehensive error handling

### 2. Path API Utilities

The `PathUtils` class provides cross-platform path handling:

```javascript
// Cross-platform path operations
const normalized = PathUtils.normalize(inputPath);
const joined = PathUtils.join('src', 'components', 'Button.js');
const relative = PathUtils.relative('/project/src', '/project/src/components/Button.js');

// Module path resolution
const resolved = PathUtils.resolveImport('./utils', '/project/src', ['.js', '.ts']);

// Platform-specific handling
const posixPath = PathUtils.toPosix(windowsPath);
const commonBase = PathUtils.getCommonBasePath([path1, path2, path3]);
```

**Key Features:**
- Cross-platform path normalization
- Module import resolution
- Security checks for path traversal
- Platform-specific conversions
- Path pattern matching

### 3. Recursive Dependency Discovery

The `DependencyDiscovery` class uses recursion to traverse and discover dependencies:

```javascript
// Recursive dependency discovery
async discoverRecursive(filePath, rootPath, dependencies, currentPath, depth) {
    // Prevent infinite recursion
    if (depth > this.options.maxDepth) return;
    
    // Check for circular dependencies
    if (currentPath.includes(filePath)) {
        this.handleCircularDependency(currentPath, filePath);
        return;
    }
    
    // Process current file
    const fileDependencies = this.parseFileDependencies(content, filePath, rootPath);
    
    // Recursively process dependencies
    for (const dep of fileDependencies) {
        if (dep.resolved && dep.type === 'local') {
            await this.discoverRecursive(
                dep.resolved, rootPath, dependencies, 
                [...currentPath, filePath], depth + 1
            );
        }
    }
}
```

**Recursion Features:**
- Depth-limited traversal to prevent stack overflow
- Circular dependency detection during traversal
- Path tracking for cycle identification
- Memoization to avoid redundant processing
- Error recovery and continuation

### 4. Dependency Graph Construction

The `DependencyGraph` class builds and analyzes module relationships:

```javascript
// Graph construction
this.nodes = new Map(); // File nodes
this.edges = new Map(); // Dependency relationships
this.reverseEdges = new Map(); // Reverse lookup for dependents

// Graph analysis algorithms
const cycles = this.findCircularDependencies(); // DFS cycle detection
const sorted = this.getTopologicalSort(); // Topological ordering
const sccs = this.getStronglyConnectedComponents(); // Tarjan's algorithm
const path = this.findShortestPath(from, to); // BFS pathfinding
```

**Graph Algorithms:**
- **Cycle Detection**: DFS-based circular dependency detection
- **Topological Sort**: Dependency-ordered module loading
- **Strongly Connected Components**: Advanced cycle analysis
- **Shortest Path**: BFS for dependency chain analysis
- **Graph Metrics**: Density, degree distribution, centrality

## 📊 Advanced Features

### Dependency Graph Visualization

Generate multiple visualization formats:

```javascript
// Export formats
const jsonGraph = graph.export('json', { includeMetadata: true });
const dotGraph = graph.export('dot', { maxLabelLength: 25 });
const mermaidGraph = graph.export('mermaid', { maxLabelLength: 20 });
```

**Visualization Options:**
- **JSON**: Detailed graph data for custom visualization
- **DOT**: Graphviz format for professional diagrams
- **Mermaid**: Markdown-compatible diagrams

### Module Bundling Engine

Advanced bundling with multiple output formats:

```javascript
// Bundle generation
const bundles = await bundler.bundle(graph, entryPoints, outputDir);

// Supported formats
- ESM (ES Modules)
- CommonJS (Node.js)
- IIFE (Browser globals)
- UMD (Universal Module Definition)
```

**Bundling Features:**
- Dependency-ordered module inclusion
- Tree shaking for unused code elimination
- Code splitting for shared dependencies
- Minification and optimization
- Source map generation

### Performance Monitoring

Track build performance and optimization:

```javascript
const stats = {
    filesScanned: 150,
    dependenciesFound: 89,
    bundleSize: '245 KB',
    optimizationSavings: '67 KB',
    buildTime: '1.2s'
};
```

## 🎮 Interactive Demo

Run the comprehensive demo to see all features in action:

```bash
npm run demo
```

The demo showcases:
1. **Project Analysis**: File structure and pattern detection
2. **File Analysis**: Individual file dependency analysis
3. **Module Building**: Complete build process with optimization
4. **Graph Analysis**: Dependency relationship visualization

## 🧪 Example Projects

### Sample Calculator Project

The included sample project demonstrates:
- Multi-level dependency structure
- Utility module organization
- Configuration management
- Logging system integration

```
sample-project/
├── index.js                    # Entry point
├── src/
│   ├── calculator.js          # Main calculator class
│   ├── config.js              # Configuration management
│   └── utils/
│       ├── mathUtils.js       # Mathematical operations
│       ├── validator.js       # Input validation
│       └── logger.js          # Logging utilities
```

## 🔧 Configuration Options

```javascript
const options = {
    // Core settings
    rootPath: './project',
    outputDir: 'dist',
    entryPoints: ['src/index.js'],
    
    // Bundle settings
    bundleFormat: 'esm', // 'esm' | 'cjs' | 'iife' | 'umd'
    minify: false,
    sourceMaps: false,
    treeshake: true,
    bundleSplitting: false,
    
    // Discovery settings
    extensions: ['.js', '.mjs', '.ts', '.jsx', '.tsx'],
    maxDepth: 20,
    ignorePatterns: [/node_modules/, /\.git/, /dist/],
    
    // Output settings
    verbose: true
};
```

## 📈 Performance Considerations

### Optimization Strategies
- **Memoization**: Cache file reads and dependency resolutions
- **Lazy Loading**: Process files only when needed
- **Parallel Processing**: Concurrent file operations where safe
- **Memory Management**: Clear caches and release resources
- **Incremental Builds**: Track file changes for faster rebuilds

### Scalability Features
- **Depth Limiting**: Prevent infinite recursion
- **Memory Monitoring**: Track and limit memory usage
- **Progress Reporting**: Real-time build progress
- **Error Recovery**: Continue processing despite individual file errors
- **Chunked Processing**: Handle large projects in manageable pieces

## 🛡️ Error Handling

Comprehensive error handling throughout:
- **File System Errors**: Missing files, permission issues
- **Parse Errors**: Invalid JavaScript syntax
- **Circular Dependencies**: Detection and reporting
- **Memory Limits**: Graceful degradation
- **Network Issues**: Timeout and retry logic

## 🔍 Debugging and Diagnostics

Built-in debugging tools:
- **Verbose Logging**: Detailed operation logs
- **Dependency Chains**: Trace dependency paths
- **Performance Metrics**: Build time and resource usage
- **Graph Visualization**: Visual dependency analysis
- **Error Reports**: Comprehensive error information

## 🚀 Future Enhancements

Potential improvements:
- **TypeScript Support**: Enhanced TypeScript parsing
- **Plugin System**: Extensible architecture
- **Watch Mode**: Automatic rebuilds on file changes
- **Cache System**: Persistent build caching
- **Web Interface**: Browser-based project analysis
- **Integration**: Webpack/Rollup plugin compatibility

## 📚 Learning Resources

This project demonstrates:
- **Advanced JavaScript Patterns**: Recursion, graphs, async programming
- **Node.js APIs**: FileSystem, Path, Stream processing
- **Algorithm Implementation**: Graph algorithms, topological sorting
- **Software Architecture**: Modular design, separation of concerns
- **Performance Optimization**: Caching, lazy loading, memory management

## 🤝 Contributing

To extend this project:
1. Add new file type parsers in `DependencyDiscovery`
2. Implement additional graph algorithms in `DependencyGraph`
3. Create new bundle formats in `ModuleBundler`
4. Add utility functions to `FileSystemUtils` and `PathUtils`
5. Enhance the CLI with new commands

## 📄 License

MIT License - See LICENSE file for details.

---

**Built with ❤️ to demonstrate advanced JavaScript concepts and Node.js capabilities.**
