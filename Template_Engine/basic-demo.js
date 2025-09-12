import { SimpleTemplateEngine } from './simple-engine.js';
import { readFile, writeFile } from 'fs/promises';

async function basicDemo() {
    const engine = new SimpleTemplateEngine();
    
    // Load the basic template
    const template = await readFile('./examples/templates/basic.html', 'utf-8');
    
    console.log('📄 Basic HTML Template Demo');
    console.log('============================\n');
    
    // Demo 1: Tech Blog
    console.log('1. Tech Blog:');
    const blogContext = {
        title: 'TechInsights Blog',
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
                excerpt: 'Exploring the latest trends in web development including AI integration, serverless architecture, and progressive web apps. This comprehensive guide covers everything you need to know about the evolving landscape of modern web development and how it will impact developers in the coming years.',
                tags: ['Web Development', 'AI', 'Serverless', 'PWA']
            },
            {
                title: 'Understanding Machine Learning Basics',
                author: 'David Rodriguez',
                date: new Date('2024-01-12'),
                excerpt: 'A beginner-friendly introduction to machine learning concepts, algorithms, and practical applications in today\'s technology landscape. Learn about supervised learning, neural networks, and how to get started with your first ML project.',
                tags: ['Machine Learning', 'AI', 'Data Science', 'Python']
            },
            {
                title: 'Cloud Computing Best Practices',
                author: 'Emily Zhang',
                date: new Date('2024-01-10'),
                excerpt: 'Learn about cloud architecture patterns, security considerations, and cost optimization strategies for modern cloud deployments. Discover how to build scalable, resilient applications in the cloud.',
                tags: ['Cloud Computing', 'AWS', 'Security', 'DevOps']
            },
            {
                title: 'JavaScript Performance Optimization',
                author: 'Alex Thompson',
                date: new Date('2024-01-08'),
                excerpt: 'Deep dive into JavaScript performance optimization techniques including code splitting, lazy loading, and memory management. Practical tips to make your web applications faster and more efficient.',
                tags: ['JavaScript', 'Performance', 'Optimization', 'Frontend']
            }
        ]
    };
    
    const blogHtml = engine.render(template, blogContext);
    await writeFile('./basic-blog.html', blogHtml);
    console.log('✅ Tech blog generated: basic-blog.html');
    
    // Demo 2: Portfolio Site
    console.log('\n2. Portfolio Site:');
    const portfolioContext = {
        title: 'John Doe - Portfolio',
        siteName: 'John Doe Portfolio',
        user: {
            name: 'John Doe',
            isLoggedIn: false
        },
        posts: [
            {
                title: 'E-commerce Platform Redesign',
                author: 'John Doe',
                date: new Date('2024-01-14'),
                excerpt: 'Complete redesign of a major e-commerce platform serving over 1 million users. Improved conversion rates by 25% through better UX design and performance optimization. Built with React, Node.js, and PostgreSQL.',
                tags: ['React', 'Node.js', 'UX Design', 'E-commerce']
            },
            {
                title: 'Mobile Banking App',
                author: 'John Doe',
                date: new Date('2024-01-10'),
                excerpt: 'Developed a secure mobile banking application with biometric authentication, real-time transactions, and advanced fraud detection. Implemented using React Native and integrated with multiple banking APIs.',
                tags: ['React Native', 'Mobile', 'Security', 'FinTech']
            },
            {
                title: 'AI-Powered Analytics Dashboard',
                author: 'John Doe',
                date: new Date('2024-01-05'),
                excerpt: 'Created an intelligent analytics dashboard that uses machine learning to provide predictive insights for business metrics. Features real-time data visualization and automated reporting capabilities.',
                tags: ['AI', 'Analytics', 'Dashboard', 'Machine Learning']
            }
        ]
    };
    
    const portfolioHtml = engine.render(template, portfolioContext);
    await writeFile('./basic-portfolio.html', portfolioHtml);
    console.log('✅ Portfolio site generated: basic-portfolio.html');
    
    // Demo 3: News Site
    console.log('\n3. News Site:');
    const newsContext = {
        title: 'Daily Tech News',
        siteName: 'TechDaily',
        user: {
            name: 'Guest User',
            isLoggedIn: false
        },
        posts: [
            {
                title: 'Major Tech Company Announces Revolutionary AI Chip',
                author: 'Tech Reporter',
                date: new Date('2024-01-16'),
                excerpt: 'A leading technology company has unveiled its latest AI processing chip that promises 10x performance improvements for machine learning workloads. The chip features advanced neural processing units and energy-efficient architecture.',
                tags: ['AI', 'Hardware', 'Innovation', 'Technology']
            },
            {
                title: 'New Privacy Regulations Impact Social Media Platforms',
                author: 'Policy Analyst',
                date: new Date('2024-01-15'),
                excerpt: 'Recent privacy legislation is forcing major social media platforms to overhaul their data collection practices. Companies must now provide greater transparency and user control over personal information.',
                tags: ['Privacy', 'Regulation', 'Social Media', 'Policy']
            },
            {
                title: 'Quantum Computing Breakthrough Achieved',
                author: 'Science Correspondent',
                date: new Date('2024-01-14'),
                excerpt: 'Researchers have achieved a significant milestone in quantum computing, demonstrating quantum advantage in solving complex optimization problems. This breakthrough could revolutionize cryptography and scientific computing.',
                tags: ['Quantum Computing', 'Research', 'Science', 'Innovation']
            },
            {
                title: 'Sustainable Tech: Green Data Centers on the Rise',
                author: 'Environmental Tech Writer',
                date: new Date('2024-01-13'),
                excerpt: 'The tech industry is embracing sustainability with the construction of carbon-neutral data centers powered entirely by renewable energy. These facilities use innovative cooling systems and energy management.',
                tags: ['Sustainability', 'Data Centers', 'Green Tech', 'Environment']
            }
        ]
    };
    
    const newsHtml = engine.render(template, newsContext);
    await writeFile('./basic-news.html', newsHtml);
    console.log('✅ News site generated: basic-news.html');
    
    // Demo 4: Company Blog
    console.log('\n4. Company Blog:');
    const companyContext = {
        title: 'InnovateCorp Updates',
        siteName: 'InnovateCorp',
        user: {
            name: 'Employee',
            isLoggedIn: true,
            lastLogin: new Date('2024-01-16T09:00:00')
        },
        posts: [
            {
                title: 'Q4 2023 Product Releases and Achievements',
                author: 'Product Team',
                date: new Date('2024-01-15'),
                excerpt: 'Looking back at our successful Q4 2023, we launched three major product features, expanded to two new markets, and achieved 99.9% uptime across all services. Our team grew by 30% and customer satisfaction reached an all-time high.',
                tags: ['Product Updates', 'Company News', 'Achievements', 'Growth']
            },
            {
                title: 'New Partnership with Leading Cloud Provider',
                author: 'Business Development',
                date: new Date('2024-01-12'),
                excerpt: 'We\'re excited to announce our strategic partnership with a major cloud infrastructure provider. This collaboration will enhance our platform\'s scalability and provide customers with improved performance and reliability.',
                tags: ['Partnership', 'Cloud', 'Infrastructure', 'Announcement']
            },
            {
                title: 'Employee Spotlight: Innovation in Action',
                author: 'HR Team',
                date: new Date('2024-01-10'),
                excerpt: 'Meet our outstanding employees who are driving innovation at InnovateCorp. From breakthrough algorithms to exceptional customer service, discover the people behind our success and their inspiring stories.',
                tags: ['Employee Spotlight', 'Innovation', 'Team', 'Culture']
            }
        ]
    };
    
    const companyHtml = engine.render(template, companyContext);
    await writeFile('./basic-company.html', companyHtml);
    console.log('✅ Company blog generated: basic-company.html');
    
    console.log('\n🎉 All basic HTML templates generated successfully!');
    console.log('\n📁 Generated Files:');
    console.log('   • basic-blog.html - Tech blog');
    console.log('   • basic-portfolio.html - Portfolio site');
    console.log('   • basic-news.html - News site');
    console.log('   • basic-company.html - Company blog');
    console.log('\n💡 Open these files in your browser to see the rendered pages!');
}

basicDemo().catch(console.error);
