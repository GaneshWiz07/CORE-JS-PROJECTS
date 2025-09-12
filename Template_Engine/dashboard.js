import { SimpleTemplateEngine } from './simple-engine.js';
import { readFile, writeFile } from 'fs/promises';

async function fixDashboard() {
    const engine = new SimpleTemplateEngine();
    
    // Load the dashboard template
    const template = await readFile('./examples/templates/dashboard.html', 'utf-8');
    
    // Sample data for the dashboard
    const context = {
        pageTitle: 'My Analytics Dashboard',
        user: {
            name: 'John Smith',
            role: 'admin'
        },
        statistics: [
            { label: 'Total Sales', value: 45000, currency: 'USD', change: 12.5 },
            { label: 'Active Users', value: 2340, change: -5.2 },
            { label: 'Conversion Rate', value: 4.8, change: 8.1 },
            { label: 'Support Tickets', value: 15, change: -20.3 }
        ],
        chartData: [
            { label: 'Website Traffic', value: 85 },
            { label: 'Mobile App Usage', value: 72 },
            { label: 'API Calls', value: 94 },
            { label: 'Database Performance', value: 88 }
        ],
        tableData: [
            { id: 1, name: 'Project Alpha', status: 'active', created: new Date('2024-01-10'), progress: 85 },
            { id: 2, name: 'Project Beta', status: 'inactive', created: new Date('2024-01-08'), progress: 60 },
            { id: 3, name: 'Project Gamma', status: 'active', created: new Date('2024-01-12'), progress: 95 }
        ],
        activities: [
            {
                title: 'New user registered',
                description: 'Alice Johnson created an account',
                timestamp: new Date('2024-01-16T14:30:00')
            },
            {
                title: 'Payment received',
                description: 'Invoice #2024-001 paid by TechCorp',
                timestamp: new Date('2024-01-16T13:15:00')
            }
        ]
    };
    
    // Render the dashboard
    console.log('🎨 Rendering dashboard with fixed engine...');
    const html = engine.render(template, context);
    
    // Save to file
    await writeFile('./dashboard-fixed.html', html);
    
    console.log('✅ Fixed dashboard generated! Open dashboard-fixed.html in your browser');
    console.log(`📊 Generated ${html.length} characters of HTML`);
}

fixDashboard().catch(console.error);
