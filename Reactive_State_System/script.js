// Debug Console Utility
const DebugConsole = (() => {
    const consoleElement = document.getElementById('debugConsole');
    
    const log = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.className = 'console-message';
        entry.innerHTML = `
            <span class="timestamp">[${timestamp}]</span>
            <span class="message ${type}">${message}</span>
        `;
        consoleElement.appendChild(entry);
        consoleElement.scrollTop = consoleElement.scrollHeight;
        
        // Limit to 100 entries
        while (consoleElement.children.length > 100) {
            consoleElement.removeChild(consoleElement.firstChild);
        }
    };
    
    const clear = () => {
        consoleElement.innerHTML = '';
    };
    
    return { log, clear };
})();

// Dependency Tracker using Closures
const DependencyTracker = (() => {
    let currentComputed = null;
    const dependencies = new Map(); // computed -> Set of dependencies
    const dependents = new Map();   // property -> Set of computeds
    
    const startTracking = (computedFn) => {
        currentComputed = computedFn;
        if (!dependencies.has(computedFn)) {
            dependencies.set(computedFn, new Set());
        }
        // Clear previous dependencies for this computed
        dependencies.get(computedFn).clear();
    };
    
    const stopTracking = () => {
        currentComputed = null;
    };
    
    const track = (target, property) => {
        if (currentComputed) {
            const key = `${target.constructor.name}.${property}`;
            dependencies.get(currentComputed).add(key);
            
            if (!dependents.has(key)) {
                dependents.set(key, new Set());
            }
            dependents.get(key).add(currentComputed);
            
            DebugConsole.log(`Dependency tracked: ${key} -> ${currentComputed.name}`, 'info');
        }
    };
    
    const trigger = (target, property) => {
        const key = `${target.constructor.name}.${property}`;
        if (dependents.has(key)) {
            dependents.get(key).forEach(computedFn => {
                DebugConsole.log(`Triggering computed: ${computedFn.name} due to ${key}`, 'warning');
                computedFn();
                performanceMetrics.computedRecalcs++;
                updatePerformanceDisplay();
            });
        }
    };
    
    const getDependencies = () => {
        const result = [];
        dependencies.forEach((deps, computed) => {
            deps.forEach(dep => {
                result.push({
                    computed: computed.name,
                    dependency: dep
                });
            });
        });
        return result;
    };
    
    return { startTracking, stopTracking, track, trigger, getDependencies };
})();

// Observer Pattern Implementation
class Observable {
    constructor() {
        this.observers = new Map(); // property -> Set of observers
    }
    
    subscribe(property, observer) {
        if (!this.observers.has(property)) {
            this.observers.set(property, new Set());
        }
        this.observers.get(property).add(observer);
        
        DebugConsole.log(`Observer subscribed to ${property}`, 'success');
        return () => this.unsubscribe(property, observer);
    }
    
    unsubscribe(property, observer) {
        if (this.observers.has(property)) {
            this.observers.get(property).delete(observer);
            DebugConsole.log(`Observer unsubscribed from ${property}`, 'info');
        }
    }
    
    notify(property, newValue, oldValue) {
        if (this.observers.has(property)) {
            this.observers.get(property).forEach(observer => {
                observer(newValue, oldValue, property);
                performanceMetrics.observerNotifications++;
            });
        }
        updatePerformanceDisplay();
    }
    
    getObservers() {
        const result = [];
        this.observers.forEach((observers, property) => {
            result.push({
                property,
                count: observers.size
            });
        });
        return result;
    }
}

// Reactive State using Proxy Pattern
class ReactiveState extends Observable {
    constructor(initialState = {}) {
        super();
        this._state = initialState;
        this._proxy = new Proxy(this, {
            get: (target, property) => {
                // If it's a method or property of the ReactiveState instance, return it
                if (property in target && typeof target[property] === 'function') {
                    return target[property].bind(target);
                }
                
                // If it's a special property, return it directly
                if (property === '_state' || property === '_proxy' || property === 'observers') {
                    return target[property];
                }
                
                // Otherwise, it's a state property - track dependency access
                DependencyTracker.track(this, property);
                
                DebugConsole.log(`Property accessed: ${property} = ${JSON.stringify(target._state[property])}`, 'info');
                return target._state[property];
            },
            
            set: (target, property, value) => {
                // If it's a method or internal property, set it directly
                if (property in target || property.startsWith('_')) {
                    target[property] = value;
                    return true;
                }
                
                // Otherwise, it's a state property
                const oldValue = target._state[property];
                
                if (oldValue !== value) {
                    target._state[property] = value;
                    
                    DebugConsole.log(`Property changed: ${property} = ${JSON.stringify(value)} (was: ${JSON.stringify(oldValue)})`, 'warning');
                    
                    // Notify observers
                    target.notify(property, value, oldValue);
                    
                    // Trigger dependent computeds
                    DependencyTracker.trigger(target, property);
                    
                    performanceMetrics.stateUpdates++;
                    updateStateDisplay();
                    updateObserversDisplay();
                    updateDependencyDisplay();
                }
                
                return true;
            }
        });
        
        return this._proxy;
    }
    
    getState() {
        return this._state;
    }
}

// Computed Properties using Closures
const createComputed = (fn, name = 'anonymous') => {
    let cachedValue;
    let isValid = false;
    
    const computedFn = () => {
        if (!isValid) {
            DependencyTracker.startTracking(computedFn);
            cachedValue = fn();
            DependencyTracker.stopTracking();
            isValid = true;
            DebugConsole.log(`Computed '${name}' recalculated: ${JSON.stringify(cachedValue)}`, 'success');
        }
        return cachedValue;
    };
    
    computedFn.invalidate = () => {
        isValid = false;
    };
    
    computedFn.name = name;
    
    return computedFn;
};

// Performance Metrics
const performanceMetrics = {
    stateUpdates: 0,
    observerNotifications: 0,
    computedRecalcs: 0
};

const updatePerformanceDisplay = () => {
    document.getElementById('stateUpdates').textContent = performanceMetrics.stateUpdates;
    document.getElementById('observerNotifications').textContent = performanceMetrics.observerNotifications;
    document.getElementById('computedRecalcs').textContent = performanceMetrics.computedRecalcs;
};

const updateStateDisplay = () => {
    const stateDisplay = document.getElementById('stateDisplay');
    const allStates = {
        counter: counterState.getState(),
        todos: todoState.getState(),
        cart: cartState.getState(),
        form: formState.getState()
    };
    stateDisplay.textContent = JSON.stringify(allStates, null, 2);
};

const updateObserversDisplay = () => {
    const observersList = document.getElementById('observersList');
    const allObservers = [
        ...counterState.getObservers(),
        ...todoState.getObservers(),
        ...cartState.getObservers(),
        ...formState.getObservers()
    ];
    
    observersList.innerHTML = allObservers.map(obs => 
        `<div class="observer-item">
            <span>${obs.property}</span>
            <span class="observer-count">${obs.count}</span>
        </div>`
    ).join('');
};

const updateDependencyDisplay = () => {
    const dependencyGraph = document.getElementById('dependencyGraph');
    const dependencies = DependencyTracker.getDependencies();
    
    dependencyGraph.innerHTML = dependencies.map(dep => 
        `<div class="dependency-item">${dep.dependency} → ${dep.computed}</div>`
    ).join('');
};

// Application States
let counterState, todoState, cartState, formState;

// Counter Demo Implementation
const initCounterDemo = () => {
    counterState = new ReactiveState({ count: 0 });
    
    // Computed properties
    const doubleCount = createComputed(() => counterState.count * 2, 'doubleCount');
    const squareCount = createComputed(() => counterState.count * counterState.count, 'squareCount');
    
    // Subscribe to updates
    counterState.subscribe('count', (newValue) => {
        document.getElementById('counterValue').textContent = newValue;
        document.getElementById('counterDouble').textContent = doubleCount();
        document.getElementById('counterSquare').textContent = squareCount();
        
        // Invalidate computeds when count changes
        doubleCount.invalidate();
        squareCount.invalidate();
    });
    
    // Event listeners
    document.getElementById('incrementBtn').addEventListener('click', () => {
        counterState.count++;
    });
    
    document.getElementById('decrementBtn').addEventListener('click', () => {
        counterState.count--;
    });
    
    document.getElementById('resetBtn').addEventListener('click', () => {
        counterState.count = 0;
    });
    
    // Initialize display
    document.getElementById('counterValue').textContent = counterState.count;
    document.getElementById('counterDouble').textContent = doubleCount();
    document.getElementById('counterSquare').textContent = squareCount();
};

// Todo List Demo Implementation
const initTodoDemo = () => {
    todoState = new ReactiveState({ 
        todos: [],
        filter: 'all'
    });
    
    // Computed properties
    const totalTodos = createComputed(() => todoState.todos.length, 'totalTodos');
    const completedTodos = createComputed(() => 
        todoState.todos.filter(todo => todo.completed).length, 'completedTodos'
    );
    const remainingTodos = createComputed(() => 
        todoState.todos.filter(todo => !todo.completed).length, 'remainingTodos'
    );
    
    const updateTodoStats = () => {
        document.getElementById('totalTodos').textContent = totalTodos();
        document.getElementById('completedTodos').textContent = completedTodos();
        document.getElementById('remainingTodos').textContent = remainingTodos();
        
        // Invalidate computeds
        totalTodos.invalidate();
        completedTodos.invalidate();
        remainingTodos.invalidate();
    };
    
    const renderTodos = () => {
        const todoList = document.getElementById('todoList');
        todoList.innerHTML = todoState.todos.map((todo, index) => 
            `<li class="todo-item ${todo.completed ? 'completed' : ''}">
                <input type="checkbox" ${todo.completed ? 'checked' : ''} 
                       onchange="toggleTodo(${index})">
                <span>${todo.text}</span>
                <button onclick="deleteTodo(${index})" class="btn btn-small btn-danger">Delete</button>
            </li>`
        ).join('');
        updateTodoStats();
    };
    
    // Global functions for todo operations
    window.toggleTodo = (index) => {
        const todos = [...todoState.todos];
        todos[index].completed = !todos[index].completed;
        todoState.todos = todos;
    };
    
    window.deleteTodo = (index) => {
        const todos = [...todoState.todos];
        todos.splice(index, 1);
        todoState.todos = todos;
    };
    
    // Subscribe to todos changes
    todoState.subscribe('todos', renderTodos);
    
    // Event listeners
    document.getElementById('addTodoBtn').addEventListener('click', () => {
        const input = document.getElementById('todoInput');
        const text = input.value.trim();
        if (text) {
            const todos = [...todoState.todos];
            todos.push({ 
                id: Date.now(), 
                text, 
                completed: false 
            });
            todoState.todos = todos;
            input.value = '';
        }
    });
    
    document.getElementById('todoInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('addTodoBtn').click();
        }
    });
    
    document.getElementById('clearCompletedBtn').addEventListener('click', () => {
        todoState.todos = todoState.todos.filter(todo => !todo.completed);
    });
    
    document.getElementById('toggleAllBtn').addEventListener('click', () => {
        const allCompleted = todoState.todos.every(todo => todo.completed);
        todoState.todos = todoState.todos.map(todo => ({
            ...todo,
            completed: !allCompleted
        }));
    });
    
    // Initialize
    updateTodoStats();
};

// Shopping Cart Demo Implementation
const initCartDemo = () => {
    cartState = new ReactiveState({ 
        items: [],
        taxRate: 0.1
    });
    
    // Computed properties
    const itemCount = createComputed(() => 
        cartState.items.reduce((sum, item) => sum + item.quantity, 0), 'itemCount'
    );
    
    const subtotal = createComputed(() => 
        cartState.items.reduce((sum, item) => sum + (item.price * item.quantity), 0), 'subtotal'
    );
    
    const tax = createComputed(() => subtotal() * cartState.taxRate, 'tax');
    const total = createComputed(() => subtotal() + tax(), 'total');
    
    const updateCartDisplay = () => {
        // Render cart items
        const cartItems = document.getElementById('cartItems');
        cartItems.innerHTML = cartState.items.map((item, index) => 
            `<div class="cart-item">
                <span>${item.name} x${item.quantity}</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>`
        ).join('');
        
        // Update totals
        document.getElementById('cartItemCount').textContent = itemCount();
        document.getElementById('cartSubtotal').textContent = subtotal().toFixed(2);
        document.getElementById('cartTax').textContent = tax().toFixed(2);
        document.getElementById('cartTotal').textContent = total().toFixed(2);
        
        // Invalidate computeds
        itemCount.invalidate();
        subtotal.invalidate();
        tax.invalidate();
        total.invalidate();
    };
    
    // Subscribe to cart changes
    cartState.subscribe('items', updateCartDisplay);
    
    // Add to cart functionality
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const { id, name, price } = e.target.dataset;
            const items = [...cartState.items];
            const existingItem = items.find(item => item.id === id);
            
            if (existingItem) {
                existingItem.quantity++;
            } else {
                items.push({
                    id,
                    name,
                    price: parseFloat(price),
                    quantity: 1
                });
            }
            
            cartState.items = items;
        });
    });
    
    document.getElementById('clearCartBtn').addEventListener('click', () => {
        cartState.items = [];
    });
    
    // Initialize
    updateCartDisplay();
};

// Form Validation Demo Implementation
const initFormDemo = () => {
    formState = new ReactiveState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        errors: {}
    });
    
    // Validation rules
    const validators = {
        username: (value) => {
            if (!value) return 'Username is required';
            if (value.length < 3) return 'Username must be at least 3 characters';
            return null;
        },
        email: (value) => {
            if (!value) return 'Email is required';
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) return 'Invalid email format';
            return null;
        },
        password: (value) => {
            if (!value) return 'Password is required';
            if (value.length < 6) return 'Password must be at least 6 characters';
            return null;
        },
        confirmPassword: (value) => {
            if (!value) return 'Please confirm your password';
            if (value !== formState.password) return 'Passwords do not match';
            return null;
        }
    };
    
    // Computed property for form validity
    const isFormValid = createComputed(() => {
        const errors = formState.errors;
        return Object.keys(errors).every(key => !errors[key]) &&
               formState.username && formState.email && 
               formState.password && formState.confirmPassword;
    }, 'isFormValid');
    
    const validateField = (field, value) => {
        const error = validators[field] ? validators[field](value) : null;
        const errors = { ...formState.errors };
        errors[field] = error;
        formState.errors = errors;
        
        // Update UI
        const input = document.getElementById(field);
        const errorElement = document.getElementById(`${field}Error`);
        
        input.classList.toggle('invalid', !!error);
        input.classList.toggle('valid', !error && value);
        errorElement.textContent = error || '';
        
        // Update form validity
        const valid = isFormValid();
        document.getElementById('formValid').textContent = valid;
        document.getElementById('formValid').className = `status-indicator ${valid}`;
        document.getElementById('submitBtn').disabled = !valid;
        
        isFormValid.invalidate();
    };
    
    // Set up field listeners
    ['username', 'email', 'password', 'confirmPassword'].forEach(field => {
        const input = document.getElementById(field);
        
        input.addEventListener('input', (e) => {
            formState[field] = e.target.value;
            validateField(field, e.target.value);
        });
        
        formState.subscribe(field, (value) => {
            validateField(field, value);
        });
    });
    
    document.getElementById('reactiveForm').addEventListener('submit', (e) => {
        e.preventDefault();
        if (isFormValid()) {
            DebugConsole.log('Form submitted successfully!', 'success');
            alert('Form submitted successfully!');
        }
    });
    
    // Initialize
    validateField('username', '');
    validateField('email', '');
    validateField('password', '');
    validateField('confirmPassword', '');
};

// Pattern Demonstration Functions
const demonstrateProxy = () => {
    const proxyExample = document.getElementById('proxyExample');
    
    // Create a simple object with proxy
    const target = { name: 'John', age: 30 };
    const proxy = new Proxy(target, {
        get(target, property) {
            const value = target[property];
            proxyExample.textContent += `GET: ${property} = ${value}\n`;
            return value;
        },
        set(target, property, value) {
            const oldValue = target[property];
            target[property] = value;
            proxyExample.textContent += `SET: ${property} = ${value} (was: ${oldValue})\n`;
            return true;
        }
    });
    
    // Demonstrate proxy operations
    setTimeout(() => {
        proxy.name; // GET operation
        proxy.age;  // GET operation
        proxy.name = 'Jane'; // SET operation
        proxy.age = 25; // SET operation
        proxy.city = 'New York'; // SET new property
    }, 100);
};

const demonstrateObserver = () => {
    const observerLog = document.getElementById('observerLog');
    observerLog.innerHTML = '';
    
    const observable = new Observable();
    
    // Create observers
    const observer1 = (value) => {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `
            <span class="log-timestamp">${new Date().toLocaleTimeString()}</span>
            <span class="log-message">Observer 1: received ${value}</span>
        `;
        observerLog.appendChild(entry);
    };
    
    const observer2 = (value) => {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `
            <span class="log-timestamp">${new Date().toLocaleTimeString()}</span>
            <span class="log-message">Observer 2: received ${value}</span>
        `;
        observerLog.appendChild(entry);
    };
    
    // Subscribe observers
    observable.subscribe('test', observer1);
    observable.subscribe('test', observer2);
    
    // Trigger notifications
    setTimeout(() => observable.notify('test', 'Hello'), 100);
    setTimeout(() => observable.notify('test', 'World'), 200);
    setTimeout(() => observable.notify('test', 'Done'), 300);
};

const demonstrateDependencies = () => {
    const dependencyViz = document.getElementById('dependencyViz');
    dependencyViz.innerHTML = '';
    
    // Create a simple reactive system
    const state = new ReactiveState({ a: 1, b: 2 });
    
    const computed1 = createComputed(() => state.a + state.b, 'sum');
    const computed2 = createComputed(() => computed1() * 2, 'doubleSum');
    
    // Trigger computeds to establish dependencies
    computed1();
    computed2();
    
    // Display dependencies
    const deps = DependencyTracker.getDependencies();
    deps.forEach(dep => {
        const arrow = document.createElement('div');
        arrow.className = 'dependency-arrow';
        arrow.textContent = `${dep.dependency} → ${dep.computed}`;
        dependencyViz.appendChild(arrow);
    });
};

const demonstrateClosures = () => {
    const closureDemo = document.getElementById('closureDemo');
    
    // Closure example: private counter
    const createCounter = () => {
        let count = 0; // Private variable
        
        return {
            increment: () => ++count,
            decrement: () => --count,
            getValue: () => count
        };
    };
    
    const counter1 = createCounter();
    const counter2 = createCounter();
    
    closureDemo.innerHTML = `
// Two independent counters with private state:
Counter 1: ${counter1.getValue()} → ${counter1.increment()} → ${counter1.increment()}
Counter 2: ${counter2.getValue()} → ${counter2.increment()}

// Each closure maintains its own private 'count' variable
Final values: Counter 1 = ${counter1.getValue()}, Counter 2 = ${counter2.getValue()}
    `;
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    DebugConsole.log('Reactive State System initialized', 'success');
    
    // Initialize all demos
    initCounterDemo();
    initTodoDemo();
    initCartDemo();
    initFormDemo();
    
    // Initialize displays
    updateStateDisplay();
    updateObserversDisplay();
    updateDependencyDisplay();
    updatePerformanceDisplay();
    
    // Pattern demonstration buttons
    document.getElementById('testProxyBtn').addEventListener('click', demonstrateProxy);
    document.getElementById('testObserverBtn').addEventListener('click', demonstrateObserver);
    document.getElementById('testDependencyBtn').addEventListener('click', demonstrateDependencies);
    document.getElementById('testClosureBtn').addEventListener('click', demonstrateClosures);
    
    // Clear console button
    document.getElementById('clearConsoleBtn').addEventListener('click', () => {
        DebugConsole.clear();
        DebugConsole.log('Console cleared', 'info');
    });
    
    DebugConsole.log('All demos initialized successfully', 'success');
});
