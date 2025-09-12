import { CustomModuleBuilder } from '../src/index.js';
import { PathUtils } from '../src/utils/PathUtils.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

/**
 * Demo script showcasing Custom Module Builder capabilities
 * Demonstrates FileSystem API, Path API, Recursion, and Dependency Graphs
 */
async function runDemo() {
    console.log('🎯 Custom Module Builder Demo');
    console.log('=====================================\n');

    try {
        // Create builder instance
        const builder = new CustomModuleBuilder({
            rootPath: projectRoot,
            outputDir: 'demo-output',
            bundleFormat: 'esm',
            treeshake: true,
            verbose: true
        });

        console.log('📊 Demo 1: Project Analysis');
        console.log('----------------------------');
        
        // Analyze project structure
        const stats = await builder.getProjectStats();
        console.log(`📁 Root: ${stats.rootPath}`);
        console.log(`📄 Total Files: ${stats.totalFiles}`);
        console.log(`📂 Directories: ${stats.directoryCount}`);
        console.log(`🏗️  Patterns: ${stats.patterns.join(', ') || 'None detected'}`);
        
        if (stats.fileTypes) {
            console.log('📋 File Types:');
            Object.entries(stats.fileTypes).forEach(([ext, count]) => {
                console.log(`   ${ext}: ${count} files`);
            });
        }

        console.log('\n🔍 Demo 2: File Analysis');
        console.log('-------------------------');
        
        // Analyze a specific file
        const mainFile = 'src/index.js';
        const fileAnalysis = await builder.analyzeFile(mainFile);
        console.log(`📄 File: ${fileAnalysis.relativePath}`);
        console.log(`🔗 Dependencies: ${fileAnalysis.dependencies.length}`);
        console.log(`📊 Chain Depth: ${fileAnalysis.dependencyChain.maxDepth}`);
        console.log(`🏗️  Total Modules: ${fileAnalysis.dependencyChain.totalNodes}`);

        console.log('\n📦 Demo 3: Module Building');
        console.log('---------------------------');
        
        // Build the project
        const buildResult = await builder.build({
            entryPoints: ['src/index.js'],
            outputDir: 'demo-output'
        });

        if (buildResult.success) {
            console.log('✅ Build successful!');
            console.log(`📁 Output: ${buildResult.outputDir}`);
            console.log(`⏱️  Duration: ${buildResult.duration}ms`);
            
            if (buildResult.bundles) {
                console.log('\n📦 Bundle Information:');
                buildResult.bundles.bundles.forEach(bundle => {
                    console.log(`   ${bundle.name}: ${bundle.sizeFormatted} (${bundle.moduleCount} modules)`);
                });
            }
        }

        console.log('\n🕸️  Demo 4: Dependency Graph Analysis');
        console.log('--------------------------------------');
        
        if (buildResult.graph) {
            const metrics = buildResult.graph.metrics;
            console.log(`🏗️  Nodes: ${metrics.nodeCount}`);
            console.log(`🔗 Edges: ${metrics.edgeCount}`);
            console.log(`📊 Density: ${(metrics.density * 100).toFixed(2)}%`);
            console.log(`🎯 Entry Points: ${buildResult.graph.entryPoints.length}`);
            console.log(`🍃 Leaf Nodes: ${buildResult.graph.leafNodes.length}`);
            
            if (buildResult.graph.circularDependencies.length > 0) {
                console.log(`🔄 Circular Dependencies: ${buildResult.graph.circularDependencies.length}`);
            }
        }

        console.log('\n🎉 Demo completed successfully!');
        console.log('\n💡 Key Concepts Demonstrated:');
        console.log('   ✅ FileSystem API - Recursive file operations');
        console.log('   ✅ Path API - Cross-platform path handling');
        console.log('   ✅ Recursion - Dependency traversal and discovery');
        console.log('   ✅ Dependency Graphs - Graph construction and analysis');

    } catch (error) {
        console.error('❌ Demo failed:', error.message);
        console.error(error.stack);
    }
}

// Run demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runDemo();
}

export { runDemo };
