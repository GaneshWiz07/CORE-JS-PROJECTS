class VirtualScrollList {
    constructor(container, options = {}) {
        this.container = container;
        this.virtualList = container.querySelector('#virtualList');
        this.spacerTop = container.querySelector('#spacerTop');
        this.spacerBottom = container.querySelector('#spacerBottom');
        this.visibleItems = container.querySelector('#visibleItems');
        
        // Configuration
        this.itemHeight = options.itemHeight || 50;
        this.bufferSize = options.bufferSize || 5;
        this.totalItems = options.totalItems || 100000;
        
        // Feature toggles
        this.enableThrottling = options.enableThrottling !== false;
        this.enableRAF = options.enableRAF !== false;
        this.enableIntersectionObserver = options.enableIntersectionObserver !== false;
        
        // State
        this.scrollTop = 0;
        this.containerHeight = 0;
        this.startIndex = 0;
        this.endIndex = 0;
        this.visibleItemsCount = 0;
        this.renderedItems = new Map();
        
        // Performance tracking
        this.frameCount = 0;
        this.lastFPSUpdate = performance.now();
        this.scrollEventCount = 0;
        this.renderCallCount = 0;
        this.lastMetricsUpdate = performance.now();
        
        // Throttling
        this.lastScrollTime = 0;
        this.scrollThrottleMs = 16; // ~60fps
        
        // RAF
        this.rafId = null;
        this.pendingUpdate = false;
        
        // Intersection Observer
        this.intersectionObserver = null;
        this.observedElements = new Set();
        
        this.init();
    }
    
    init() {
        this.containerHeight = this.virtualList.clientHeight;
        this.visibleItemsCount = Math.ceil(this.containerHeight / this.itemHeight) + this.bufferSize * 2;
        
        this.setupIntersectionObserver();
        this.setupEventListeners();
        this.generateData();
        this.updateView();
        this.startPerformanceMonitoring();
    }
    
    generateData() {
        this.data = Array.from({ length: this.totalItems }, (_, index) => ({
            id: index,
            title: `Item ${index + 1}`,
            subtitle: `Description for item ${index + 1}`,
            avatar: String.fromCharCode(65 + (index % 26)),
            timestamp: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            category: ['Work', 'Personal', 'Project', 'Meeting', 'Task'][index % 5]
        }));
    }
    
    setupIntersectionObserver() {
        if (!this.enableIntersectionObserver) return;
        
        this.intersectionObserver = new IntersectionObserver(
            this.throttle((entries) => {
                entries.forEach(entry => {
                    const item = entry.target;
                    if (entry.isIntersecting) {
                        item.classList.add('in-view');
                    } else {
                        item.classList.remove('in-view');
                    }
                });
            }, 100),
            {
                root: this.virtualList,
                rootMargin: '10px',
                threshold: 0.1
            }
        );
    }
    
    setupEventListeners() {
        const scrollHandler = this.enableThrottling 
            ? this.throttle(this.handleScroll.bind(this), this.scrollThrottleMs)
            : this.handleScroll.bind(this);
            
        this.virtualList.addEventListener('scroll', scrollHandler, { passive: true });
        
        // Control event listeners
        document.getElementById('generateBtn').addEventListener('click', () => {
            this.updateConfiguration();
            this.generateData();
            this.updateView();
        });
        
        document.getElementById('itemHeight').addEventListener('input', (e) => {
            this.itemHeight = parseInt(e.target.value);
            this.updateView();
        });
        
        document.getElementById('bufferSize').addEventListener('input', (e) => {
            this.bufferSize = parseInt(e.target.value);
            this.updateView();
        });
        
        document.getElementById('enableThrottling').addEventListener('change', (e) => {
            this.enableThrottling = e.target.checked;
            this.setupEventListeners();
        });
        
        document.getElementById('enableRAF').addEventListener('change', (e) => {
            this.enableRAF = e.target.checked;
        });
        
        document.getElementById('enableIntersectionObserver').addEventListener('change', (e) => {
            this.enableIntersectionObserver = e.target.checked;
            if (this.enableIntersectionObserver) {
                this.setupIntersectionObserver();
            } else {
                this.intersectionObserver?.disconnect();
            }
        });
    }
    
    updateConfiguration() {
        this.totalItems = parseInt(document.getElementById('itemCount').value);
        this.itemHeight = parseInt(document.getElementById('itemHeight').value);
        this.bufferSize = parseInt(document.getElementById('bufferSize').value);
        this.visibleItemsCount = Math.ceil(this.containerHeight / this.itemHeight) + this.bufferSize * 2;
    }
    
    handleScroll() {
        this.scrollEventCount++;
        this.scrollTop = this.virtualList.scrollTop;
        
        if (this.enableRAF) {
            if (!this.pendingUpdate) {
                this.pendingUpdate = true;
                this.rafId = requestAnimationFrame(() => {
                    this.updateView();
                    this.pendingUpdate = false;
                });
            }
        } else {
            this.updateView();
        }
    }
    
    updateView() {
        this.renderCallCount++;
        
        // Calculate visible range
        this.startIndex = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.bufferSize);
        this.endIndex = Math.min(
            this.totalItems - 1,
            this.startIndex + this.visibleItemsCount
        );
        
        // Update spacers
        const topSpacerHeight = this.startIndex * this.itemHeight;
        const bottomSpacerHeight = (this.totalItems - this.endIndex - 1) * this.itemHeight;
        
        this.spacerTop.style.height = `${topSpacerHeight}px`;
        this.spacerBottom.style.height = `${bottomSpacerHeight}px`;
        
        // Render visible items
        this.renderVisibleItems();
        
        // Update stats
        this.updateStats();
    }
    
    renderVisibleItems() {
        // Clear existing items
        this.visibleItems.innerHTML = '';
        this.observedElements.clear();
        
        // Render items in visible range
        for (let i = this.startIndex; i <= this.endIndex; i++) {
            const item = this.createItemElement(this.data[i], i);
            this.visibleItems.appendChild(item);
            
            // Observe with Intersection Observer
            if (this.enableIntersectionObserver && this.intersectionObserver) {
                this.intersectionObserver.observe(item);
                this.observedElements.add(item);
            }
        }
    }
    
    createItemElement(data, index) {
        const item = document.createElement('div');
        item.className = `list-item ${index % 2 === 0 ? 'even' : 'odd'}`;
        item.style.height = `${this.itemHeight}px`;
        item.dataset.index = index;
        
        item.innerHTML = `
            <div class="item-content">
                <div class="item-avatar">${data.avatar}</div>
                <div class="item-details">
                    <div class="item-title">${data.title}</div>
                    <div class="item-subtitle">${data.subtitle}</div>
                </div>
            </div>
            <div class="item-meta">
                <span class="item-index">#${index}</span>
                <span>${data.category}</span>
                <span>${data.timestamp}</span>
            </div>
            <div class="intersection-indicator"></div>
        `;
        
        return item;
    }
    
    updateStats() {
        document.getElementById('renderedCount').textContent = this.endIndex - this.startIndex + 1;
        document.getElementById('scrollPosition').textContent = Math.round(this.scrollTop);
        document.getElementById('domNodeCount').textContent = this.visibleItems.children.length;
    }
    
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    startPerformanceMonitoring() {
        const updateFPS = () => {
            this.frameCount++;
            const now = performance.now();
            
            if (now - this.lastFPSUpdate >= 1000) {
                const fps = Math.round((this.frameCount * 1000) / (now - this.lastFPSUpdate));
                document.getElementById('fpsCounter').textContent = fps;
                this.frameCount = 0;
                this.lastFPSUpdate = now;
            }
            
            requestAnimationFrame(updateFPS);
        };
        
        const updateMetrics = () => {
            const now = performance.now();
            const timeDiff = now - this.lastMetricsUpdate;
            
            if (timeDiff >= 1000) {
                const scrollEventsPerSec = Math.round((this.scrollEventCount * 1000) / timeDiff);
                const renderCallsPerSec = Math.round((this.renderCallCount * 1000) / timeDiff);
                
                document.getElementById('scrollEventsPerSec').textContent = scrollEventsPerSec;
                document.getElementById('renderCallsPerSec').textContent = renderCallsPerSec;
                
                // Memory usage (approximate)
                if (performance.memory) {
                    const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
                    document.getElementById('memoryUsage').textContent = `${memoryMB} MB`;
                }
                
                this.scrollEventCount = 0;
                this.renderCallCount = 0;
                this.lastMetricsUpdate = now;
            }
            
            setTimeout(updateMetrics, 1000);
        };
        
        requestAnimationFrame(updateFPS);
        updateMetrics();
    }
    
    // Public methods for external control
    scrollToIndex(index) {
        const targetScrollTop = index * this.itemHeight;
        this.virtualList.scrollTop = targetScrollTop;
    }
    
    getVisibleRange() {
        return {
            start: this.startIndex,
            end: this.endIndex,
            total: this.totalItems
        };
    }
    
    updateItemHeight(newHeight) {
        this.itemHeight = newHeight;
        this.visibleItemsCount = Math.ceil(this.containerHeight / this.itemHeight) + this.bufferSize * 2;
        this.updateView();
    }
    
    destroy() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
    }
}

// Performance utilities
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            scrollEvents: 0,
            renderCalls: 0,
            lastUpdate: performance.now()
        };
    }
    
    trackScrollEvent() {
        this.metrics.scrollEvents++;
    }
    
    trackRenderCall() {
        this.metrics.renderCalls++;
    }
    
    getMetrics() {
        const now = performance.now();
        const timeDiff = now - this.metrics.lastUpdate;
        
        if (timeDiff >= 1000) {
            const result = {
                scrollEventsPerSec: Math.round((this.metrics.scrollEvents * 1000) / timeDiff),
                renderCallsPerSec: Math.round((this.metrics.renderCalls * 1000) / timeDiff)
            };
            
            this.metrics.scrollEvents = 0;
            this.metrics.renderCalls = 0;
            this.metrics.lastUpdate = now;
            
            return result;
        }
        
        return null;
    }
}

// Advanced throttling with different strategies
class ThrottleManager {
    static createThrottle(func, limit, strategy = 'trailing') {
        let inThrottle;
        let lastFunc;
        let lastRan;
        
        return function(...args) {
            if (!inThrottle) {
                if (strategy === 'leading') {
                    func.apply(this, args);
                }
                inThrottle = true;
                setTimeout(() => {
                    inThrottle = false;
                    if (strategy === 'trailing' && lastFunc) {
                        lastFunc();
                    }
                }, limit);
                lastRan = Date.now();
            } else {
                if (strategy === 'trailing') {
                    lastFunc = () => func.apply(this, args);
                }
            }
        };
    }
    
    static createDebounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
}

// RAF-based smooth scrolling utility
class SmoothScrollManager {
    constructor() {
        this.pendingCallbacks = new Set();
    }
    
    schedule(callback) {
        if (!this.pendingCallbacks.has(callback)) {
            this.pendingCallbacks.add(callback);
            requestAnimationFrame(() => {
                callback();
                this.pendingCallbacks.delete(callback);
            });
        }
    }
    
    scheduleWithPriority(callback, priority = 'normal') {
        const wrappedCallback = () => {
            if (priority === 'high') {
                callback();
            } else {
                // Yield to browser for high priority tasks
                setTimeout(callback, 0);
            }
        };
        
        this.schedule(wrappedCallback);
    }
}

// Demo data generator with realistic content
class DataGenerator {
    static generateLargeDataset(count) {
        const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];
        const companies = ['TechCorp', 'DataSys', 'CloudInc', 'DevStudio', 'CodeLab'];
        const departments = ['Engineering', 'Design', 'Marketing', 'Sales', 'Support'];
        const statuses = ['Active', 'Pending', 'Completed', 'In Review', 'Archived'];
        
        return Array.from({ length: count }, (_, index) => {
            const name = names[index % names.length];
            const company = companies[Math.floor(Math.random() * companies.length)];
            const department = departments[Math.floor(Math.random() * departments.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            
            return {
                id: index,
                title: `${name} - ${company}`,
                subtitle: `${department} • ${status}`,
                avatar: name.charAt(0),
                timestamp: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                category: department,
                priority: Math.floor(Math.random() * 3) + 1,
                score: Math.floor(Math.random() * 100)
            };
        });
    }
}

// Main application initialization
class VirtualScrollApp {
    constructor() {
        this.virtualList = null;
        this.performanceMonitor = new PerformanceMonitor();
        this.smoothScrollManager = new SmoothScrollManager();
        this.init();
    }
    
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeVirtualList();
            this.setupGlobalControls();
        });
    }
    
    initializeVirtualList() {
        const container = document.getElementById('scrollContainer');
        const options = {
            itemHeight: parseInt(document.getElementById('itemHeight').value),
            bufferSize: parseInt(document.getElementById('bufferSize').value),
            totalItems: parseInt(document.getElementById('itemCount').value),
            enableThrottling: document.getElementById('enableThrottling').checked,
            enableRAF: document.getElementById('enableRAF').checked,
            enableIntersectionObserver: document.getElementById('enableIntersectionObserver').checked
        };
        
        this.virtualList = new VirtualScrollList(container, options);
    }
    
    setupGlobalControls() {
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'Home':
                        e.preventDefault();
                        this.virtualList.scrollToIndex(0);
                        break;
                    case 'End':
                        e.preventDefault();
                        this.virtualList.scrollToIndex(this.virtualList.totalItems - 1);
                        break;
                }
            }
        });
        
        // Add search functionality
        this.addSearchFeature();
        
        // Add performance testing buttons
        this.addPerformanceTests();
    }
    
    addSearchFeature() {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.innerHTML = `
            <input type="text" id="searchInput" placeholder="Search items..." />
            <button id="searchBtn">Search</button>
            <button id="clearSearch">Clear</button>
        `;
        
        document.querySelector('.controls').appendChild(searchContainer);
        
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const clearBtn = document.getElementById('clearSearch');
        
        const performSearch = ThrottleManager.createDebounce((query) => {
            if (!query.trim()) return;
            
            const results = this.virtualList.data.filter(item => 
                item.title.toLowerCase().includes(query.toLowerCase()) ||
                item.subtitle.toLowerCase().includes(query.toLowerCase())
            );
            
            if (results.length > 0) {
                const firstMatch = this.virtualList.data.indexOf(results[0]);
                this.virtualList.scrollToIndex(firstMatch);
            }
        }, 300);
        
        searchInput.addEventListener('input', (e) => performSearch(e.target.value));
        searchBtn.addEventListener('click', () => performSearch(searchInput.value));
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            this.virtualList.scrollToIndex(0);
        });
    }
    
    addPerformanceTests() {
        const testContainer = document.createElement('div');
        testContainer.className = 'test-container';
        testContainer.innerHTML = `
            <button id="stressTest">Stress Test (Rapid Scroll)</button>
            <button id="memoryTest">Memory Test (Large Dataset)</button>
            <button id="smoothScrollTest">Smooth Scroll Test</button>
        `;
        
        document.querySelector('.performance-panel').appendChild(testContainer);
        
        document.getElementById('stressTest').addEventListener('click', () => {
            this.runStressTest();
        });
        
        document.getElementById('memoryTest').addEventListener('click', () => {
            this.runMemoryTest();
        });
        
        document.getElementById('smoothScrollTest').addEventListener('click', () => {
            this.runSmoothScrollTest();
        });
    }
    
    runStressTest() {
        console.log('Starting stress test...');
        let scrollPosition = 0;
        const maxScroll = this.virtualList.totalItems * this.virtualList.itemHeight;
        const scrollStep = this.virtualList.itemHeight * 10;
        
        const stressScroll = () => {
            scrollPosition += scrollStep;
            if (scrollPosition >= maxScroll) {
                scrollPosition = 0;
            }
            
            this.virtualList.virtualList.scrollTop = scrollPosition;
            
            if (scrollPosition < maxScroll) {
                requestAnimationFrame(stressScroll);
            } else {
                console.log('Stress test completed');
            }
        };
        
        requestAnimationFrame(stressScroll);
    }
    
    runMemoryTest() {
        console.log('Starting memory test...');
        const originalCount = this.virtualList.totalItems;
        
        document.getElementById('itemCount').value = '500000';
        this.virtualList.updateConfiguration();
        this.virtualList.generateData();
        this.virtualList.updateView();
        
        setTimeout(() => {
            document.getElementById('itemCount').value = originalCount;
            this.virtualList.updateConfiguration();
            this.virtualList.generateData();
            this.virtualList.updateView();
            console.log('Memory test completed');
        }, 5000);
    }
    
    runSmoothScrollTest() {
        console.log('Starting smooth scroll test...');
        const targetIndex = Math.floor(this.virtualList.totalItems * 0.5);
        
        // Smooth scroll to middle
        this.smoothScrollToIndex(targetIndex, 2000);
    }
    
    smoothScrollToIndex(targetIndex, duration) {
        const startScrollTop = this.virtualList.virtualList.scrollTop;
        const targetScrollTop = targetIndex * this.virtualList.itemHeight;
        const distance = targetScrollTop - startScrollTop;
        const startTime = performance.now();
        
        const animateScroll = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-in-out)
            const easeInOut = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            const currentScrollTop = startScrollTop + (distance * easeInOut);
            this.virtualList.virtualList.scrollTop = currentScrollTop;
            
            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            }
        };
        
        requestAnimationFrame(animateScroll);
    }
}

// Initialize the application
const app = new VirtualScrollApp();
