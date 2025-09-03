# Dynamic Form Builder

A comprehensive form builder demonstrating advanced JavaScript concepts including config-driven UI, JSON Schema generation, dynamic DOM rendering, deep cloning, and object mutation tracking.

## Features Demonstrated

### 🧩 **Form-Based Components**
- Modular component architecture with base classes
- Specialized components (Select, Radio, Textarea)
- Component factory pattern for dynamic creation
- Inheritance and polymorphism in JavaScript

### ⚙️ **Config-Driven UI**
- JSON-based form configuration
- Dynamic component rendering from configuration
- Template system for quick form creation
- Declarative UI definition

### 📋 **JSON Schema Generation**
- Automatic schema generation from form components
- JSON Schema Draft-07 compliance
- Type mapping and validation rules
- Export functionality for integration

### 🎨 **Dynamic DOM Rendering**
- Virtual DOM-like diffing algorithm
- Efficient DOM updates and reconciliation
- Component lifecycle management
- Real-time UI updates

### 🔄 **Deep Cloning**
- Immutable state management
- Recursive object cloning utility
- Handling of complex data types (Date, Array, Object)
- Prevention of reference mutations

### 📊 **Object Mutation Tracking**
- Real-time mutation logging system
- Action tracking with timestamps
- State change history
- Performance monitoring

## Key Concepts Implemented

### **Component Architecture**
```javascript
class FormComponent {
    constructor(type, config = {}) {
        this.id = config.id || `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.type = type;
        // ... component properties
    }
    
    render() {
        return `<div class="form-component" data-id="${this.id}">
            ${this.renderField()}
        </div>`;
    }
}
```

### **Deep Cloning Implementation**
```javascript
class DeepClone {
    static clone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => DeepClone.clone(item));
        // ... recursive cloning logic
    }
}
```

### **Mutation Tracking**
```javascript
class MutationTracker {
    track(action, target, details = {}) {
        const mutation = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            action,
            target,
            details: DeepClone.clone(details)
        };
        this.mutations.push(mutation);
    }
}
```

### **Virtual DOM Rendering**
```javascript
class UIRenderer {
    diff(oldVDOM, newVDOM) {
        // Simple diffing algorithm
        // Remove deleted components
        // Add or update components
        // Efficient DOM manipulation
    }
}
```

## Component Types

- **Text Input**: Basic text fields with validation
- **Email**: Email validation and formatting
- **Number**: Numeric inputs with min/max constraints
- **Select**: Dropdown with configurable options
- **Radio**: Radio button groups
- **Checkbox**: Boolean toggle inputs
- **Textarea**: Multi-line text input
- **Date**: Date picker inputs
- **File**: File upload components

## Templates

### **Contact Form**
- Full Name (required)
- Email Address (required)
- Phone Number
- Message (required)

### **Survey Form**
- Satisfaction rating (radio)
- Age group (select)
- Additional comments (textarea)

### **Registration Form**
- First/Last Name (required)
- Email (required)
- Date of Birth
- Terms acceptance (checkbox)

### **Feedback Form**
- Name
- Rating (select)
- Feedback (required textarea)

## Real-time Features

### **Live Updates**
- Instant property changes
- Real-time schema generation
- Dynamic form data updates
- Mutation logging

### **Interactive Designer**
- Drag-and-drop component placement
- Visual component selection
- Properties panel editing
- Component deletion and reordering

### **Export Capabilities**
- JSON Schema export
- Form configuration export
- Form data extraction
- Mutations log export

## Technical Implementation

### **JSON Schema Generation**
```javascript
static generateSchema(formConfig) {
    const schema = {
        $schema: "http://json-schema.org/draft-07/schema#",
        type: "object",
        properties: {},
        required: []
    };
    
    formConfig.components.forEach(component => {
        schema.properties[component.name] = this.componentToSchemaProperty(component);
        if (component.required) schema.required.push(component.name);
    });
    
    return schema;
}
```

### **Config-Driven Rendering**
```javascript
render(components) {
    const newVirtualDOM = components.map(component => ({
        id: component.id,
        type: component.type,
        html: component.render(),
        component: component
    }));
    
    this.diff(this.virtualDOM, newVirtualDOM);
    this.virtualDOM = newVirtualDOM;
}
```

## Usage

1. **Design Mode**: Drag components from palette to canvas
2. **Component Selection**: Click components to edit properties
3. **Property Editing**: Use properties panel to configure components
4. **Template Loading**: Quick-start with predefined templates
5. **Schema Export**: Generate JSON Schema for validation
6. **Mutation Tracking**: Monitor all state changes in real-time

## Browser Support

- Modern browsers with ES6+ support
- Drag and Drop API support
- JSON Schema validation compatible
- Responsive design for mobile devices

## Performance Features

- Virtual DOM diffing for efficient updates
- Deep cloning for immutable state
- Mutation tracking for debugging
- Lazy rendering for large forms
- Memory-efficient component management

## Testing the Application

1. Open `index.html` in a web browser
2. Drag components from the left panel to the canvas
3. Click components to select and edit properties
4. Watch real-time updates in the output panels
5. Try loading templates for quick form creation
6. Monitor mutations in the tracking log
7. Export schemas for external use
