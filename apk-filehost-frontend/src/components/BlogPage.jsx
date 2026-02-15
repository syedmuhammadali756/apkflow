import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, ArrowRight } from './Icons';
import './BlogPage.css';

const blogPosts = [
    {
        id: 1,
        title: 'Stop Using Google Drive to Share APKs (Seriously)',
        excerpt: 'Access denied. Link expired. "Google wants to scan this file." We all know the pain. Here is why specialized hosting changes the game for testing.',
        date: 'Feb 12, 2026',
        readTime: '4 min read',
        category: 'Workflow',
    },
    {
        id: 2,
        title: 'The 30-Second Workflow for Android Testers',
        excerpt: 'Testing shouldn\'t require a cable or a complicated login. Discover the fastest way to get your build from Android Studio to your client\'s phone.',
        date: 'Feb 10, 2026',
        readTime: '3 min read',
        category: 'Guide',
    },
    {
        id: 3,
        title: 'Why We Don\'t Show Ads on Your Download Page',
        excerpt: 'Your clients judge you by how you deliver your work. Sending them to a page full of spammy download buttons is a bad look. We fixed that.',
        date: 'Feb 8, 2026',
        readTime: '5 min read',
        category: 'Philosophy',
    },
    {
        id: 4,
        title: 'Is Your APK Safe? A Quick Reality Check',
        excerpt: 'Uploading compiled code is scary. Here is exactly how we verify integrity, encrypt transfers, and ensure no tampering happens.',
        date: 'Feb 5, 2026',
        readTime: '6 min read',
        category: 'Security',
    },
    {
        id: 5,
        title: 'From One Developer to Another: Why I Built APKFlow',
        excerpt: 'I was tired of expired WeTransfer links and slow Dropbox loads. So I built the tool I wish I had five years ago.',
        date: 'Feb 1, 2026',
        readTime: '4 min read',
        category: 'Story',
    },
];

const BlogPage = () => {
    return (
        <div className="blog-page">
            {/* Hero */}
            <section className="blog-hero">
                <div className="container">
                    <div className="blog-hero-content">
                        <div className="hero-badge">
                            <BookOpen size={14} />
                            <span>APKFlow Blog</span>
                        </div>
                        <h1>Insights & <span className="gradient-text">Real Talk</span></h1>
                        <p>No fluff. Just practical guides and stories about shipping Android apps.</p>
                    </div>
                </div>
            </section>

            {/* Blog Grid */}
            <section className="section">
                <div className="container">
                    <div className="blog-grid">
                        {blogPosts.map((post, i) => (
                            <article key={post.id} className="blog-card glass-card" style={{ animationDelay: `${i * 0.1}s` }}>
                                <div className="blog-card-header">
                                    <span className="blog-category">{post.category}</span>
                                    <div className="blog-meta">
                                        <Clock size={14} />
                                        <span>{post.readTime}</span>
                                    </div>
                                </div>

                                <Link to={`/blog/${post.id}`} className="blog-title-link">
                                    <h2 className="blog-title">{post.title}</h2>
                                </Link>
                                <p className="blog-excerpt">{post.excerpt}</p>

                                <div className="blog-card-footer">
                                    <span className="blog-date">{post.date}</span>
                                    <Link to={`/blog/${post.id}`} className="blog-read-more">
                                        Read Article <ArrowRight size={14} />
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default BlogPage;
