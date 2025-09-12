import { SimpleTemplateEngine } from './simple-engine.js';
import { readFile, writeFile } from 'fs/promises';

async function emailDemo() {
    const engine = new SimpleTemplateEngine();
    
    // Load the email template
    const template = await readFile('./examples/templates/email.html', 'utf-8');
    
    console.log('📧 Email Template Demo');
    console.log('======================\n');
    
    // Demo 1: Welcome Email
    console.log('1. Welcome Email:');
    const welcomeContext = {
        emailType: 'welcome',
        subject: 'Welcome to TechCorp!',
        company: {
            name: 'TechCorp Solutions',
            address: '123 Innovation Drive, Tech City, TC 12345'
        },
        recipient: {
            name: 'Alice Johnson',
            email: 'alice.johnson@example.com'
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
    
    const welcomeEmail = engine.render(template, welcomeContext);
    await writeFile('./email-welcome.html', welcomeEmail);
    console.log('✅ Welcome email generated: email-welcome.html');
    
    // Demo 2: Order Confirmation Email
    console.log('\n2. Order Confirmation Email:');
    const orderContext = {
        emailType: 'order_confirmation',
        subject: 'Order Confirmation #ORD-2024-001',
        company: {
            name: 'TechStore',
            address: '456 Commerce St, Shopping City, SC 67890'
        },
        recipient: {
            name: 'Bob Smith',
            email: 'bob.smith@example.com'
        },
        order: {
            id: 'ORD-2024-001',
            date: new Date('2024-01-15'),
            total: 1299.97,
            estimatedDelivery: new Date('2024-01-22'),
            items: [
                { name: 'Wireless Headphones Pro', quantity: 1, price: 299.99 },
                { name: 'Smartphone Case Premium', quantity: 2, price: 49.99 },
                { name: 'Portable Charger 20000mAh', quantity: 1, price: 89.99 },
                { name: 'USB-C Cable 6ft', quantity: 3, price: 19.99 }
            ]
        },
        links: {
            trackOrder: 'https://techstore.com/track/ORD-2024-001',
            unsubscribe: 'https://techstore.com/unsubscribe',
            preferences: 'https://techstore.com/preferences'
        }
    };
    
    const orderEmail = engine.render(template, orderContext);
    await writeFile('./email-order.html', orderEmail);
    console.log('✅ Order confirmation email generated: email-order.html');
    
    // Demo 3: Promotional Email
    console.log('\n3. Promotional Email:');
    const promoContext = {
        emailType: 'promotion',
        subject: 'Flash Sale - 50% Off Everything!',
        company: {
            name: 'MegaStore',
            address: '789 Retail Blvd, Sale City, SC 11111'
        },
        recipient: {
            name: 'Carol Davis',
            email: 'carol.davis@example.com'
        },
        promotion: {
            description: 'Our biggest sale of the year is here! Get 50% off on all items.',
            discount: 50,
            code: 'FLASH50',
            expires: new Date('2024-02-01'),
            products: [
                { name: 'Gaming Laptop RTX 4080', originalPrice: 1999.99, salePrice: 999.99 },
                { name: 'Wireless Gaming Mouse', originalPrice: 79.99, salePrice: 39.99 },
                { name: 'Mechanical Keyboard RGB', originalPrice: 149.99, salePrice: 74.99 },
                { name: '4K Gaming Monitor 27"', originalPrice: 399.99, salePrice: 199.99 }
            ]
        },
        links: {
            shop: 'https://megastore.com/sale',
            unsubscribe: 'https://megastore.com/unsubscribe',
            preferences: 'https://megastore.com/preferences'
        }
    };
    
    const promoEmail = engine.render(template, promoContext);
    await writeFile('./email-promo.html', promoEmail);
    console.log('✅ Promotional email generated: email-promo.html');
    
    // Demo 4: Newsletter Email
    console.log('\n4. Newsletter Email:');
    const newsletterContext = {
        emailType: 'newsletter',
        subject: 'Tech Weekly - Latest Updates',
        company: {
            name: 'Tech Weekly',
            address: '321 News Ave, Info City, IC 54321'
        },
        recipient: {
            name: 'David Wilson',
            email: 'david.wilson@example.com'
        },
        articles: [
            {
                title: 'AI Revolution in Web Development',
                author: 'Sarah Chen',
                date: new Date('2024-01-14'),
                excerpt: 'Discover how artificial intelligence is transforming the way we build web applications, from automated code generation to intelligent user interfaces.',
                url: 'https://techweekly.com/ai-web-development'
            },
            {
                title: 'The Future of Cloud Computing',
                author: 'Mike Rodriguez',
                date: new Date('2024-01-12'),
                excerpt: 'Exploring emerging trends in cloud technology including serverless computing, edge computing, and multi-cloud strategies.',
                url: 'https://techweekly.com/cloud-future'
            },
            {
                title: 'Cybersecurity Best Practices 2024',
                author: 'Emily Zhang',
                date: new Date('2024-01-10'),
                excerpt: 'Essential security practices every developer should know to protect applications and user data in the modern threat landscape.',
                url: 'https://techweekly.com/cybersecurity-2024'
            }
        ],
        links: {
            unsubscribe: 'https://techweekly.com/unsubscribe',
            preferences: 'https://techweekly.com/preferences'
        }
    };
    
    const newsletterEmail = engine.render(template, newsletterContext);
    await writeFile('./email-newsletter.html', newsletterEmail);
    console.log('✅ Newsletter email generated: email-newsletter.html');
    
    console.log('\n🎉 All email templates generated successfully!');
    console.log('\n📁 Generated Files:');
    console.log('   • email-welcome.html - Welcome email');
    console.log('   • email-order.html - Order confirmation');
    console.log('   • email-promo.html - Promotional campaign');
    console.log('   • email-newsletter.html - Newsletter');
    console.log('\n💡 Open these files in your browser to see the rendered emails!');
}

emailDemo().catch(console.error);
