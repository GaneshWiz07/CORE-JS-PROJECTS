/* 
========================================
EVENT LOOP VIRTUALIZER JAVASCRIPT
========================================

This JavaScript file demonstrates:
1. Event Loop Simulation with visual feedback
2. Call Stack management and visualization
3. Task Queue (Macrotask) handling
4. Microtask Queue management
5. Web API simulation
6. Concurrency model explanation through code
7. Interactive examples with step-by-step execution
8. Performance insights and best practices

LEARNING OBJECTIVES:
- Understand JavaScript's single-threaded nature
- Master the event loop execution order
- Learn about microtasks vs macrotasks
- Visualize async operation flow
- Practice identifying execution patterns
*/

// ========================================
// 1. EVENT LOOP SIMULATOR CLASS
// ========================================

class EventLoopSimulator {
    constructor() {
        // Core components
        this.callStack = [];
        this.microtaskQueue = [];
        this.macrotaskQueue = [];
        this.webApis = new Map();
        this.executionLog = [];
        
        // State management
        this.isRunning = false;
        this.isPaused = false;
        this.stepMode = false;
        this.currentStep = 0;
        this.executionSpeed = 1000; // milliseconds
        
        // DOM elements
        this.elements = {};
        
        // Bind methods
        this.tick = this.tick.bind(this);
        this.step = this.step.bind(this);
        
        console.log('🔄 Event Loop Simulator initialized');
    }

    /**
     * INITIALIZE - Set up DOM elements and event listeners
     */
    initialize() {
        this.getElements();
        this.setupEventListeners();
        this.updateUI();
        console.log('✅ Event Loop Simulator ready');
    }

    /**
     * GET DOM ELEMENTS
     */
    getElements() {
        this.elements = {
            // Controls
            startDemo: document.getElementById('startDemo'),
            stepDemo: document.getElementById('stepDemo'),
            resetDemo: document.getElementById('resetDemo'),
            pauseDemo: document.getElementById('pauseDemo'),
            
            // Visualization areas
            callStack: document.getElementById('callStack'),
            microtaskQueue: document.getElementById('microtaskQueue'),
            taskQueue: document.getElementById('taskQueue'),
            webApis: document.getElementById('webApis'),
            
            // Web API categories
            timerItems: document.getElementById('timerItems'),
            networkItems: document.getElementById('networkItems'),
            domItems: document.getElementById('domItems'),
            
            // Counters
            stackCount: document.getElementById('stackCount'),
            microtaskCount: document.getElementById('microtaskCount'),
            taskCount: document.getElementById('taskCount'),
            
            // Execution log
            executionLog: document.getElementById('executionLog'),
            clearLog: document.getElementById('clearLog'),
            
            // Help panel
            helpPanel: document.getElementById('helpPanel'),
            helpToggle: document.getElementById('helpToggle')
        };
    }

    /**
     * SETUP EVENT LISTENERS
     */
    setupEventListeners() {
        // Control buttons
        this.elements.startDemo.addEventListener('click', () => this.startDemo());
        this.elements.stepDemo.addEventListener('click', () => this.stepDemo());
        this.elements.resetDemo.addEventListener('click', () => this.resetDemo());
        this.elements.pauseDemo.addEventListener('click', () => this.pauseDemo());
        
        // Clear log
        this.elements.clearLog.addEventListener('click', () => this.clearLog());
        
        // Help panel toggle
        this.elements.helpToggle.addEventListener('click', () => this.toggleHelp());
        
        // Code example buttons
        document.querySelectorAll('.run-example').forEach(button => {
            button.addEventListener('click', (e) => {
                const example = e.target.closest('.code-example').dataset.example;
                this.runExample(example);
            });
        });
        
        // Quiz functionality
        this.setupQuiz();
    }

    /**
     * START DEMO - Begin automatic execution
     */
    startDemo() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.stepMode = false;
        this.elements.startDemo.textContent = '⏸️ Running...';
        this.elements.startDemo.classList.add('loading');
        
        this.log('🚀 Event Loop Demo Started', 'system');
        this.tick();
    }

    /**
     * STEP DEMO - Execute one step at a time
     */
    stepDemo() {
        this.stepMode = true;
        this.step();
    }

    /**
     * PAUSE DEMO
     */
    pauseDemo() {
        this.isRunning = false;
        this.isPaused = true;
        this.elements.startDemo.textContent = '▶️ Start Demo';
        this.elements.startDemo.classList.remove('loading');
        this.log('⏸️ Demo Paused', 'system');
    }

    /**
     * RESET DEMO
     */
    resetDemo() {
        this.isRunning = false;
        this.isPaused = false;
        this.stepMode = false;
        this.currentStep = 0;
        
        // Clear all queues and stacks
        this.callStack = [];
        this.microtaskQueue = [];
        this.macrotaskQueue = [];
        this.webApis.clear();
        this.executionLog = [];
        
        // Reset UI
        this.elements.startDemo.textContent = '▶️ Start Demo';
        this.elements.startDemo.classList.remove('loading');
        this.updateUI();
        
        this.log('🔄 Demo Reset', 'system');
    }

    /**
     * MAIN EVENT LOOP TICK
     * This simulates the actual JavaScript event loop
     */
    tick() {
        if (!this.isRunning || this.isPaused) return;
        
        this.step();
        
        // Continue ticking if running
        if (this.isRunning) {
            setTimeout(this.tick, this.executionSpeed);
        }
    }

    /**
     * EXECUTE ONE STEP of the event loop
     */
    step() {
        this.log(`📍 Event Loop Step ${++this.currentStep}`, 'system');
        
        // 1. Execute all functions in call stack (synchronous code)
        if (this.callStack.length > 0) {
            this.executeCallStack();
            this.updateUI();
            return;
        }
        
        // 2. Execute all microtasks (Promises, queueMicrotask)
        if (this.microtaskQueue.length > 0) {
            this.executeMicrotask();
            this.updateUI();
            return;
        }
        
        // 3. Execute one macrotask (setTimeout, setInterval, I/O)
        if (this.macrotaskQueue.length > 0) {
            this.executeMacrotask();
            this.updateUI();
            return;
        }
        
        // 4. Check Web APIs for completed operations
        this.checkWebApis();
        this.updateUI();
        
        // If nothing to execute, demo is complete
        if (this.callStack.length === 0 && 
            this.microtaskQueue.length === 0 && 
            this.macrotaskQueue.length === 0 && 
            this.webApis.size === 0) {
            this.log('✅ Event Loop Complete - All tasks executed', 'system');
            if (!this.stepMode) {
                this.pauseDemo();
            }
        }
    }

    /**
     * EXECUTE CALL STACK (Synchronous operations)
     */
    executeCallStack() {
        if (this.callStack.length === 0) return;
        
        const currentFunction = this.callStack[this.callStack.length - 1];
        this.log(`🔄 Executing: ${currentFunction.name}`, 'sync');
        
        // Simulate function execution
        setTimeout(() => {
            // Execute the function
            if (currentFunction.execute) {
                currentFunction.execute();
            }
            
            // Remove from stack
            this.callStack.pop();
            this.log(`✅ Completed: ${currentFunction.name}`, 'sync');
            this.updateUI();
        }, 300);
    }

    /**
     * EXECUTE MICROTASK (High priority async)
     */
    executeMicrotask() {
        if (this.microtaskQueue.length === 0) return;
        
        const microtask = this.microtaskQueue.shift();
        this.log(`⚡ Executing Microtask: ${microtask.name}`, 'microtask');
        
        // Execute microtask
        if (microtask.execute) {
            microtask.execute();
        }
        
        this.log(`✅ Microtask Complete: ${microtask.name}`, 'microtask');
    }

    /**
     * EXECUTE MACROTASK (Normal priority async)
     */
    executeMacrotask() {
        if (this.macrotaskQueue.length === 0) return;
        
        const macrotask = this.macrotaskQueue.shift();
        this.log(`📋 Executing Macrotask: ${macrotask.name}`, 'macrotask');
        
        // Execute macrotask
        if (macrotask.execute) {
            macrotask.execute();
        }
        
        this.log(`✅ Macrotask Complete: ${macrotask.name}`, 'macrotask');
    }

    /**
     * CHECK WEB APIS for completed operations
     */
    checkWebApis() {
        const completedApis = [];
        
        for (let [id, api] of this.webApis) {
            if (Date.now() >= api.completeTime) {
                completedApis.push({id, api});
            }
        }
        
        completedApis.forEach(({id, api}) => {
            this.log(`🌐 Web API Complete: ${api.name}`, 'webapi');
            
            // Move callback to appropriate queue
            if (api.type === 'microtask') {
                this.microtaskQueue.push({
                    name: api.callback,
                    execute: api.executeCallback
                });
            } else {
                this.macrotaskQueue.push({
                    name: api.callback,
                    execute: api.executeCallback
                });
            }
            
            this.webApis.delete(id);
        });
    }

    /**
     * ADD FUNCTION TO CALL STACK
     */
    addToCallStack(functionName, executeCallback) {
        const func = {
            name: functionName,
            execute: executeCallback,
            timestamp: Date.now()
        };
        
        this.callStack.push(func);
        this.log(`📚 Added to Call Stack: ${functionName}`, 'sync');
        this.updateUI();
    }

    /**
     * ADD MICROTASK TO QUEUE
     */
    addMicrotask(taskName, executeCallback) {
        const task = {
            name: taskName,
            execute: executeCallback,
            timestamp: Date.now()
        };
        
        this.microtaskQueue.push(task);
        this.log(`⚡ Added Microtask: ${taskName}`, 'microtask');
        this.updateUI();
    }

    /**
     * ADD MACROTASK TO QUEUE
     */
    addMacrotask(taskName, executeCallback) {
        const task = {
            name: taskName,
            execute: executeCallback,
            timestamp: Date.now()
        };
        
        this.macrotaskQueue.push(task);
        this.log(`📋 Added Macrotask: ${taskName}`, 'macrotask');
        this.updateUI();
    }

    /**
     * ADD WEB API OPERATION
     */
    addWebApi(apiName, type, delay, callbackName, executeCallback) {
        const id = Date.now() + Math.random();
        const api = {
            name: apiName,
            type: type, // 'microtask' or 'macrotask'
            callback: callbackName,
            executeCallback: executeCallback,
            startTime: Date.now(),
            completeTime: Date.now() + delay
        };
        
        this.webApis.set(id, api);
        this.log(`🌐 Web API Started: ${apiName} (${delay}ms)`, 'webapi');
        this.updateUI();
    }

    /**
     * UPDATE UI - Refresh all visual components
     */
    updateUI() {
        this.updateCallStack();
        this.updateMicrotaskQueue();
        this.updateMacrotaskQueue();
        this.updateWebApis();
        this.updateCounters();
    }

    /**
     * UPDATE CALL STACK VISUALIZATION
     */
    updateCallStack() {
        // Clear existing stack frames (except bottom)
        const stackFrames = this.elements.callStack.querySelectorAll('.stack-frame');
        stackFrames.forEach(frame => frame.remove());
        
        // Add current stack frames
        this.callStack.forEach((func, index) => {
            const frame = document.createElement('div');
            frame.className = 'stack-frame';
            if (index === this.callStack.length - 1) {
                frame.classList.add('executing');
            }
            frame.textContent = func.name;
            
            // Insert before the stack bottom
            const stackBottom = this.elements.callStack.querySelector('.stack-bottom');
            this.elements.callStack.insertBefore(frame, stackBottom);
        });
    }

    /**
     * UPDATE MICROTASK QUEUE VISUALIZATION
     */
    updateMicrotaskQueue() {
        this.elements.microtaskQueue.innerHTML = '<div class="queue-label">High Priority</div>';
        
        this.microtaskQueue.forEach(task => {
            const item = document.createElement('div');
            item.className = 'queue-item microtask';
            item.textContent = task.name;
            this.elements.microtaskQueue.appendChild(item);
        });
    }

    /**
     * UPDATE MACROTASK QUEUE VISUALIZATION
     */
    updateMacrotaskQueue() {
        this.elements.taskQueue.innerHTML = '<div class="queue-label">Normal Priority</div>';
        
        this.macrotaskQueue.forEach(task => {
            const item = document.createElement('div');
            item.className = 'queue-item macrotask';
            item.textContent = task.name;
            this.elements.taskQueue.appendChild(item);
        });
    }

    /**
     * UPDATE WEB APIS VISUALIZATION
     */
    updateWebApis() {
        // Clear existing items
        this.elements.timerItems.innerHTML = '';
        this.elements.networkItems.innerHTML = '';
        this.elements.domItems.innerHTML = '';
        
        for (let [id, api] of this.webApis) {
            const item = document.createElement('div');
            item.className = 'api-item processing';
            item.textContent = api.name;
            
            // Add to appropriate category
            if (api.name.includes('Timer') || api.name.includes('setTimeout')) {
                item.classList.add('timer');
                this.elements.timerItems.appendChild(item);
            } else if (api.name.includes('fetch') || api.name.includes('Network')) {
                item.classList.add('network');
                this.elements.networkItems.appendChild(item);
            } else {
                item.classList.add('dom');
                this.elements.domItems.appendChild(item);
            }
        }
    }

    /**
     * UPDATE COUNTERS
     */
    updateCounters() {
        this.elements.stackCount.textContent = this.callStack.length;
        this.elements.microtaskCount.textContent = this.microtaskQueue.length;
        this.elements.taskCount.textContent = this.macrotaskQueue.length;
    }

    /**
     * LOG EXECUTION EVENTS
     */
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            message,
            type,
            timestamp,
            step: this.currentStep
        };
        
        this.executionLog.push(logEntry);
        
        // Update log display
        this.updateLogDisplay();
        
        // Console log for debugging
        console.log(`[${timestamp}] ${message}`);
    }

    /**
     * UPDATE LOG DISPLAY
     */
    updateLogDisplay() {
        // Clear placeholder
        const placeholder = this.elements.executionLog.querySelector('.log-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        // Add recent log entries (last 20)
        const recentLogs = this.executionLog.slice(-20);
        this.elements.executionLog.innerHTML = '';
        
        recentLogs.forEach(entry => {
            const logDiv = document.createElement('div');
            logDiv.className = `log-entry ${entry.type}`;
            logDiv.textContent = `[${entry.timestamp}] Step ${entry.step}: ${entry.message}`;
            this.elements.executionLog.appendChild(logDiv);
        });
        
        // Scroll to bottom
        this.elements.executionLog.scrollTop = this.elements.executionLog.scrollHeight;
    }

    /**
     * CLEAR LOG
     */
    clearLog() {
        this.executionLog = [];
        this.elements.executionLog.innerHTML = '<div class="log-placeholder">Run an example to see the execution order...</div>';
    }

    /**
     * TOGGLE HELP PANEL
     */
    toggleHelp() {
        this.elements.helpPanel.classList.toggle('collapsed');
    }

    /**
     * RUN CODE EXAMPLE
     */
    runExample(exampleType) {
        this.resetDemo();
        
        // Highlight running example
        document.querySelectorAll('.code-example').forEach(ex => ex.classList.remove('running'));
        document.querySelector(`[data-example="${exampleType}"]`).classList.add('running');
        
        this.log(`🎯 Running Example: ${exampleType}`, 'system');
        
        switch (exampleType) {
            case 'sync':
                this.runSyncExample();
                break;
            case 'setTimeout':
                this.runSetTimeoutExample();
                break;
            case 'promise':
                this.runPromiseExample();
                break;
            case 'mixed':
                this.runMixedExample();
                break;
            case 'complex':
                this.runComplexExample();
                break;
            case 'fetch':
                this.runFetchExample();
                break;
        }
        
        // Auto-start demo after a short delay
        setTimeout(() => {
            this.startDemo();
        }, 1000);
    }

    /**
     * SYNCHRONOUS EXAMPLE
     */
    runSyncExample() {
        this.addToCallStack('console.log("Start")', () => {
            this.log('Output: "Start"', 'output');
        });
        
        this.addToCallStack('first()', () => {
            this.addToCallStack('console.log("First")', () => {
                this.log('Output: "First"', 'output');
            });
        });
        
        this.addToCallStack('second()', () => {
            this.addToCallStack('console.log("Second")', () => {
                this.log('Output: "Second"', 'output');
            });
        });
        
        this.addToCallStack('console.log("End")', () => {
            this.log('Output: "End"', 'output');
        });
    }

    /**
     * SETTIMEOUT EXAMPLE
     */
    runSetTimeoutExample() {
        this.addToCallStack('console.log("Start")', () => {
            this.log('Output: "Start"', 'output');
        });
        
        this.addToCallStack('setTimeout(..., 0)', () => {
            this.addWebApi('Timer API', 'macrotask', 0, 'timeout callback 1', () => {
                this.log('Output: "Timeout 1"', 'output');
            });
        });
        
        this.addToCallStack('setTimeout(..., 0)', () => {
            this.addWebApi('Timer API', 'macrotask', 0, 'timeout callback 2', () => {
                this.log('Output: "Timeout 2"', 'output');
            });
        });
        
        this.addToCallStack('console.log("End")', () => {
            this.log('Output: "End"', 'output');
        });
    }

    /**
     * PROMISE EXAMPLE
     */
    runPromiseExample() {
        this.addToCallStack('console.log("Start")', () => {
            this.log('Output: "Start"', 'output');
        });
        
        this.addToCallStack('Promise.resolve().then(...)', () => {
            this.addMicrotask('Promise callback 1', () => {
                this.log('Output: "Promise 1"', 'output');
            });
        });
        
        this.addToCallStack('Promise.resolve().then(...)', () => {
            this.addMicrotask('Promise callback 2', () => {
                this.log('Output: "Promise 2"', 'output');
            });
        });
        
        this.addToCallStack('console.log("End")', () => {
            this.log('Output: "End"', 'output');
        });
    }

    /**
     * MIXED ASYNC EXAMPLE
     */
    runMixedExample() {
        this.addToCallStack('console.log("Start")', () => {
            this.log('Output: "Start"', 'output');
        });
        
        this.addToCallStack('setTimeout(..., 0)', () => {
            this.addWebApi('Timer API', 'macrotask', 0, 'timeout callback', () => {
                this.log('Output: "Timeout"', 'output');
            });
        });
        
        this.addToCallStack('Promise.resolve().then(...)', () => {
            this.addMicrotask('Promise callback', () => {
                this.log('Output: "Promise"', 'output');
            });
        });
        
        this.addToCallStack('console.log("End")', () => {
            this.log('Output: "End"', 'output');
        });
    }

    /**
     * COMPLEX NESTED EXAMPLE
     */
    runComplexExample() {
        this.addToCallStack('console.log("Start")', () => {
            this.log('Output: "Start"', 'output');
        });
        
        this.addToCallStack('setTimeout(...)', () => {
            this.addWebApi('Timer API', 'macrotask', 0, 'timeout 1 callback', () => {
                this.log('Output: "Timeout 1"', 'output');
                // Add nested promise
                this.addMicrotask('Nested Promise in Timeout', () => {
                    this.log('Output: "Promise in Timeout"', 'output');
                });
            });
        });
        
        this.addToCallStack('Promise.resolve().then(...)', () => {
            this.addMicrotask('Promise 1 callback', () => {
                this.log('Output: "Promise 1"', 'output');
                // Add nested timeout
                this.addWebApi('Nested Timer', 'macrotask', 0, 'timeout in promise', () => {
                    this.log('Output: "Timeout in Promise"', 'output');
                });
            });
        });
        
        this.addToCallStack('console.log("End")', () => {
            this.log('Output: "End"', 'output');
        });
    }

    /**
     * FETCH EXAMPLE
     */
    runFetchExample() {
        this.addToCallStack('console.log("Start")', () => {
            this.log('Output: "Start"', 'output');
        });
        
        this.addToCallStack('fetch("/api/data")', () => {
            this.addWebApi('Network Request', 'microtask', 1500, 'fetch response', () => {
                this.addMicrotask('response.json()', () => {
                    this.addMicrotask('data callback', () => {
                        this.log('Output: "Data received"', 'output');
                    });
                });
            });
        });
        
        this.addToCallStack('console.log("Request sent")', () => {
            this.log('Output: "Request sent"', 'output');
        });
        
        this.addToCallStack('console.log("End")', () => {
            this.log('Output: "End"', 'output');
        });
    }

    /**
     * SETUP QUIZ FUNCTIONALITY
     */
    setupQuiz() {
        const quizOptions = document.querySelectorAll('.quiz-option');
        quizOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                // Disable all options
                quizOptions.forEach(opt => opt.disabled = true);
                
                const isCorrect = e.target.dataset.answer === 'correct';
                
                if (isCorrect) {
                    e.target.classList.add('correct');
                    document.querySelector('.quiz-explanation').style.display = 'block';
                } else {
                    e.target.classList.add('wrong');
                    // Show correct answer
                    document.querySelector('[data-answer="correct"]').classList.add('correct');
                }
                
                setTimeout(() => {
                    document.getElementById('nextQuestion').style.display = 'inline-block';
                }, 1000);
            });
        });
    }
}

// ========================================
// 2. INITIALIZE APPLICATION
// ========================================

let eventLoopSimulator;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Event Loop Virtualizer Loading...');
    
    // Initialize the simulator
    eventLoopSimulator = new EventLoopSimulator();
    eventLoopSimulator.initialize();
    
    // Add sample demonstration
    setTimeout(() => {
        eventLoopSimulator.log('💡 Click "Run Example" on any code example to see it visualized!', 'system');
        eventLoopSimulator.log('📚 Use "Step Through" for detailed step-by-step analysis', 'system');
    }, 1000);
    
    console.log('✅ Event Loop Virtualizer Ready!');
});

// ========================================
// 3. ADDITIONAL LEARNING UTILITIES
// ========================================

/**
 * PERFORMANCE MONITORING UTILITY
 * Demonstrates how to measure event loop performance
 */
class PerformanceMonitor {
    constructor() {
        this.measurements = [];
        this.isMonitoring = false;
    }
    
    startMonitoring() {
        this.isMonitoring = true;
        this.measureEventLoopLag();
    }
    
    measureEventLoopLag() {
        if (!this.isMonitoring) return;
        
        const start = performance.now();
        
        setTimeout(() => {
            const lag = performance.now() - start;
            this.measurements.push(lag);
            
            // Keep only last 100 measurements
            if (this.measurements.length > 100) {
                this.measurements.shift();
            }
            
            this.measureEventLoopLag();
        }, 0);
    }
    
    getAverageLag() {
        if (this.measurements.length === 0) return 0;
        const sum = this.measurements.reduce((a, b) => a + b, 0);
        return sum / this.measurements.length;
    }
    
    stopMonitoring() {
        this.isMonitoring = false;
    }
}

/**
 * CONCURRENCY PATTERN EXAMPLES
 * Real-world examples of JavaScript concurrency patterns
 */
const ConcurrencyExamples = {
    
    /**
     * ASYNC/AWAIT PATTERN
     */
    async asyncAwaitExample() {
        console.log('🔄 Async/Await Example');
        
        try {
            console.log('Start async function');
            
            const result1 = await new Promise(resolve => {
                setTimeout(() => resolve('First result'), 1000);
            });
            console.log('Got:', result1);
            
            const result2 = await new Promise(resolve => {
                setTimeout(() => resolve('Second result'), 1000);
            });
            console.log('Got:', result2);
            
            console.log('Async function complete');
        } catch (error) {
            console.error('Error:', error);
        }
    },
    
    /**
     * PARALLEL EXECUTION WITH PROMISE.ALL
     */
    async parallelExample() {
        console.log('⚡ Parallel Execution Example');
        
        const promises = [
            new Promise(resolve => setTimeout(() => resolve('Task 1'), 1000)),
            new Promise(resolve => setTimeout(() => resolve('Task 2'), 1500)),
            new Promise(resolve => setTimeout(() => resolve('Task 3'), 800))
        ];
        
        try {
            const results = await Promise.all(promises);
            console.log('All tasks complete:', results);
        } catch (error) {
            console.error('One task failed:', error);
        }
    },
    
    /**
     * RACE CONDITION EXAMPLE
     */
    async raceExample() {
        console.log('🏃 Race Condition Example');
        
        const timeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 2000)
        );
        
        const dataFetch = new Promise(resolve => 
            setTimeout(() => resolve('Data loaded'), 1500)
        );
        
        try {
            const result = await Promise.race([dataFetch, timeout]);
            console.log('Winner:', result);
        } catch (error) {
            console.error('Race lost:', error.message);
        }
    },
    
    /**
     * MICROTASK QUEUE DEMONSTRATION
     */
    microtaskDemo() {
        console.log('⚡ Microtask Queue Demo');
        
        console.log('1: Synchronous');
        
        setTimeout(() => console.log('4: Macrotask (setTimeout)'), 0);
        
        Promise.resolve().then(() => console.log('3: Microtask (Promise)'));
        
        queueMicrotask(() => console.log('3: Microtask (queueMicrotask)'));
        
        console.log('2: Synchronous');
        
        // Expected output: 1, 2, 3, 3, 4
    },
    
    /**
     * EVENT LOOP BLOCKING EXAMPLE
     */
    blockingExample() {
        console.log('🚫 Blocking Example (Don\'t do this!)');
        
        console.log('Before blocking operation');
        
        // This blocks the event loop - BAD!
        const start = Date.now();
        while (Date.now() - start < 3000) {
            // Blocking for 3 seconds
        }
        
        console.log('After blocking operation');
    },
    
    /**
     * NON-BLOCKING ALTERNATIVE
     */
    nonBlockingExample() {
        console.log('✅ Non-blocking Alternative');
        
        console.log('Before long operation');
        
        // Break work into chunks
        let count = 0;
        const target = 1000000000;
        
        function processChunk() {
            const chunkSize = 10000000;
            const end = Math.min(count + chunkSize, target);
            
            while (count < end) {
                count++;
            }
            
            if (count < target) {
                // Yield control back to event loop
                setTimeout(processChunk, 0);
            } else {
                console.log('Long operation complete');
            }
        }
        
        processChunk();
        console.log('After starting long operation (non-blocking)');
    }
};

// ========================================
// 4. DEBUGGING AND DEVELOPMENT HELPERS
// ========================================

/**
 * EXPOSE UTILITIES FOR DEBUGGING
 */
if (typeof window !== 'undefined') {
    window.eventLoopDebug = {
        simulator: () => eventLoopSimulator,
        performanceMonitor: new PerformanceMonitor(),
        examples: ConcurrencyExamples,
        
        // Utility functions
        logEventLoopState: () => {
            if (eventLoopSimulator) {
                console.table({
                    'Call Stack': eventLoopSimulator.callStack.length,
                    'Microtasks': eventLoopSimulator.microtaskQueue.length,
                    'Macrotasks': eventLoopSimulator.macrotaskQueue.length,
                    'Web APIs': eventLoopSimulator.webApis.size,
                    'Is Running': eventLoopSimulator.isRunning
                });
            }
        },
        
        // Run all concurrency examples
        runAllExamples: async () => {
            for (const [name, example] of Object.entries(ConcurrencyExamples)) {
                console.log(`\n--- Running ${name} ---`);
                await example();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    };
    
    console.log('🔧 Debug utilities available at window.eventLoopDebug');
}

// ========================================
// 5. EDUCATIONAL SUMMARY
// ========================================

console.log(`
🎓 EVENT LOOP VIRTUALIZER LOADED!

📚 KEY CONCEPTS DEMONSTRATED:
✅ JavaScript Event Loop mechanism
✅ Call Stack (LIFO execution)
✅ Microtask Queue (high priority)
✅ Macrotask Queue (normal priority)
✅ Web APIs (async operations)
✅ Concurrency Model (single-threaded, non-blocking)

🎯 INTERACTIVE FEATURES:
- Visual event loop simulation
- Step-by-step execution
- Code example demonstrations
- Performance insights
- Quiz questions
- Real-time logging

🔧 DEBUG TOOLS:
- window.eventLoopDebug.simulator() - Access simulator
- window.eventLoopDebug.logEventLoopState() - View current state
- window.eventLoopDebug.examples - Run concurrency examples

💡 LEARNING PATH:
1. Run the basic examples to understand execution order
2. Use step-through mode for detailed analysis
3. Try the quiz to test your knowledge
4. Experiment with the debug tools
5. Read the concepts section for deeper understanding

Happy learning! 🚀
`);
