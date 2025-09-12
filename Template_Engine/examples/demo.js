import { TemplateEngine } from '../src/index.js';

/**
 * Demo script showcasing Template Engine capabilities
 * Demonstrates Regex Parsing, Tokenization, AST, and Scope Handling
 */
async function runDemo() {
    console.log('🎯 Template Engine Demo');
    console.log('========================\n');

    // Create template engine instance
    const engine = new TemplateEngine({
        autoEscape: true,
        cacheTemplates: true,
        preserveWhitespace: false
    });

    console.log('📋 Demo 1: Basic Variable Interpolation');
    console.log('----------------------------------------');
    
    const basicTemplate = `
Hello \{{ name }}!
Your age is \{{ age }} and you are \{{ status }}.
Today is \{{ today | date:'YYYY-MM-DD' }}.
    `.trim();

    const basicContext = {
        name: 'Alice',
        age: 25,
        status: 'awesome',
        today: new Date()
    };

    try {
        const result1 = engine.render(basicTemplate, basicContext);
        console.log('Template:', basicTemplate);
        console.log('Context:', basicContext);
        console.log('Result:', result1);
    } catch (error) {
        console.error('Error:', error.message);
    }

    console.log('\n📋 Demo 2: Conditional Rendering');
    console.log('----------------------------------');
    
    const conditionalTemplate = `
{% if user.isAdmin %}
    Welcome, Administrator \{{ user.name }}!
    You have \{{ user.permissions.length }} permissions.
{% elseif user.isUser %}
    Hello \{{ user.name }}, you are a regular user.
{% else %}
    Welcome, Guest!
{% endif %}

{% if user.notifications > 0 %}
    You have \{{ user.notifications }} new notifications.
{% endif %}
    `.trim();

    const adminContext = {
        user: {
            name: 'Bob',
            isAdmin: true,
            isUser: false,
            permissions: ['read', 'write', 'delete'],
            notifications: 3
        }
    };

    const userContext = {
        user: {
            name: 'Carol',
            isAdmin: false,
            isUser: true,
            notifications: 1
        }
    };

    try {
        console.log('Admin Context Result:');
        console.log(engine.render(conditionalTemplate, adminContext));
        
        console.log('\nUser Context Result:');
        console.log(engine.render(conditionalTemplate, userContext));
    } catch (error) {
        console.error('Error:', error.message);
    }

    console.log('\n📋 Demo 3: Loop Rendering');
    console.log('--------------------------');
    
    const loopTemplate = `
<h2>Shopping Cart</h2>
<ul>
{% for item in cart %}
    <li>\{{ loop.index }}. \{{ item.name }} - $\{{ item.price | currency }} (x\{{ item.quantity }})</li>
    {% if loop.first %}<em>First item!</em>{% endif %}
    {% if loop.last %}<em>Last item!</em>{% endif %}
{% endfor %}
</ul>

<p>Total items: \{{ cart | len }}</p>
<p>Total cost: $\{{ totalCost | currency }}</p>
    `.trim();

    const cartContext = {
        cart: [
            { name: 'Laptop', price: 999.99, quantity: 1 },
            { name: 'Mouse', price: 29.99, quantity: 2 },
            { name: 'Keyboard', price: 79.99, quantity: 1 }
        ],
        totalCost: 1139.96
    };

    try {
        const result3 = engine.render(loopTemplate, cartContext);
        console.log('Result:');
        console.log(result3);
    } catch (error) {
        console.error('Error:', error.message);
    }

    console.log('\n📋 Demo 4: Custom Filters and Functions');
    console.log('----------------------------------------');
    
    // Register custom filter
    engine.registerFilter('highlight', (text, color = 'yellow') => {
        return `<mark style="background-color: ${color}">${text}</mark>`;
    });

    // Register custom function
    engine.registerFunction('fibonacci', (n) => {
        if (n <= 1) return n;
        let a = 0, b = 1;
        for (let i = 2; i <= n; i++) {
            [a, b] = [b, a + b];
        }
        return b;
    });

    const customTemplate = `
<h3>\{{ title | highlight:'lightblue' }}</h3>
<p>The \{{ n }}th Fibonacci number is: \{{ fibonacci(n) }}</p>
<p>Random number: \{{ random(1, 100) | round:0 }}</p>
<p>Current time: \{{ now() | date:'YYYY-MM-DD HH:mm:ss' }}</p>
    `.trim();

    const customContext = {
        title: 'Custom Functions Demo',
        n: 10
    };

    try {
        const result4 = engine.render(customTemplate, customContext);
        console.log('Result:');
        console.log(result4);
    } catch (error) {
        console.error('Error:', error.message);
    }

    console.log('\n📋 Demo 5: Complex Data Structures');
    console.log('-----------------------------------');
    
    const complexTemplate = `
<h2>\{{ company.name }}</h2>
<p>Founded: \{{ company.founded }}</p>

<h3>Departments:</h3>
{% for dept in company.departments %}
<div>
    <h4>\{{ dept.name }} (\{{ dept.employees | len }} employees)</h4>
    <ul>
    {% for emp in dept.employees %}
        <li>\{{ emp.name }} - \{{ emp.position }}
            {% if emp.skills %}
                <br>Skills: \{{ emp.skills | join:', ' }}
            {% endif %}
        </li>
    {% endfor %}
    </ul>
</div>
{% endfor %}

<h3>Company Stats:</h3>
<ul>
    <li>Total Departments: \{{ company.departments | len }}</li>
    <li>Total Employees: \{{ totalEmployees }}</li>
    <li>Average Department Size: \{{ avgDeptSize | round:1 }}</li>
</ul>
    `.trim();

    const complexContext = {
        company: {
            name: 'Tech Innovations Inc.',
            founded: 2015,
            departments: [
                {
                    name: 'Engineering',
                    employees: [
                        { name: 'Alice Johnson', position: 'Senior Developer', skills: ['JavaScript', 'Python', 'React'] },
                        { name: 'Bob Smith', position: 'DevOps Engineer', skills: ['Docker', 'Kubernetes', 'AWS'] }
                    ]
                },
                {
                    name: 'Design',
                    employees: [
                        { name: 'Carol Davis', position: 'UI/UX Designer', skills: ['Figma', 'Sketch', 'Prototyping'] }
                    ]
                },
                {
                    name: 'Marketing',
                    employees: [
                        { name: 'David Wilson', position: 'Marketing Manager', skills: ['SEO', 'Content Marketing'] },
                        { name: 'Eve Brown', position: 'Social Media Specialist', skills: ['Instagram', 'Twitter', 'LinkedIn'] }
                    ]
                }
            ]
        },
        totalEmployees: 5,
        avgDeptSize: 1.67
    };

    try {
        const result5 = engine.render(complexTemplate, complexContext);
        console.log('Result:');
        console.log(result5);
    } catch (error) {
        console.error('Error:', error.message);
    }

    console.log('\n📋 Demo 6: Template Analysis');
    console.log('-----------------------------');
    
    const analysisTemplate = `
<h1>\{{ title | upper }}</h1>
{% if showContent %}
    {% for item in items %}
        <p>\{{ item.name }}: \{{ item.value | currency }}</p>
    {% endfor %}
{% endif %}
\{{ unknownVar }}
    `.trim();

    try {
        const analysis = engine.analyze(analysisTemplate);
        console.log('Template Analysis:');
        console.log('- Valid:', analysis.summary.isValid);
        console.log('- Total Tokens:', analysis.summary.totalTokens);
        console.log('- Total AST Nodes:', analysis.summary.totalNodes);
        console.log('- Variables Found:', analysis.summary.variables);
        console.log('- Functions Found:', analysis.summary.functions);
        console.log('- Blocks Found:', analysis.summary.blocks);
        
        if (analysis.validation.syntax.errors.length > 0) {
            console.log('- Syntax Errors:', analysis.validation.syntax.errors);
        }
        
        if (analysis.validation.ast.warnings.length > 0) {
            console.log('- AST Warnings:', analysis.validation.ast.warnings);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }

    console.log('\n📋 Demo 7: Debug Mode');
    console.log('---------------------');
    
    const debugTemplate = `Hello \{{ name | upper }}!`;
    
    try {
        const debugInfo = engine.debug(debugTemplate);
        console.log('Debug Steps Completed:');
        console.log('- Regex Parsing:', !!debugInfo.steps.regexParsing);
        console.log('- Tokenization:', !!debugInfo.steps.tokenization);
        console.log('- AST Building:', !!debugInfo.steps.astBuilding);
        console.log('- Code Generation:', !!debugInfo.steps.codeGeneration);
        console.log('- Scope Analysis:', !!debugInfo.steps.scopeAnalysis);
        
        if (debugInfo.error) {
            console.log('- Error:', debugInfo.error.message);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }

    console.log('\n📋 Demo 8: Performance & Caching');
    console.log('---------------------------------');
    
    const perfTemplate = `
<h2>\{{ title }}</h2>
{% for i in range(1, count) %}
    <p>Item \{{ i }}: \{{ random(1, 1000) | round:0 }}</p>
{% endfor %}
    `.trim();

    const perfContext = {
        title: 'Performance Test',
        count: 5
    };

    try {
        // First render (compilation)
        const start1 = Date.now();
        engine.render(perfTemplate, perfContext, 'perf-template');
        const time1 = Date.now() - start1;
        
        // Second render (cached)
        const start2 = Date.now();
        engine.render(perfTemplate, perfContext, 'perf-template');
        const time2 = Date.now() - start2;
        
        console.log(`First render (with compilation): ${time1}ms`);
        console.log(`Second render (cached): ${time2}ms`);
        console.log(`Cache speedup: ${(time1 / time2).toFixed(1)}x`);
        
        // Cache stats
        const cacheStats = engine.getCacheStats();
        console.log('Cache Stats:', cacheStats);
        
    } catch (error) {
        console.error('Error:', error.message);
    }

    console.log('\n🎉 Demo completed successfully!');
    console.log('\n💡 Key Concepts Demonstrated:');
    console.log('   ✅ Regex Parsing - Template syntax recognition');
    console.log('   ✅ Tokenization - Converting templates to tokens');
    console.log('   ✅ Abstract Syntax Tree - Structured representation');
    console.log('   ✅ Scope Handling - Variable and function resolution');
    console.log('   ✅ Advanced Features - Loops, conditionals, filters');
    console.log('   ✅ Error Handling - Validation and debugging');
    console.log('   ✅ Performance - Caching and optimization');
}

// Run demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runDemo().catch(console.error);
}

export { runDemo };
