import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Calendar, User, Clock, Share2, Twitter, Linkedin, Facebook } from './Icons';
import './BlogPost.css';

// Reading progress hook
const useReadingProgress = () => {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        const update = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            setProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
        };
        window.addEventListener('scroll', update, { passive: true });
        return () => window.removeEventListener('scroll', update);
    }, []);
    return progress;
};

const blogContent = {
    1: {
        title: "Stop Using Google Drive to Share APKs (Seriously)",
        date: "Feb 12, 2026",
        readTime: "4 min read",
        author: "Dr Web Jr.",
        category: "workflow",
        content: `
      <p>Look, I get it. Google Drive is easy. It's already there. You drop a file in, grab a link, and send it to your tester.</p>
      
      <p className="highlight-text">But let's be honest: it sucks for APKs.</p>

      <h3>The "Access Denied" Nightmare</h3>
      <p>How many times have you sent a link, only to get a message back 5 minutes later: <em>"Hey, it says I need permission."</em>? Yeah. Me too. It kills the momentum. You have to stop coding, open Drive, change permissions, and hope it propagates.</p>

      <h3>The Download Button Hunt</h3>
      <p>Even when it works, your testers act like detectives trying to find the actual download button. Drive isn't built for software distribution. It's built for docs. It shows a preview that doesn't work, then scans for viruses slowly, then finally lets you download.</p>

      <h3>That's Why APKFlow Exists</h3>
      <p>I built APKFlow because I wanted a simple workflow:</p>
      <ol>
        <li>Drag file.</li>
        <li>Get link.</li>
        <li>Download instantly.</li>
      </ol>
      <p>No permissions. No waiting. No "Google wants to scan this 50MB file" modal. Just a direct, fast download link that works on mobile. Your testers will thank you.</p>
    `
    },
    2: {
        title: "The 30-Second Workflow for Android Testers",
        date: "Feb 10, 2026",
        readTime: "3 min read",
        author: "Team APKFlow",
        category: "guide",
        content: `
      <p>Testing Android apps is messy. Installing via ADB requires a cable. Using email has file size limits. Most file hosts are riddled with ads and fake buttons.</p>

      <p>Here is the workflow designed to save your sanity:</p>

      <h3>Step 1: The Upload</h3>
      <p>Drag your <code>app-release.apk</code> directly onto the APKFlow dashboard. Watch the progress bar (it satisfies the soul). Boom. You have a link.</p>

      <h3>Step 2: The Share</h3>
      <p>Send that link to your client or QA team. Slack, WhatsApp, Email — doesn't matter. It's just a URL.</p>

      <h3>Step 3: The Install</h3>
      <p>Here is where the magic happens. They click the link on their phone. The download starts <strong>immediately</strong>. They tap "Open", "Install", and they're testing your app in under a minute.</p>

      <p className="quote-box">Speed matters when you're iterating. Waiting 5 minutes for a download kills the feedback loop.</p>
    `
    },
    3: {
        title: "Why We Don't Show Ads on Your Download Page",
        date: "Feb 8, 2026",
        readTime: "5 min read",
        author: "Dr Web Jr.",
        category: "philosophy",
        content: `
      <p>Most free file hosts operate on a simple model: you give them files, they give your users a headache. Pop-ups, redirects, fake "Download" buttons that install malware... it's a mess.</p>
      
      <p>We chose the hard path. <strong>Zero ads on download pages.</strong></p>

      <h3>Trust is Everything</h3>
      <p>If you're a developer sharing an app with a client, you look unprofessional if they have to navigate a minefield of ads to get your work. It reflects badly on <em>you</em>.</p>

      <h3>How We Survive</h3>
      <p>We keep our costs low with efficient storage and smart caching. We offer premium features for power users (coming soon) to pay the bills. But the core experience of downloading a file? That has to be sacred.</p>

      <p>Your users are here for your app, not for a casino add. We respect that.</p>
    `
    },
    4: {
        title: "Is Your APK Safe? A Quick Reality Check",
        date: "Feb 5, 2026",
        readTime: "6 min read",
        author: "Security Team",
        category: "security",
        content: `
      <p>Uploading compiled code to the internet is scary. You've spent months building this.</p>

      <h3>We Check Hash Integrity</h3>
      <p>Every file uploaded to APKFlow gets a checksum. When your user downloads it, we verify that not a single bit has changed. No corruption, no tampering.</p>
      
      <h3>HTTPS Everywhere</h3>
      <p>Seems basic in 2026, but you'd be surprised. We force HTTPS for every single connection. Your APK travels through an encrypted tunnel from your laptop to our server, and from our server to your user's phone.</p>

      <p>We don't modify your APK. We don't inject code. We don't repackage it. We just host it. Exactly as you built it.</p>
    `
    },
    5: {
        title: "From One Developer to Another: Why I Built APKFlow",
        date: "Feb 1, 2026",
        readTime: "4 min read",
        author: "Dr Web Jr.",
        category: "story",
        content: `
      <p>Hi, I'm Dr Web Jr.</p>
      <p>I build apps. A lot of them. And every time I finished a build, I hit the same wall: <em>"How do I get this onto my client's phone right now?"</em></p>

      <p>I tried everything.</p>
      <ul>
        <li><strong>Email?</strong> "File too large."</li>
        <li><strong>Dropbox?</strong> Forces them to login or download the app.</li>
        <li><strong>WeTransfer?</strong> Expired links after 7 days.</li>
        <li><strong>Public Hosts?</strong> Too sketchy for professional work.</li>
      </ul>

      <p>I just wanted a bucket. A simple, fast, secure bucket that understands what an APK is.</p>

      <h3>So I coded it.</h3>
      <p>APKFlow is the tool I wish I had five years ago. It's not trying to be a cloud drive. It's not trying to substitute GitHub. It does one thing really well: <strong>It delivers Android apps to people.</strong></p>

      <p>I hope it saves you some time. Happy coding.</p>
    `
    }
};

const BlogPost = () => {
    const { id } = useParams();
    const post = blogContent[id];
    const progress = useReadingProgress();

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
    };

    if (!post) {
        return (
            <div className="blog-post-not-found">
                <h2>Post not found</h2>
                <Link to="/blog" className="btn btn-primary">Back to Blog</Link>
            </div>
        );
    }

    return (
        <div className="blog-post-page">
            {/* Reading Progress Bar */}
            <div className="reading-progress-bar" style={{ width: `${progress}%` }} />
            <div className="blog-post-container">

                {/* Header */}
                <header className="post-header">
                    <Link to="/blog" className="back-link">
                        <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} /> Back to Blog
                    </Link>

                    <div className="post-meta-top">
                        <span className="post-category">{post.category}</span>
                        <span className="post-date"><Calendar size={14} /> {post.date}</span>
                    </div>

                    <h1 className="post-title">{post.title}</h1>

                    <div className="post-author-row">
                        <div className="author-avatar">
                            {post.author.charAt(0)}
                        </div>
                        <div className="author-info">
                            <span className="author-name">{post.author}</span>
                            <span className="author-role">Author</span>
                        </div>
                        <div className="read-time">
                            <Clock size={14} /> {post.readTime}
                        </div>
                    </div>
                </header>

                {/* Content */}
                <article className="post-content glass-card" dangerouslySetInnerHTML={{ __html: post.content }} />

                {/* Share / Footer */}
                <div className="post-footer">
                    <h3>Share this article</h3>
                    <div className="share-buttons">
                        <button className="share-btn twitter" onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`, '_blank')}><Twitter size={18} /></button>
                        <button className="share-btn linkedin" onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')}><Linkedin size={18} /></button>
                        <button className="share-btn facebook" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}><Facebook size={18} /></button>
                        <button className="share-btn copy" onClick={handleCopyLink}><Share2 size={18} /> Copy Link</button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BlogPost;
