"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';
import { contactApi } from '@/lib/apiClient';
import '../landing.css';
import { useAuthStore } from '@/store/useAuthStore';

export default function ContactPage() {
    const [scrolled, setScrolled] = useState(false);
    const { isAuthenticated, user } = useAuthStore();
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 40);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const res = await contactApi.sendInquiry(formData);
        
        if (res.error) {
            setError(res.error);
        } else {
            setSubmitted(true);
            setFormData({ name: '', email: '', message: '' });
        }
        setLoading(false);
    };

    return (
        <div className="landing-body">
            {/* ── NAVIGATION ──────────────────────────────────────────── */}
            <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
                <Link href="/" className="nav-logo">
                    <img src="/logo.png" alt="Starto Logo" className="nav-logo-img dark:invert" />
                </Link>
                <ul className="nav-links">
                    <li><Link href="/">Home</Link></li>
                    <li><Link href="/about">About</Link></li>
                    <li><Link href="/feed">Platform</Link></li>
                    <li><Link href="/subscription">Pricing</Link></li>
                    <li><Link href="/careers">Careers</Link></li>
                </ul>

                <div className="nav-cta">
                    {isAuthenticated && user ? (
                        <Link href="/profile" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[1px] text-text-secondary hover:text-primary transition-all">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name || 'User'} className="w-6 h-6 rounded-full" />
                            ) : (
                                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-[10px] font-bold text-primary">
                                    {user.name ? user.name[0].toUpperCase() : 'U'}
                                </div>
                            )}
                            <span>{user.name || user.username}</span>
                        </Link>
                    ) : (
                        <>
                            <Link href="/auth" className="btn-ghost">Sign In</Link>
                            <Link href="/auth" className="btn-primary">Get Started →</Link>
                        </>
                    )}
                </div>
            </nav>

            {/* ── CONTENT ─────────────────────────────────────────────── */}
            <main style={{ padding: '160px 20px 100px', maxWidth: '1100px', margin: '0 auto' }}>
                <header style={{ marginBottom: '80px', textAlign: 'center' }}>
                    <div className="section-eyebrow" style={{ justifyContent: 'center' }}>Connect</div>
                    <h1 className="section-title">Contact <span className="alt">Us</span></h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '18px', marginTop: '16px' }}>
                        We'd love to hear from you.
                    </p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '80px' }}>
                    {/* Left Column: Info */}
                    <div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                            <section>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
                                        <Mail className="w-5 h-5 text-accent" />
                                    </div>
                                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</h2>
                                </div>
                                <a href="mailto:startoindiaofficial@gmail.com" style={{ fontSize: '18px', color: 'var(--text-muted)', textDecoration: 'none' }}>startoindiaofficial@gmail.com</a>
                            </section>

                            <section>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <MapPin className="w-5 h-5 text-accent" />
                                    </div>
                                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location</h2>
                                </div>
                                <p style={{ fontSize: '18px', color: 'var(--text-muted)' }}>Bangalore</p>
                            </section>

                            <section>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Clock className="w-5 h-5 text-accent" />
                                    </div>
                                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Working Hours</h2>
                                </div>
                                <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                                    Monday – Saturday<br />
                                    10:00 AM – 6:00 PM IST
                                </p>
                            </section>

                            <section style={{ background: 'var(--bg3)', padding: '32px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', marginBottom: '20px', textTransform: 'uppercase' }}>Why Contact Us?</h3>
                                <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0 }}>
                                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-muted)' }}>
                                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent)' }}></div>
                                        Startup Idea validation help
                                    </li>
                                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-muted)' }}>
                                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent)' }}></div>
                                        Partnership opportunities
                                    </li>
                                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-muted)' }}>
                                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent)' }}></div>
                                        Technical support
                                    </li>
                                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-muted)' }}>
                                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent)' }}></div>
                                        Investor connections
                                    </li>
                                </ul>
                                <p style={{ marginTop: '24px', fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                                    We typically respond within 24–48 hours.
                                </p>
                            </section>
                        </div>
                    </div>

                    {/* Right Column: Form */}
                    <div style={{ background: 'var(--bg2)', padding: '48px', borderRadius: '32px', border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.02)' }}>
                        {submitted ? (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(197,217,65,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                                    <CheckCircle2 className="w-8 h-8 text-accent" />
                                </div>
                                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '12px' }}>Message Sent!</h3>
                                <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                                    Thanks for reaching out. Our team will get back to you shortly.
                                </p>
                                <button 
                                    onClick={() => setSubmitted(false)}
                                    style={{ marginTop: '32px', background: 'none', border: 'none', color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}
                                >
                                    Send another message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '8px' }}>Send a Message</h2>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)' }}>Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="Enter your name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        disabled={loading}
                                        style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', fontFamily: 'var(--font-body)', fontSize: '14px', outline: 'none' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)' }}>Email</label>
                                    <input 
                                        type="email" 
                                        required 
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        disabled={loading}
                                        style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', fontFamily: 'var(--font-body)', fontSize: '14px', outline: 'none' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)' }}>Message</label>
                                    <textarea 
                                        required 
                                        rows={5} 
                                        placeholder="How can we help you?"
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        disabled={loading}
                                        style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', fontFamily: 'var(--font-body)', fontSize: '14px', outline: 'none', resize: 'vertical' }}
                                    ></textarea>
                                </div>

                                {error && (
                                    <p style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center' }}>{error}</p>
                                )}

                                <button 
                                    type="submit"
                                    className="btn-hero"
                                    disabled={loading}
                                    style={{ width: '100%', marginTop: '12px', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
                                >
                                    {loading ? 'Sending...' : 'Send Message'}
                                    {!loading && <Send className="w-4 h-4" />}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </main>

            {/* ── FOOTER ───────────────────────────────────────────────── */}
            <footer className="landing-footer">
                <div className="container">
                    <div className="footer-grid">
                        <div>
                            <Link href="/" className="nav-logo" style={{ display: 'inline-flex', marginBottom: '24px' }}>
                                <img src="/logo.png" alt="Starto Logo" className="footer-logo-img dark:invert" />
                            </Link>
                            <p className="footer-brand-tagline">
                                A unified growth ecosystem built for the next generation of Indian entrepreneurs. Where ambition meets its ecosystem.
                            </p>
                            <div className="footer-social">
                                <a href="https://www.instagram.com/startoindia" className="social-btn" target="_blank" rel="noopener noreferrer">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                                </a>
                                <a href="https://www.linkedin.com/company/startoindia/" className="social-btn" target="_blank" rel="noopener noreferrer">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                                </a>
                                <a href="https://x.com/Startoindia" className="social-btn" target="_blank" rel="noopener noreferrer">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.49h2.039L6.486 3.24H4.298l13.311 17.403z"/></svg>
                                </a>
                                <a href="mailto:startoindiaofficial@gmail.com" className="social-btn">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg>
                                </a>
                            </div>
                        </div>
                        <div className="footer-col">
                            <h5>Platform</h5>
                            <ul>
                                <li><Link href="/feed">Help Signals</Link></li>
                                <li><Link href="/explore">Starto AI</Link></li>
                                <li><Link href="/nearby">Nearby Map</Link></li>
                                <li><Link href="/network">Network</Link></li>
                            </ul>
                        </div>
                        <div className="footer-col">
                            <h5>Company</h5>
                            <ul>
                                <li><Link href="/about">About Us</Link></li>
                                <li><Link href="/careers">Careers</Link></li>
                                <li><Link href="/subscription">Pricing</Link></li>
                            </ul>
                        </div>
                        <div className="footer-col">
                            <h5>Legal & Support</h5>
                            <ul>
                                <li><Link href="/privacy">Privacy Policy</Link></li>
                                <li><Link href="/terms">Terms of Service</Link></li>
                                <li><Link href="/contact">Contact</Link></li>
                                <li><a href="#">Support</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <div className="footer-copy">© 2026 STARTO ECOSYSTEM. ALL RIGHTS RESERVED.</div>
                        <div className="footer-love">BUILT WITH <span>♥</span> FOR BHARAT</div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
