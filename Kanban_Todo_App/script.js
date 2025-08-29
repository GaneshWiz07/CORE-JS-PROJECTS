/* 
========================================
KANBAN BOARD JAVASCRIPT - COMPREHENSIVE DOM EVENTS & DRAG API TUTORIAL
========================================

This JavaScript file demonstrates:
1. DOM Events: click, load, submit, change, input, dragstart, dragover, drop
2. Event Bubbling & Capturing with visual demonstrations
3. Drag and Drop API implementation
4. State Management & Synchronization
5. Event Delegation patterns
6. Custom Events for component communication
7. Local Storage for data persistence
8. Form validation and real-time feedback

LEARNING OBJECTIVES:
- Understand how events propagate through the DOM
- Master the Drag and Drop API
- Learn proper state management techniques
- Practice event delegation for better performance
- Implement custom events for loose coupling
*/

// ========================================
// 1. APPLICATION STATE MANAGEMENT
// ========================================

/**
 * CENTRAL STATE STORE
 * This is our single source of truth for application data
 * All UI updates should be driven by state changes
 */
class AppState {
    constructor() {
        this.tasks = [];
        this.currentEditingTask = null;
        this.theme = 'light';
        this.eventLog = [];
        this.subscribers = new Map(); // For custom event system
        
        // Load persisted state from localStorage
        this.loadFromStorage();
    }

    /**
     * STATE SYNCHRONIZATION: Add a task and notify all subscribers
     * This demonstrates the observer pattern for state management
     */
    addTask(taskData) {
        const newTask = {
            id: this.generateId(),
            title: taskData.title,
            description: taskData.description,
            priority: taskData.priority || 'medium',
            category: taskData.category || 'General',
            status: 'todo',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.tasks.push(newTask);
        this.saveToStorage();
        this.notifySubscribers('taskAdded', newTask);
        
        // CUSTOM EVENT: Dispatch a custom event for loose coupling
        this.dispatchCustomEvent('task:created', { task: newTask });
        
        return newTask;
    }

    /**
     * UPDATE TASK STATUS - Used for drag and drop operations
     */
    updateTaskStatus(taskId, newStatus) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            const oldStatus = task.status;
            task.status = newStatus;
            task.updatedAt = new Date().toISOString();
            
            this.saveToStorage();
            this.notifySubscribers('taskStatusChanged', { task, oldStatus, newStatus });
            
            // CUSTOM EVENT for status change
            this.dispatchCustomEvent('task:statusChanged', { task, oldStatus, newStatus });
        }
    }

    /**
     * DELETE TASK
     */
    deleteTask(taskId) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            const deletedTask = this.tasks.splice(taskIndex, 1)[0];
            this.saveToStorage();
            this.notifySubscribers('taskDeleted', deletedTask);
            this.dispatchCustomEvent('task:deleted', { task: deletedTask });
        }
    }

    /**
     * OBSERVER PATTERN: Subscribe to state changes
     */
    subscribe(eventType, callback) {
        if (!this.subscribers.has(eventType)) {
            this.subscribers.set(eventType, []);
        }
        this.subscribers.get(eventType).push(callback);
    }

    /**
     * NOTIFY ALL SUBSCRIBERS of state changes
     */
    notifySubscribers(eventType, data) {
        if (this.subscribers.has(eventType)) {
            this.subscribers.get(eventType).forEach(callback => callback(data));
        }
    }

    /**
     * CUSTOM EVENTS: Dispatch custom DOM events for component communication
     */
    dispatchCustomEvent(eventName, detail) {
        const customEvent = new CustomEvent(eventName, {
            detail,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(customEvent);
    }

    /**
     * PERSISTENCE: Save state to localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem('kanban-tasks', JSON.stringify(this.tasks));
            localStorage.setItem('kanban-theme', this.theme);
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }

    /**
     * PERSISTENCE: Load state from localStorage
     */
    loadFromStorage() {
        try {
            const savedTasks = localStorage.getItem('kanban-tasks');
            const savedTheme = localStorage.getItem('kanban-theme');
            
            if (savedTasks) {
                this.tasks = JSON.parse(savedTasks);
            }
            
            if (savedTheme) {
                this.theme = savedTheme;
            }
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
        }
    }

    /**
     * UTILITY: Generate unique IDs
     */
    generateId() {
        return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * STATISTICS: Calculate completion stats
     */
    getStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.status === 'done').length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return {
            total,
            completed,
            completionRate,
            todo: this.tasks.filter(t => t.status === 'todo').length,
            inProgress: this.tasks.filter(t => t.status === 'in-progress').length
        };
    }

    /**
     * EVENT LOGGING: For demonstrating event bubbling/capturing
     */
    logEvent(message) {
        const timestamp = new Date().toLocaleTimeString();
        this.eventLog.push(`[${timestamp}] ${message}`);
        
        // Keep only last 50 events
        if (this.eventLog.length > 50) {
            this.eventLog.shift();
        }
    }
}

// ========================================
// 2. INITIALIZE APPLICATION STATE
// ========================================
const appState = new AppState();

// ========================================
// 3. DOM ELEMENTS REFERENCES
// ========================================
let elements = {}; // Will be populated after DOM loads

// ========================================
// 4. DOM LOAD EVENT - Application Initialization
// ========================================

/**
 * LOAD EVENT: This fires when the DOM is fully loaded
 * This is where we initialize our application
 */
document.addEventListener('DOMContentLoaded', function(event) {
    console.log('🚀 DOM Content Loaded - Initializing Kanban Board');
    
    // Get references to all DOM elements
    initializeElements();
    
    // Set up all event listeners
    initializeEventListeners();
    
    // Set up drag and drop functionality
    initializeDragAndDrop();
    
    // Set up event bubbling/capturing demo
    initializeEventDemo();
    
    // Render initial UI state
    renderUI();
    
    // Set initial theme
    applyTheme(appState.theme);
    
    console.log('✅ Application initialized successfully');
});

/**
 * GET REFERENCES to all DOM elements we'll need
 */
function initializeElements() {
    elements = {
        // Buttons
        addTaskBtn: document.getElementById('addTaskBtn'),
        toggleThemeBtn: document.getElementById('toggleThemeBtn'),
        clearAllBtn: document.getElementById('clearAllBtn'),
        closeModal: document.getElementById('closeModal'),
        cancelBtn: document.getElementById('cancelBtn'),
        clearLogBtn: document.getElementById('clearLogBtn'),
        toggleLearningPanel: document.getElementById('toggleLearningPanel'),
        
        // Modal and Form
        taskModal: document.getElementById('taskModal'),
        taskForm: document.getElementById('taskForm'),
        modalTitle: document.getElementById('modalTitle'),
        
        // Form inputs
        taskTitle: document.getElementById('taskTitle'),
        taskDescription: document.getElementById('taskDescription'),
        taskPriority: document.getElementById('taskPriority'),
        taskCategory: document.getElementById('taskCategory'),
        
        // Character counters
        titleCharCount: document.getElementById('titleCharCount'),
        descCharCount: document.getElementById('descCharCount'),
        
        // Task lists (drop zones)
        todoList: document.getElementById('todoList'),
        inProgressList: document.getElementById('inProgressList'),
        doneList: document.getElementById('doneList'),
        
        // Counters
        todoCount: document.getElementById('todoCount'),
        inProgressCount: document.getElementById('inProgressCount'),
        doneCount: document.getElementById('doneCount'),
        
        // Statistics
        totalTasks: document.getElementById('totalTasks'),
        completedTasks: document.getElementById('completedTasks'),
        completionRate: document.getElementById('completionRate'),
        
        // Event demo
        outerDiv: document.getElementById('outerDiv'),
        middleDiv: document.getElementById('middleDiv'),
        innerDiv: document.getElementById('innerDiv'),
        eventLog: document.getElementById('eventLog'),
        
        // Learning panel
        learningPanel: document.getElementById('learningPanel')
    };
}

// ========================================
// 5. EVENT LISTENERS SETUP
// ========================================

/**
 * INITIALIZE ALL EVENT LISTENERS
 * This demonstrates various DOM events and their usage
 */
function initializeEventListeners() {
    console.log('🎯 Setting up event listeners...');
    
    // ==========================================
    // CLICK EVENTS - Most common DOM event
    // ==========================================
    
    /**
     * CLICK EVENT: Add new task button
     * Shows modal for task creation
     */
    elements.addTaskBtn.addEventListener('click', function(event) {
        console.log('🔘 Add Task button clicked');
        appState.currentEditingTask = null;
        elements.modalTitle.textContent = 'Add New Task';
        showModal();
        
        // Focus the first input for better UX
        setTimeout(() => elements.taskTitle.focus(), 100);
    });
    
    /**
     * CLICK EVENT: Theme toggle
     * Demonstrates state changes and UI synchronization
     */
    elements.toggleThemeBtn.addEventListener('click', function(event) {
        console.log('🎨 Theme toggle clicked');
        appState.theme = appState.theme === 'light' ? 'dark' : 'light';
        applyTheme(appState.theme);
        appState.saveToStorage();
    });
    
    /**
     * CLICK EVENT: Clear all tasks
     * Shows confirmation dialog
     */
    elements.clearAllBtn.addEventListener('click', function(event) {
        console.log('🗑️ Clear all button clicked');
        
        if (appState.tasks.length === 0) {
            alert('No tasks to clear!');
            return;
        }
        
        // Confirmation dialog
        const confirmed = confirm(`Are you sure you want to delete all ${appState.tasks.length} tasks? This action cannot be undone.`);
        
        if (confirmed) {
            appState.tasks = [];
            appState.saveToStorage();
            renderUI();
            
            // Custom event for clearing all tasks
            appState.dispatchCustomEvent('tasks:cleared', { count: appState.tasks.length });
        }
    });
    
    /**
     * CLICK EVENT: Close modal
     */
    elements.closeModal.addEventListener('click', hideModal);
    elements.cancelBtn.addEventListener('click', hideModal);
    
    /**
     * CLICK EVENT: Modal backdrop (click outside to close)
     * This demonstrates event targeting
     */
    elements.taskModal.addEventListener('click', function(event) {
        // Only close if clicked on the modal backdrop, not the content
        if (event.target === elements.taskModal) {
            console.log('🔘 Modal backdrop clicked - closing modal');
            hideModal();
        }
    });
    
    /**
     * CLICK EVENT: Learning panel toggle
     */
    elements.toggleLearningPanel.addEventListener('click', function(event) {
        elements.learningPanel.classList.toggle('collapsed');
    });
    
    // ==========================================
    // FORM EVENTS - submit, input, change
    // ==========================================
    
    /**
     * SUBMIT EVENT: Task form submission
     * This is triggered when form is submitted (Enter key or submit button)
     */
    elements.taskForm.addEventListener('submit', function(event) {
        console.log('📝 Form submitted');
        
        // PREVENT DEFAULT: Stop the form from actually submitting
        event.preventDefault();
        
        // Get form data
        const formData = new FormData(event.target);
        const taskData = {
            title: formData.get('title').trim(),
            description: formData.get('description').trim(),
            priority: formData.get('priority'),
            category: formData.get('category').trim() || 'General'
        };
        
        // Validate form data
        if (!taskData.title) {
            alert('Please enter a task title');
            elements.taskTitle.focus();
            return;
        }
        
        // Add or update task
        if (appState.currentEditingTask) {
            // Update existing task
            updateTask(appState.currentEditingTask.id, taskData);
        } else {
            // Add new task
            appState.addTask(taskData);
        }
        
        // Reset form and close modal
        event.target.reset();
        updateCharCounters();
        hideModal();
        renderUI();
    });
    
    /**
     * INPUT EVENTS: Real-time character counting
     * These fire every time the user types in the input fields
     */
    elements.taskTitle.addEventListener('input', function(event) {
        updateCharCounter(event.target, elements.titleCharCount, 100);
    });
    
    elements.taskDescription.addEventListener('input', function(event) {
        updateCharCounter(event.target, elements.descCharCount, 500);
    });
    
    /**
     * CHANGE EVENT: Priority dropdown
     * This fires when the select value changes
     */
    elements.taskPriority.addEventListener('change', function(event) {
        console.log('🎯 Priority changed to:', event.target.value);
        
        // Visual feedback for priority selection
        event.target.style.borderColor = getPriorityColor(event.target.value);
        
        setTimeout(() => {
            event.target.style.borderColor = '';
        }, 1000);
    });
    
    // ==========================================
    // KEYBOARD EVENTS
    // ==========================================
    
    /**
     * KEYDOWN EVENT: Keyboard shortcuts
     * Escape key to close modal, Enter to submit
     */
    document.addEventListener('keydown', function(event) {
        // Escape key closes modal
        if (event.key === 'Escape' && elements.taskModal.classList.contains('show')) {
            console.log('⌨️ Escape key pressed - closing modal');
            hideModal();
        }
        
        // Ctrl+N or Cmd+N to add new task
        if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
            event.preventDefault();
            elements.addTaskBtn.click();
        }
    });
    
    // ==========================================
    // CUSTOM EVENTS - Component Communication
    // ==========================================
    
    /**
     * CUSTOM EVENT LISTENERS: Listen for our custom events
     * This demonstrates loose coupling between components
     */
    document.addEventListener('task:created', function(event) {
        console.log('🎉 Custom event: Task created', event.detail.task);
        showNotification(`Task "${event.detail.task.title}" created!`, 'success');
    });
    
    document.addEventListener('task:statusChanged', function(event) {
        const { task, oldStatus, newStatus } = event.detail;
        console.log('📊 Custom event: Task status changed', { task: task.title, oldStatus, newStatus });
        showNotification(`Task moved from ${oldStatus} to ${newStatus}`, 'info');
    });
    
    document.addEventListener('task:deleted', function(event) {
        console.log('🗑️ Custom event: Task deleted', event.detail.task);
        showNotification(`Task "${event.detail.task.title}" deleted`, 'warning');
    });
    
    // ==========================================
    // EVENT DELEGATION - Handle dynamic content
    // ==========================================
    
    /**
     * EVENT DELEGATION: Handle clicks on dynamically created task elements
     * Instead of adding listeners to each task, we listen on the parent container
     * This is more efficient and works with dynamically added elements
     */
    document.getElementById('kanbanBoard').addEventListener('click', function(event) {
        // Check if clicked element is a task action button
        if (event.target.classList.contains('task-action-btn')) {
            const action = event.target.dataset.action;
            const taskId = event.target.closest('.task-card').dataset.taskId;
            
            console.log('🎯 Task action clicked:', { action, taskId });
            
            switch (action) {
                case 'edit':
                    editTask(taskId);
                    break;
                case 'delete':
                    deleteTask(taskId);
                    break;
                case 'move-next':
                    moveTaskToNextStatus(taskId);
                    break;
                case 'move-prev':
                    moveTaskToPrevStatus(taskId);
                    break;
            }
        }
    });
    
    console.log('✅ Event listeners initialized');
}

// ========================================
// 6. EVENT BUBBLING & CAPTURING DEMONSTRATION
// ========================================

/**
 * INITIALIZE EVENT BUBBLING/CAPTURING DEMO
 * This section demonstrates how events propagate through the DOM
 */
function initializeEventDemo() {
    console.log('🔍 Setting up event bubbling/capturing demo...');
    
    // Clear event log button
    elements.clearLogBtn.addEventListener('click', function() {
        appState.eventLog = [];
        elements.eventLog.textContent = '';
    });
    
    // ==========================================
    // EVENT CAPTURING PHASE (useCapture: true)
    // Events travel DOWN the DOM tree first
    // ==========================================
    
    elements.outerDiv.addEventListener('click', function(event) {
        const message = '📥 CAPTURE: Outer div clicked (Grandparent)';
        console.log(message);
        appState.logEvent(message);
        updateEventLog();
        
        // Visual feedback
        event.currentTarget.style.backgroundColor = 'rgba(231, 76, 60, 0.3)';
        setTimeout(() => {
            event.currentTarget.style.backgroundColor = '';
        }, 300);
    }, true); // useCapture: true
    
    elements.middleDiv.addEventListener('click', function(event) {
        const message = '📥 CAPTURE: Middle div clicked (Parent)';
        console.log(message);
        appState.logEvent(message);
        updateEventLog();
        
        // Visual feedback
        event.currentTarget.style.backgroundColor = 'rgba(243, 156, 18, 0.3)';
        setTimeout(() => {
            event.currentTarget.style.backgroundColor = '';
        }, 300);
    }, true); // useCapture: true
    
    elements.innerDiv.addEventListener('click', function(event) {
        const message = '📥 CAPTURE: Inner div clicked (Child)';
        console.log(message);
        appState.logEvent(message);
        updateEventLog();
        
        // Visual feedback
        event.currentTarget.style.backgroundColor = 'rgba(46, 204, 113, 0.3)';
        setTimeout(() => {
            event.currentTarget.style.backgroundColor = '';
        }, 300);
    }, true); // useCapture: true
    
    // ==========================================
    // TARGET PHASE - The actual clicked element
    // ==========================================
    
    elements.innerDiv.addEventListener('click', function(event) {
        const message = '🎯 TARGET: Inner div is the actual target!';
        console.log(message);
        appState.logEvent(message);
        updateEventLog();
    });
    
    // ==========================================
    // EVENT BUBBLING PHASE (useCapture: false - default)
    // Events travel UP the DOM tree
    // ==========================================
    
    elements.innerDiv.addEventListener('click', function(event) {
        const message = '🔼 BUBBLE: Inner div bubbling up (Child)';
        console.log(message);
        appState.logEvent(message);
        updateEventLog();
        
        // Uncomment this line to stop event propagation
        // event.stopPropagation();
        // appState.logEvent('🛑 Event propagation stopped!');
    });
    
    elements.middleDiv.addEventListener('click', function(event) {
        const message = '🔼 BUBBLE: Middle div bubbling up (Parent)';
        console.log(message);
        appState.logEvent(message);
        updateEventLog();
    });
    
    elements.outerDiv.addEventListener('click', function(event) {
        const message = '🔼 BUBBLE: Outer div bubbling up (Grandparent)';
        console.log(message);
        appState.logEvent(message);
        updateEventLog();
    });
    
    // ==========================================
    // DOCUMENT LEVEL EVENT (End of bubbling)
    // ==========================================
    
    document.addEventListener('click', function(event) {
        // Only log if the click was on our demo elements
        if (event.target.closest('.event-demo-container')) {
            const message = '🔼 BUBBLE: Document level reached!';
            console.log(message);
            appState.logEvent(message);
            updateEventLog();
        }
    });
    
    console.log('✅ Event demo initialized');
}

/**
 * UPDATE EVENT LOG DISPLAY
 */
function updateEventLog() {
    elements.eventLog.textContent = appState.eventLog.join('\n');
    elements.eventLog.scrollTop = elements.eventLog.scrollHeight;
}

// ========================================
// 7. DRAG AND DROP API IMPLEMENTATION
// ========================================

/**
 * INITIALIZE DRAG AND DROP FUNCTIONALITY
 * This demonstrates the HTML5 Drag and Drop API
 */
function initializeDragAndDrop() {
    console.log('🤏 Setting up drag and drop...');
    
    // ==========================================
    // DROP ZONES - Task lists that can accept drops
    // ==========================================
    
    const dropZones = [elements.todoList, elements.inProgressList, elements.doneList];
    
    dropZones.forEach(dropZone => {
        /**
         * DRAGOVER EVENT: Fired when dragged element is over drop zone
         * Must prevent default to allow drop
         */
        dropZone.addEventListener('dragover', function(event) {
            // PREVENT DEFAULT: Allow drop by preventing default behavior
            event.preventDefault();
            
            // Visual feedback: Add drag-over class
            event.currentTarget.classList.add('drag-over');
            
            // Set drop effect
            event.dataTransfer.dropEffect = 'move';
            
            console.log('🎯 Drag over:', event.currentTarget.dataset.column);
        });
        
        /**
         * DRAGLEAVE EVENT: Fired when dragged element leaves drop zone
         */
        dropZone.addEventListener('dragleave', function(event) {
            // Remove visual feedback only if we're really leaving the drop zone
            if (!event.currentTarget.contains(event.relatedTarget)) {
                event.currentTarget.classList.remove('drag-over');
                console.log('👋 Drag leave:', event.currentTarget.dataset.column);
            }
        });
        
        /**
         * DROP EVENT: Fired when element is dropped
         */
        dropZone.addEventListener('drop', function(event) {
            // PREVENT DEFAULT: Stop browser from navigating to dragged content
            event.preventDefault();
            
            // Remove visual feedback
            event.currentTarget.classList.remove('drag-over');
            
            // Get the dragged task ID from dataTransfer
            const taskId = event.dataTransfer.getData('text/plain');
            const newStatus = event.currentTarget.dataset.column;
            
            console.log('📥 Drop event:', { taskId, newStatus });
            
            // Update task status in our state
            appState.updateTaskStatus(taskId, newStatus);
            
            // Re-render UI to reflect changes
            renderUI();
            
            // Show success feedback
            showNotification('Task moved successfully!', 'success');
        });
    });
    
    console.log('✅ Drag and drop initialized');
}

/**
 * MAKE TASK DRAGGABLE
 * This is called when creating task elements
 */
function makeDraggable(taskElement, task) {
    // Make element draggable
    taskElement.draggable = true;
    
    /**
     * DRAGSTART EVENT: Fired when drag begins
     */
    taskElement.addEventListener('dragstart', function(event) {
        console.log('🤏 Drag start:', task.title);
        
        // Store task ID in dataTransfer for use in drop event
        event.dataTransfer.setData('text/plain', task.id);
        
        // Set drag effect
        event.dataTransfer.effectAllowed = 'move';
        
        // Add visual feedback
        event.currentTarget.classList.add('dragging');
        
        // Create custom drag image (optional)
        const dragImage = event.currentTarget.cloneNode(true);
        dragImage.style.transform = 'rotate(5deg)';
        dragImage.style.opacity = '0.8';
        event.dataTransfer.setDragImage(dragImage, 50, 50);
    });
    
    /**
     * DRAGEND EVENT: Fired when drag ends (regardless of success)
     */
    taskElement.addEventListener('dragend', function(event) {
        console.log('🏁 Drag end:', task.title);
        
        // Remove visual feedback
        event.currentTarget.classList.remove('dragging');
        
        // Remove drag-over class from all drop zones
        document.querySelectorAll('.task-list').forEach(zone => {
            zone.classList.remove('drag-over');
        });
    });
}

// ========================================
// 8. UI RENDERING AND STATE SYNCHRONIZATION
// ========================================

/**
 * RENDER ENTIRE UI - Synchronize UI with application state
 * This is called whenever state changes
 */
function renderUI() {
    console.log('🎨 Rendering UI...');
    
    // Clear all task lists
    elements.todoList.innerHTML = '';
    elements.inProgressList.innerHTML = '';
    elements.doneList.innerHTML = '';
    
    // Render tasks in appropriate columns
    appState.tasks.forEach(task => {
        const taskElement = createTaskElement(task);
        
        switch (task.status) {
            case 'todo':
                elements.todoList.appendChild(taskElement);
                break;
            case 'in-progress':
                elements.inProgressList.appendChild(taskElement);
                break;
            case 'done':
                elements.doneList.appendChild(taskElement);
                break;
        }
    });
    
    // Update counters
    updateCounters();
    
    // Update statistics
    updateStatistics();
    
    console.log('✅ UI rendered');
}

/**
 * CREATE TASK ELEMENT - Generate HTML for a task
 */
function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = `task-card priority-${task.priority}`;
    taskDiv.dataset.taskId = task.id;
    
    // Make task draggable
    makeDraggable(taskDiv, task);
    
    // Format creation date
    const createdDate = new Date(task.createdAt).toLocaleDateString();
    
    taskDiv.innerHTML = `
        <div class="task-title">${escapeHtml(task.title)}</div>
        <div class="task-description">${escapeHtml(task.description)}</div>
        <div class="task-meta">
            <span class="task-category">${escapeHtml(task.category)}</span>
            <span class="task-date">${createdDate}</span>
        </div>
        <div class="task-actions">
            <button class="task-action-btn" data-action="edit" title="Edit Task">
                ✏️
            </button>
            <button class="task-action-btn" data-action="delete" title="Delete Task">
                🗑️
            </button>
            ${task.status !== 'done' ? `
                <button class="task-action-btn" data-action="move-next" title="Move Forward">
                    ➡️
                </button>
            ` : ''}
            ${task.status !== 'todo' ? `
                <button class="task-action-btn" data-action="move-prev" title="Move Back">
                    ⬅️
                </button>
            ` : ''}
        </div>
    `;
    
    return taskDiv;
}

/**
 * UPDATE TASK COUNTERS
 */
function updateCounters() {
    const stats = appState.getStats();
    
    elements.todoCount.textContent = stats.todo;
    elements.inProgressCount.textContent = stats.inProgress;
    elements.doneCount.textContent = stats.completed;
}

/**
 * UPDATE STATISTICS
 */
function updateStatistics() {
    const stats = appState.getStats();
    
    elements.totalTasks.textContent = stats.total;
    elements.completedTasks.textContent = stats.completed;
    elements.completionRate.textContent = `${stats.completionRate}%`;
}

// ========================================
// 9. MODAL AND FORM HANDLING
// ========================================

/**
 * SHOW MODAL
 */
function showModal() {
    elements.taskModal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

/**
 * HIDE MODAL
 */
function hideModal() {
    elements.taskModal.classList.remove('show');
    document.body.style.overflow = ''; // Restore scrolling
    elements.taskForm.reset();
    updateCharCounters();
    appState.currentEditingTask = null;
}

/**
 * UPDATE CHARACTER COUNTERS - Real-time feedback
 */
function updateCharCounter(input, counterElement, maxLength) {
    const currentLength = input.value.length;
    counterElement.textContent = currentLength;
    
    // Visual feedback for approaching limit
    counterElement.className = 'char-counter';
    if (currentLength > maxLength * 0.8) {
        counterElement.classList.add('warning');
    }
    if (currentLength > maxLength * 0.95) {
        counterElement.classList.add('danger');
    }
}

/**
 * UPDATE ALL CHARACTER COUNTERS
 */
function updateCharCounters() {
    updateCharCounter(elements.taskTitle, elements.titleCharCount, 100);
    updateCharCounter(elements.taskDescription, elements.descCharCount, 500);
}

// ========================================
// 10. TASK OPERATIONS
// ========================================

/**
 * EDIT TASK
 */
function editTask(taskId) {
    const task = appState.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    console.log('✏️ Editing task:', task.title);
    
    // Set current editing task
    appState.currentEditingTask = task;
    
    // Populate form with task data
    elements.taskTitle.value = task.title;
    elements.taskDescription.value = task.description;
    elements.taskPriority.value = task.priority;
    elements.taskCategory.value = task.category;
    
    // Update modal title
    elements.modalTitle.textContent = 'Edit Task';
    
    // Update character counters
    updateCharCounters();
    
    // Show modal
    showModal();
    
    // Focus title field
    setTimeout(() => elements.taskTitle.focus(), 100);
}

/**
 * UPDATE EXISTING TASK
 */
function updateTask(taskId, newData) {
    const task = appState.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Update task properties
    task.title = newData.title;
    task.description = newData.description;
    task.priority = newData.priority;
    task.category = newData.category;
    task.updatedAt = new Date().toISOString();
    
    // Save to storage
    appState.saveToStorage();
    
    // Dispatch custom event
    appState.dispatchCustomEvent('task:updated', { task });
    
    console.log('✅ Task updated:', task.title);
}

/**
 * DELETE TASK
 */
function deleteTask(taskId) {
    const task = appState.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const confirmed = confirm(`Are you sure you want to delete "${task.title}"?`);
    if (confirmed) {
        appState.deleteTask(taskId);
        renderUI();
    }
}

/**
 * MOVE TASK TO NEXT STATUS
 */
function moveTaskToNextStatus(taskId) {
    const task = appState.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    let newStatus;
    switch (task.status) {
        case 'todo':
            newStatus = 'in-progress';
            break;
        case 'in-progress':
            newStatus = 'done';
            break;
        default:
            return; // Already at final status
    }
    
    appState.updateTaskStatus(taskId, newStatus);
    renderUI();
}

/**
 * MOVE TASK TO PREVIOUS STATUS
 */
function moveTaskToPrevStatus(taskId) {
    const task = appState.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    let newStatus;
    switch (task.status) {
        case 'in-progress':
            newStatus = 'todo';
            break;
        case 'done':
            newStatus = 'in-progress';
            break;
        default:
            return; // Already at first status
    }
    
    appState.updateTaskStatus(taskId, newStatus);
    renderUI();
}

// ========================================
// 11. UTILITY FUNCTIONS
// ========================================

/**
 * ESCAPE HTML to prevent XSS attacks
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * GET PRIORITY COLOR
 */
function getPriorityColor(priority) {
    switch (priority) {
        case 'high': return '#e74c3c';
        case 'medium': return '#f39c12';
        case 'low': return '#2ecc71';
        default: return '#3498db';
    }
}

/**
 * APPLY THEME
 */
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    console.log('🎨 Theme applied:', theme);
}

/**
 * SHOW NOTIFICATION - Simple toast notification
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '600',
        zIndex: '10000',
        opacity: '0',
        transform: 'translateY(-20px)',
        transition: 'all 0.3s ease'
    });
    
    // Set background color based on type
    const colors = {
        success: '#2ecc71',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// ========================================
// 12. DEMO DATA FOR TESTING
// ========================================

/**
 * ADD SAMPLE TASKS for demonstration
 * This runs only if there are no existing tasks
 */
function addSampleTasks() {
    if (appState.tasks.length === 0) {
        console.log('📝 Adding sample tasks...');
        
        const sampleTasks = [
            {
                title: 'Learn Event Bubbling',
                description: 'Understand how events propagate through the DOM tree',
                priority: 'high',
                category: 'Learning'
            },
            {
                title: 'Implement Drag & Drop',
                description: 'Master the HTML5 Drag and Drop API',
                priority: 'medium',
                category: 'Development'
            },
            {
                title: 'State Management',
                description: 'Create a centralized state management system',
                priority: 'high',
                category: 'Architecture'
            },
            {
                title: 'Add Form Validation',
                description: 'Implement real-time form validation with visual feedback',
                priority: 'low',
                category: 'UX'
            }
        ];
        
        sampleTasks.forEach(taskData => {
            appState.addTask(taskData);
        });
        
        // Move some tasks to different statuses
        if (appState.tasks.length >= 2) {
            appState.updateTaskStatus(appState.tasks[1].id, 'in-progress');
        }
        if (appState.tasks.length >= 3) {
            appState.updateTaskStatus(appState.tasks[2].id, 'done');
        }
        
        renderUI();
    }
}

// Add sample tasks after a short delay
setTimeout(addSampleTasks, 1000);

// ========================================
// 13. DEBUGGING AND DEVELOPMENT HELPERS
// ========================================

/**
 * EXPOSE DEBUGGING FUNCTIONS to window (for development)
 */
if (typeof window !== 'undefined') {
    window.kanbanDebug = {
        state: appState,
        elements: elements,
        addSampleTasks: addSampleTasks,
        renderUI: renderUI,
        showNotification: showNotification
    };
    
    console.log('🔧 Debug tools available at window.kanbanDebug');
}

/**
 * LOG APPLICATION STATISTICS
 */
function logStats() {
    const stats = appState.getStats();
    console.table(stats);
}

// Log stats every 30 seconds (for development)
setInterval(logStats, 30000);

console.log(`
🎉 KANBAN BOARD FULLY LOADED!

📚 CONCEPTS DEMONSTRATED:
✅ DOM Events: click, submit, change, input, load
✅ Event Bubbling & Capturing
✅ Drag and Drop API
✅ Event Delegation
✅ Custom Events
✅ State Management & Synchronization
✅ Local Storage Persistence
✅ Form Validation
✅ Responsive Design
✅ Accessibility Features

🎯 TRY THESE FEATURES:
- Click the event demo boxes to see bubbling/capturing
- Drag tasks between columns
- Add/edit/delete tasks
- Use keyboard shortcuts (Ctrl+N for new task, Escape to close modal)
- Toggle between light/dark themes
- Check the learning panel for detailed explanations

Happy learning! 🚀
`);
