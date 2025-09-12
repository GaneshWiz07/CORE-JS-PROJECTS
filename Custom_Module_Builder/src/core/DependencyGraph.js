import { PathUtils } from '../utils/PathUtils.js';

/**
 * Dependency Graph implementation with advanced analysis capabilities
 * Constructs and analyzes dependency relationships between modules
 */
export class DependencyGraph {
    constructor() {
        this.nodes = new Map(); // Map<string, Node>
        this.edges = new Map(); // Map<string, Set<string>>
        this.reverseEdges = new Map(); // Map<string, Set<string>>
        this.metadata = new Map(); // Map<string, Object>
        this.stats = {
            totalNodes: 0,
            totalEdges: 0,
            circularDependencies: [],
            orphanNodes: [],
            entryPoints: [],
            leafNodes: []
        };
    }

    /**
     * Add a node to the dependency graph
     * @param {string} id - Node identifier (file path)
     * @param {Object} data - Node data
     */
    addNode(id, data = {}) {
        if (!this.nodes.has(id)) {
            this.nodes.set(id, {
                id,
                ...data,
                dependencies: new Set(),
                dependents: new Set()
            });
            this.edges.set(id, new Set());
            this.reverseEdges.set(id, new Set());
            this.stats.totalNodes++;
        } else {
            // Update existing node data
            const existingNode = this.nodes.get(id);
            this.nodes.set(id, { ...existingNode, ...data });
        }
    }

    /**
     * Add an edge (dependency relationship) between two nodes
     * @param {string} from - Source node (dependent)
     * @param {string} to - Target node (dependency)
     * @param {Object} edgeData - Edge metadata
     */
    addEdge(from, to, edgeData = {}) {
        // Ensure both nodes exist
        if (!this.nodes.has(from)) {
            this.addNode(from);
        }
        if (!this.nodes.has(to)) {
            this.addNode(to);
        }

        // Add edge if it doesn't exist
        if (!this.edges.get(from).has(to)) {
            this.edges.get(from).add(to);
            this.reverseEdges.get(to).add(from);
            
            // Update node relationships
            this.nodes.get(from).dependencies.add(to);
            this.nodes.get(to).dependents.add(from);
            
            this.stats.totalEdges++;
        }

        // Store edge metadata
        const edgeKey = `${from}->${to}`;
        this.metadata.set(edgeKey, edgeData);
    }

    /**
     * Build graph from dependency discovery results
     * @param {Object} discoveryResult - Result from DependencyDiscovery
     */
    buildFromDiscovery(discoveryResult) {
        console.log('🏗️  Building dependency graph...');
        
        const { dependencies, rootPath } = discoveryResult;
        
        // Add all files as nodes first
        for (const [filePath, fileData] of Object.entries(dependencies)) {
            this.addNode(filePath, {
                relativePath: fileData.relativePath,
                stats: fileData.stats,
                depth: fileData.depth,
                lastModified: fileData.lastModified
            });
        }

        // Add edges for dependencies
        for (const [filePath, fileData] of Object.entries(dependencies)) {
            for (const dep of fileData.dependencies) {
                if (dep.resolved && dep.exists && dep.type === 'local') {
                    this.addEdge(filePath, dep.resolved, {
                        importPath: dep.original,
                        type: dep.type,
                        line: dep.line
                    });
                }
            }
        }

        this.analyzeGraph();
        console.log(`✅ Graph built: ${this.stats.totalNodes} nodes, ${this.stats.totalEdges} edges`);
    }

    /**
     * Perform comprehensive graph analysis
     */
    analyzeGraph() {
        this.stats.circularDependencies = this.findCircularDependencies();
        this.stats.orphanNodes = this.findOrphanNodes();
        this.stats.entryPoints = this.findEntryPoints();
        this.stats.leafNodes = this.findLeafNodes();
    }

    /**
     * Find circular dependencies using DFS
     * @returns {Array} Array of circular dependency cycles
     */
    findCircularDependencies() {
        const visited = new Set();
        const recursionStack = new Set();
        const cycles = [];

        const dfs = (node, path = []) => {
            if (recursionStack.has(node)) {
                // Found a cycle
                const cycleStart = path.indexOf(node);
                const cycle = path.slice(cycleStart).concat([node]);
                cycles.push(cycle);
                return;
            }

            if (visited.has(node)) {
                return;
            }

            visited.add(node);
            recursionStack.add(node);
            path.push(node);

            const dependencies = this.edges.get(node) || new Set();
            for (const dep of dependencies) {
                dfs(dep, [...path]);
            }

            recursionStack.delete(node);
        };

        for (const node of this.nodes.keys()) {
            if (!visited.has(node)) {
                dfs(node);
            }
        }

        return cycles;
    }

    /**
     * Find orphan nodes (no dependencies and no dependents)
     * @returns {Array} Array of orphan node IDs
     */
    findOrphanNodes() {
        const orphans = [];
        
        for (const [nodeId, node] of this.nodes) {
            if (node.dependencies.size === 0 && node.dependents.size === 0) {
                orphans.push(nodeId);
            }
        }
        
        return orphans;
    }

    /**
     * Find entry points (nodes with no dependents)
     * @returns {Array} Array of entry point node IDs
     */
    findEntryPoints() {
        const entryPoints = [];
        
        for (const [nodeId, node] of this.nodes) {
            if (node.dependents.size === 0 && node.dependencies.size > 0) {
                entryPoints.push(nodeId);
            }
        }
        
        return entryPoints;
    }

    /**
     * Find leaf nodes (nodes with no dependencies)
     * @returns {Array} Array of leaf node IDs
     */
    findLeafNodes() {
        const leafNodes = [];
        
        for (const [nodeId, node] of this.nodes) {
            if (node.dependencies.size === 0 && node.dependents.size > 0) {
                leafNodes.push(nodeId);
            }
        }
        
        return leafNodes;
    }

    /**
     * Get topological sort of the graph
     * @returns {Array} Topologically sorted node IDs
     */
    getTopologicalSort() {
        const inDegree = new Map();
        const queue = [];
        const result = [];

        // Initialize in-degree count
        for (const nodeId of this.nodes.keys()) {
            inDegree.set(nodeId, this.reverseEdges.get(nodeId).size);
            if (inDegree.get(nodeId) === 0) {
                queue.push(nodeId);
            }
        }

        // Process nodes with no incoming edges
        while (queue.length > 0) {
            const current = queue.shift();
            result.push(current);

            // Reduce in-degree of dependent nodes
            const dependencies = this.edges.get(current);
            for (const dep of dependencies) {
                inDegree.set(dep, inDegree.get(dep) - 1);
                if (inDegree.get(dep) === 0) {
                    queue.push(dep);
                }
            }
        }

        // If result doesn't include all nodes, there are cycles
        if (result.length !== this.nodes.size) {
            throw new Error('Cannot perform topological sort: graph contains cycles');
        }

        return result;
    }

    /**
     * Get dependency chain for a specific node
     * @param {string} nodeId - Node to analyze
     * @param {number} maxDepth - Maximum depth to traverse
     * @returns {Object} Dependency chain information
     */
    getDependencyChain(nodeId, maxDepth = 10) {
        if (!this.nodes.has(nodeId)) {
            throw new Error(`Node ${nodeId} not found in graph`);
        }

        const visited = new Set();
        const chain = [];

        const traverse = (currentId, depth = 0) => {
            if (depth >= maxDepth || visited.has(currentId)) {
                return;
            }

            visited.add(currentId);
            const node = this.nodes.get(currentId);
            
            chain.push({
                id: currentId,
                relativePath: node.relativePath,
                depth,
                dependencies: Array.from(node.dependencies),
                dependents: Array.from(node.dependents)
            });

            // Recursively traverse dependencies
            for (const depId of node.dependencies) {
                traverse(depId, depth + 1);
            }
        };

        traverse(nodeId);
        return {
            rootNode: nodeId,
            chain,
            totalNodes: chain.length,
            maxDepth: Math.max(...chain.map(n => n.depth))
        };
    }

    /**
     * Find shortest path between two nodes
     * @param {string} from - Source node
     * @param {string} to - Target node
     * @returns {Array|null} Shortest path or null if no path exists
     */
    findShortestPath(from, to) {
        if (!this.nodes.has(from) || !this.nodes.has(to)) {
            return null;
        }

        const queue = [[from]];
        const visited = new Set([from]);

        while (queue.length > 0) {
            const path = queue.shift();
            const current = path[path.length - 1];

            if (current === to) {
                return path;
            }

            const dependencies = this.edges.get(current);
            for (const dep of dependencies) {
                if (!visited.has(dep)) {
                    visited.add(dep);
                    queue.push([...path, dep]);
                }
            }
        }

        return null; // No path found
    }

    /**
     * Get strongly connected components (SCCs)
     * @returns {Array} Array of strongly connected components
     */
    getStronglyConnectedComponents() {
        const visited = new Set();
        const stack = [];
        const sccs = [];

        // First DFS to fill stack
        const dfs1 = (node) => {
            visited.add(node);
            const dependencies = this.edges.get(node);
            for (const dep of dependencies) {
                if (!visited.has(dep)) {
                    dfs1(dep);
                }
            }
            stack.push(node);
        };

        // Fill stack with finish times
        for (const node of this.nodes.keys()) {
            if (!visited.has(node)) {
                dfs1(node);
            }
        }

        // Second DFS on transpose graph
        visited.clear();
        const dfs2 = (node, component) => {
            visited.add(node);
            component.push(node);
            const dependents = this.reverseEdges.get(node);
            for (const dep of dependents) {
                if (!visited.has(dep)) {
                    dfs2(dep, component);
                }
            }
        };

        // Process nodes in reverse finish time order
        while (stack.length > 0) {
            const node = stack.pop();
            if (!visited.has(node)) {
                const component = [];
                dfs2(node, component);
                sccs.push(component);
            }
        }

        return sccs;
    }

    /**
     * Calculate graph metrics
     * @returns {Object} Graph metrics
     */
    calculateMetrics() {
        const metrics = {
            nodeCount: this.nodes.size,
            edgeCount: this.stats.totalEdges,
            density: this.stats.totalEdges / (this.nodes.size * (this.nodes.size - 1)),
            averageDegree: (this.stats.totalEdges * 2) / this.nodes.size,
            circularDependencyCount: this.stats.circularDependencies.length,
            entryPointCount: this.stats.entryPoints.length,
            leafNodeCount: this.stats.leafNodes.length,
            orphanNodeCount: this.stats.orphanNodes.length
        };

        // Calculate degree distribution
        const inDegrees = [];
        const outDegrees = [];
        
        for (const node of this.nodes.values()) {
            inDegrees.push(node.dependents.size);
            outDegrees.push(node.dependencies.size);
        }

        metrics.inDegree = {
            min: Math.min(...inDegrees),
            max: Math.max(...inDegrees),
            average: inDegrees.reduce((a, b) => a + b, 0) / inDegrees.length
        };

        metrics.outDegree = {
            min: Math.min(...outDegrees),
            max: Math.max(...outDegrees),
            average: outDegrees.reduce((a, b) => a + b, 0) / outDegrees.length
        };

        return metrics;
    }

    /**
     * Export graph in various formats
     * @param {string} format - Export format ('json', 'dot', 'mermaid')
     * @param {Object} options - Export options
     * @returns {string} Exported graph representation
     */
    export(format = 'json', options = {}) {
        switch (format.toLowerCase()) {
            case 'json':
                return this.exportJSON(options);
            case 'dot':
                return this.exportDOT(options);
            case 'mermaid':
                return this.exportMermaid(options);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * Export graph as JSON
     * @param {Object} options - Export options
     * @returns {string} JSON representation
     */
    exportJSON(options = {}) {
        const { includeMetadata = true, rootPath = '' } = options;
        
        const nodes = Array.from(this.nodes.entries()).map(([id, node]) => ({
            id,
            relativePath: rootPath ? PathUtils.relative(rootPath, id) : id,
            dependencies: Array.from(node.dependencies),
            dependents: Array.from(node.dependents),
            ...(includeMetadata && node.stats ? { stats: node.stats } : {})
        }));

        const edges = [];
        for (const [from, targets] of this.edges) {
            for (const to of targets) {
                const edgeKey = `${from}->${to}`;
                edges.push({
                    from,
                    to,
                    ...(includeMetadata && this.metadata.has(edgeKey) ? this.metadata.get(edgeKey) : {})
                });
            }
        }

        return JSON.stringify({
            nodes,
            edges,
            stats: this.stats,
            metrics: this.calculateMetrics()
        }, null, 2);
    }

    /**
     * Export graph in DOT format (for Graphviz)
     * @param {Object} options - Export options
     * @returns {string} DOT representation
     */
    exportDOT(options = {}) {
        const { rootPath = '', maxLabelLength = 30 } = options;
        let dot = 'digraph DependencyGraph {\n';
        dot += '  rankdir=TB;\n';
        dot += '  node [shape=box, style=rounded];\n\n';

        // Add nodes
        for (const [id, node] of this.nodes) {
            const label = rootPath ? 
                PathUtils.relative(rootPath, id) : 
                PathUtils.basename(id);
            
            const shortLabel = label.length > maxLabelLength ? 
                '...' + label.slice(-maxLabelLength) : 
                label;
                
            dot += `  "${id}" [label="${shortLabel}"];\n`;
        }

        dot += '\n';

        // Add edges
        for (const [from, targets] of this.edges) {
            for (const to of targets) {
                dot += `  "${from}" -> "${to}";\n`;
            }
        }

        dot += '}\n';
        return dot;
    }

    /**
     * Export graph in Mermaid format
     * @param {Object} options - Export options
     * @returns {string} Mermaid representation
     */
    exportMermaid(options = {}) {
        const { rootPath = '', maxLabelLength = 20 } = options;
        let mermaid = 'graph TD\n';

        // Create node ID mapping for Mermaid compatibility
        const nodeIds = new Map();
        let counter = 0;
        
        for (const id of this.nodes.keys()) {
            nodeIds.set(id, `N${counter++}`);
        }

        // Add nodes with labels
        for (const [id, node] of this.nodes) {
            const label = rootPath ? 
                PathUtils.relative(rootPath, id) : 
                PathUtils.basename(id);
                
            const shortLabel = label.length > maxLabelLength ? 
                '...' + label.slice(-maxLabelLength) : 
                label;
                
            mermaid += `  ${nodeIds.get(id)}["${shortLabel}"]\n`;
        }

        // Add edges
        for (const [from, targets] of this.edges) {
            for (const to of targets) {
                mermaid += `  ${nodeIds.get(from)} --> ${nodeIds.get(to)}\n`;
            }
        }

        return mermaid;
    }

    /**
     * Get graph statistics
     * @returns {Object} Current graph statistics
     */
    getStats() {
        return {
            ...this.stats,
            metrics: this.calculateMetrics()
        };
    }

    /**
     * Clear the graph
     */
    clear() {
        this.nodes.clear();
        this.edges.clear();
        this.reverseEdges.clear();
        this.metadata.clear();
        this.stats = {
            totalNodes: 0,
            totalEdges: 0,
            circularDependencies: [],
            orphanNodes: [],
            entryPoints: [],
            leafNodes: []
        };
    }
}
