import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, ArrowRight, Search, X } from './Icons';
import './BlogPage.css';

const blogPosts = [
    {
        id: 1,
        title: 'Stop Using Google Drive to Share APKs (Seriously)',
        excerpt: 'Access denied. Link expired. "Google wants to scan this file." We all know the pain. Here is why specialized hosting changes the game for testing.',
        date: 'Feb 12, 2026',
        readTime: '4 min read',
        category: 'Workflow',
        featured: true,
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
    {
        id: 6,
        title: 'APK Versioning: A Clean Naming Convention That Works',
        excerpt: 'Messy filenames like "app-debug-final-FINAL2.apk" are a nightmare. Here\'s a simple versioning system that keeps your team sane.',
        date: 'Jan 28, 2026',
        readTime: '5 min read',
        category: 'Guide',
    },
    {
        id: 7,
        title: 'QR Codes for APK Distribution: The Underrated Trick',
        excerpt: 'Show up to a client meeting, display a QR code, and watch them install your app in 10 seconds. No cables, no emails, no friction.',
        date: 'Jan 22, 2026',
        readTime: '3 min read',
        category: 'Workflow',
    },
    {
        id: 8,
        title: 'How AI Is Changing Mobile App Testing in 2026',
        excerpt: 'From smart rename suggestions to automated test distribution, AI is quietly making the developer workflow faster. Here\'s what\'s real and what\'s hype.',
        date: 'Jan 15, 2026',
        readTime: '7 min read',
        category: 'AI',
    },
];

const categoryColors = {
    Workflow: '#7c3aed',
    Guide: '#06b6d4',
    Philosophy: '#10b981',
    Security: '#ef4444',
    Story: '#f59e0b',
    AI: '#ec4899',
};

const categories = ['All', ...Array.from(new Set(blogPosts.map(p => p.category)))];

const BlogPage = () => {
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = blogPosts.filter(p => {
        const matchCat = activeCategory === 'All' || p.category === activeCategory;
        const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
        return matchCat && matchSearch;
    });

    const featuredPost = filtered.find(p => p.featured);
    const regularPosts = filtered.filter(p => !p.featured || activeCategory !== 'All' || searchTerm);

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
                        <p>No fluff. Practical guides and stories about shipping Android apps faster.</p>
                    </div>
                </div>
            </section>

            {/* Toolbar */}
            <section className="section blog-toolbar-section">
                <div className="container">
                    <div className="blog-toolbar">
                        <div className="blog-search-bar">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')}><X size={14} /></button>
                            )}
                        </div>
                        <div className="blog-category-tabs">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    className={`blog-cat-tab ${activeCategory === cat ? 'active' : ''}`}
                                    onClick={() => setActiveCategory(cat)}
                                    style={activeCategory === cat && cat !== 'All' ? {
                                        background: `${categoryColors[cat]}18`,
                                        color: categoryColors[cat],
                                        borderColor: `${categoryColors[cat]}40`
                                    } : {}}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Featured Post */}
                    {featuredPost && activeCategory === 'All' && !searchTerm && (
                        <article className="blog-featured glass-card">
                            <div className="blog-featured-content">
                                <div className="blog-featured-meta">
                                    <span
                                        className="blog-category"
                                        style={{ background: `${categoryColors[featuredPost.category]}18`, color: categoryColors[featuredPost.category] }}
                                    >
                                        {featuredPost.category}
                                    </span>
                                    <span className="blog-featured-badge">Featured</span>
                                </div>
                                <Link to={`/blog/${featuredPost.id}`} className="blog-title-link">
                                    <h2 className="blog-featured-title">{featuredPost.title}</h2>
                                </Link>
                                <p className="blog-featured-excerpt">{featuredPost.excerpt}</p>
                                <div className="blog-featured-footer">
                                    <div className="blog-meta">
                                        <Clock size={14} />
                                        <span>{featuredPost.readTime}</span>
                                        <span>·</span>
                                        <span>{featuredPost.date}</span>
                                    </div>
                                    <Link to={`/blog/${featuredPost.id}`} className="blog-read-more">
                                        Read Article <ArrowRight size={14} />
                                    </Link>
                                </div>
                            </div>
                            <div className="blog-featured-visual">
                                <div className="blog-featured-icon">📝</div>
                            </div>
                        </article>
                    )}

                    {/* Blog Grid */}
                    {filtered.length === 0 ? (
                        <div className="blog-empty">
                            <Search size={32} />
                            <p>No articles found for "{searchTerm}"</p>
                        </div>
                    ) : (
                        <div className="blog-grid">
                            {(activeCategory === 'All' && !searchTerm ? regularPosts : filtered).map((post, i) => (
                                <article key={post.id} className="blog-card glass-card" style={{ animationDelay: `${i * 0.08}s` }}>
                                    <div className="blog-card-header">
                                        <span
                                            className="blog-category"
                                            style={{ background: `${categoryColors[post.category]}18`, color: categoryColors[post.category] }}
                                        >
                                            {post.category}
                                        </span>
                                        <div className="blog-meta">
                                            <Clock size={13} />
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
                                            Read <ArrowRight size={13} />
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default BlogPage;
