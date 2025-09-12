import { TemplateEngine } from '../src/index.js';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Advanced Template Engine Demo
 * Showcases real-world template usage with file-based templates
 */
async function runAdvancedDemo() {
    console.log('🚀 Advanced Template Engine Demo');
    console.log('=================================\n');

    const engine = new TemplateEngine({
        autoEscape: true,
        cacheTemplates: true,
        preserveWhitespace: false
    });

    // Register custom filters for demo
    engine.registerFilter('currency', (value, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(value);
    });

    engine.registerFilter('truncate', (text, length = 100) => {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    });

    engine.registerFilter('capitalize', (text) => {
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    });

    // Register custom functions
    engine.registerFunction('range', (start, end) => {
        const result = [];
        for (let i = start; i <= end; i++) {
            result.push(i);
        }
        return result;
    });

    engine.registerFunction('random', (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    });

    console.log('📧 Demo 1: Email Templates');
    console.log('---------------------------');

    try {
        const emailTemplate = await readFile(join(__dirname, 'templates', 'email.html'), 'utf-8');

        // Welcome Email
        const welcomeContext = {
            emailType: 'welcome',
            subject: 'Welcome to TechCorp!',
            company: {
                name: 'TechCorp Solutions',
                address: '123 Innovation Drive, Tech City, TC 12345'
            },
            recipient: {
                name: 'John Doe',
                email: 'john.doe@example.com'
            },
            welcomeBenefits: [
                '24/7 Customer Support',
                'Free Premium Features for 30 days',
                'Access to Exclusive Content',
                'Priority Technical Support'
            ],
            links: {
                getStarted: 'https://techcorp.com/get-started',
                unsubscribe: 'https://techcorp.com/unsubscribe',
                preferences: 'https://techcorp.com/preferences'
            },
            socialLinks: [
                { name: 'Twitter', url: 'https://twitter.com/techcorp' },
                { name: 'LinkedIn', url: 'https://linkedin.com/company/techcorp' },
                { name: 'Facebook', url: 'https://facebook.com/techcorp' }
            ]
        };

        const welcomeEmail = engine.render(emailTemplate, welcomeContext);
        console.log('✅ Welcome email generated successfully');
        console.log(`📄 Length: ${welcomeEmail.length} characters\n`);

        // Order Confirmation Email
        const orderContext = {
            emailType: 'order_confirmation',
            subject: 'Order Confirmation #12345',
            company: {
                name: 'TechStore',
                address: '456 Commerce St, Shopping City, SC 67890'
            },
            recipient: {
                name: 'Jane Smith',
                email: 'jane.smith@example.com'
            },
            order: {
                id: '12345',
                date: new Date('2024-01-15'),
                total: 1299.97,
                estimatedDelivery: new Date('2024-01-22'),
                items: [
                    { name: 'Wireless Headphones Pro', quantity: 1, price: 299.99 },
                    { name: 'Smartphone Case Premium', quantity: 2, price: 49.99 },
                    { name: 'Portable Charger 20000mAh', quantity: 1, price: 89.99 }
                ]
            },
            links: {
                trackOrder: 'https://techstore.com/track/12345',
                unsubscribe: 'https://techstore.com/unsubscribe'
            }
        };

        const orderEmail = engine.render(emailTemplate, orderContext);
        console.log('✅ Order confirmation email generated successfully');
        console.log(`📄 Length: ${orderEmail.length} characters\n`);

        // Promotional Email
        const promoContext = {
            emailType: 'promotion',
            subject: 'Flash Sale - 50% Off Everything!',
            company: {
                name: 'MegaStore',
                address: '789 Retail Blvd, Sale City, SC 11111'
            },
            recipient: {
                name: 'Alex Johnson',
                email: 'alex.johnson@example.com'
            },
            promotion: {
                description: 'Our biggest sale of the year is here! Get 50% off on all items.',
                discount: 50,
                code: 'FLASH50',
                expires: new Date('2024-02-01')
            },
            promotion: {
                description: 'Flash Sale - Limited Time Only!',
                discount: 50,
                code: 'FLASH50',
                expires: new Date('2024-02-01'),
                products: [
                    { name: 'Gaming Laptop', originalPrice: 1999.99, salePrice: 999.99 },
                    { name: 'Wireless Mouse', originalPrice: 79.99, salePrice: 39.99 },
                    { name: 'Mechanical Keyboard', originalPrice: 149.99, salePrice: 74.99 }
                ]
            },
            links: {
                shop: 'https://megastore.com/sale',
                unsubscribe: 'https://megastore.com/unsubscribe'
            }
        };

        const promoEmail = engine.render(emailTemplate, promoContext);
        console.log('✅ Promotional email generated successfully');
        console.log(`📄 Length: ${promoEmail.length} characters\n`);

    } catch (error) {
        console.error('❌ Email template error:', error.message);
    }

    console.log('📊 Demo 2: Dashboard Templates');
    console.log('-------------------------------');

    try {
        const dashboardTemplate = await readFile(join(__dirname, 'templates', 'dashboard.html'), 'utf-8');

        const dashboardContext = {
            pageTitle: 'Analytics Dashboard',
            user: {
                name: 'Sarah Wilson',
                role: 'admin'
            },
            statistics: [
                { label: 'Total Revenue', value: 125000, currency: 'USD', change: 12.5 },
                { label: 'Active Users', value: 8542, change: -2.1 },
                { label: 'Conversion Rate', value: 3.2, change: 0.8 },
                { label: 'Support Tickets', value: 23, change: -15.3 }
            ],
            chartData: [
                { label: 'Sales Performance', value: 85 },
                { label: 'Customer Satisfaction', value: 92 },
                { label: 'System Uptime', value: 99.8 },
                { label: 'Response Time', value: 78 }
            ],
            tableData: [
                { id: 1001, name: 'Project Alpha', status: 'active', created: new Date('2024-01-10'), progress: 75 },
                { id: 1002, name: 'Project Beta', status: 'inactive', created: new Date('2024-01-08'), progress: 45 },
                { id: 1003, name: 'Project Gamma', status: 'active', created: new Date('2024-01-12'), progress: 90 },
                { id: 1004, name: 'Project Delta', status: 'active', created: new Date('2024-01-15'), progress: 30 }
            ],
            activities: [
                {
                    title: 'New user registration',
                    description: 'John Doe signed up for premium account',
                    timestamp: new Date('2024-01-16T10:30:00')
                },
                {
                    title: 'System maintenance completed',
                    description: 'Database optimization and security updates applied',
                    timestamp: new Date('2024-01-16T09:15:00')
                },
                {
                    title: 'Payment processed',
                    description: 'Invoice #INV-2024-001 paid by Acme Corp',
                    timestamp: new Date('2024-01-16T08:45:00')
                }
            ]
        };

        const dashboard = engine.render(dashboardTemplate, dashboardContext);
        console.log('✅ Dashboard generated successfully');
        console.log(`📄 Length: ${dashboard.length} characters\n`);

    } catch (error) {
        console.error('❌ Dashboard template error:', error.message);
    }

    console.log('📝 Demo 3: Blog Templates');
    console.log('--------------------------');

    try {
        const basicTemplate = await readFile(join(__dirname, 'templates', 'basic.html'), 'utf-8');

        const blogContext = {
            title: 'Tech Insights Blog',
            siteName: 'TechInsights',
            user: {
                name: 'Michael Chen',
                isLoggedIn: true,
                lastLogin: new Date('2024-01-16T07:30:00')
            },
            posts: [
                {
                    title: 'The Future of Web Development',
                    author: 'Sarah Johnson',
                    date: new Date('2024-01-15'),
                    excerpt: 'Exploring the latest trends in web development including AI integration, serverless architecture, and progressive web apps. This comprehensive guide covers everything you need to know about the evolving landscape of modern web development.',
                    tags: ['Web Development', 'AI', 'Serverless', 'PWA']
                },
                {
                    title: 'Understanding Machine Learning Basics',
                    author: 'David Rodriguez',
                    date: new Date('2024-01-12'),
                    excerpt: 'A beginner-friendly introduction to machine learning concepts, algorithms, and practical applications in today\'s technology landscape.',
                    tags: ['Machine Learning', 'AI', 'Data Science']
                },
                {
                    title: 'Cloud Computing Best Practices',
                    author: 'Emily Zhang',
                    date: new Date('2024-01-10'),
                    excerpt: 'Learn about cloud architecture patterns, security considerations, and cost optimization strategies for modern cloud deployments.',
                    tags: ['Cloud Computing', 'AWS', 'Security', 'DevOps']
                }
            ]
        };

        const blog = engine.render(basicTemplate, blogContext);
        console.log('✅ Blog template generated successfully');
        console.log(`📄 Length: ${blog.length} characters\n`);

    } catch (error) {
        console.error('❌ Blog template error:', error.message);
    }

    console.log('🔧 Demo 4: Template Performance Analysis');
    console.log('------------------------------------------');

    const performanceTemplate = `
<h1>{{ title }}</h1>
{% for i in range(1, itemCount) %}
    <div class="item-{{ i }}">
        <h3>Item {{ i }}: {{ items[i-1].name | default:'Unknown' }}</h3>
        <p>Price: {{ items[i-1].price | currency }}</p>
        {% if items[i-1].discount %}
            <p>Discount: {{ items[i-1].discount }}%</p>
            <p>Sale Price: {{ (items[i-1].price * (1 - items[i-1].discount / 100)) | currency }}</p>
        {% endif %}
        <p>Category: {{ items[i-1].category | capitalize }}</p>
    </div>
{% endfor %}
    `.trim();

    const performanceContext = {
        title: 'Product Catalog',
        itemCount: 100,
        items: Array.from({ length: 100 }, (_, i) => ({
            name: `Product ${i + 1}`,
            price: Math.random() * 1000 + 10,
            discount: Math.random() > 0.7 ? Math.floor(Math.random() * 50) + 10 : null,
            category: ['electronics', 'clothing', 'books', 'home'][Math.floor(Math.random() * 4)]
        }))
    };

    try {
        // Performance test
        const iterations = 10;
        const times = [];

        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            engine.render(performanceTemplate, performanceContext, `perf-test-${i}`);
            const end = performance.now();
            times.push(end - start);
        }

        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);

        console.log(`✅ Performance test completed (${iterations} iterations)`);
        console.log(`📊 Average render time: ${avgTime.toFixed(2)}ms`);
        console.log(`📊 Min render time: ${minTime.toFixed(2)}ms`);
        console.log(`📊 Max render time: ${maxTime.toFixed(2)}ms`);
        console.log(`📊 Template size: ${performanceTemplate.length} characters`);
        console.log(`📊 Context items: ${performanceContext.items.length}`);

        // Cache performance
        const cacheStats = engine.getCacheStats();
        console.log(`📊 Cache stats:`, cacheStats);

    } catch (error) {
        console.error('❌ Performance test error:', error.message);
    }

    console.log('\n🎉 Advanced demo completed successfully!');
    console.log('\n💡 Advanced Features Demonstrated:');
    console.log('   ✅ File-based template loading');
    console.log('   ✅ Complex conditional logic');
    console.log('   ✅ Nested loops and data structures');
    console.log('   ✅ Custom filters and functions');
    console.log('   ✅ Real-world email templates');
    console.log('   ✅ Dashboard and analytics templates');
    console.log('   ✅ Performance optimization');
    console.log('   ✅ Template caching');
    console.log('   ✅ Error handling and validation');
}

// Run demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAdvancedDemo().catch(console.error);
}

export { runAdvancedDemo };
