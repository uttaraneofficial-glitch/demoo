"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import '../landing.css';
import { useAuthStore } from '@/store/useAuthStore';

export default function PrivacyPage() {
    const [scrolled, setScrolled] = useState(false);
    const { isAuthenticated, user } = useAuthStore();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 40);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
            <main style={{ padding: '160px 20px 100px', maxWidth: '800px', margin: '0 auto' }}>
                <header style={{ marginBottom: '60px' }}>
                    <div className="section-eyebrow">Legal</div>
                    <h1 className="section-title">Privacy <span className="alt">Policy</span></h1>
                    <p style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '13px', marginTop: '12px' }}>
                        Effective Date: May 6, 2026
                    </p>
                </header>

                <div className="terms-content" style={{ color: 'var(--text-muted)', lineHeight: '1.8', fontSize: '16px' }}>
                    <p style={{ marginBottom: '32px', fontSize: '18px', color: 'var(--text)' }}>
                        At Starto, we prioritize the privacy and security of our ecosystem. This policy outlines how we handle your data in compliance with the Digital Personal Data Protection (DPDP) Act, 2023 of India, and other applicable global standards.
                    </p>

                    <section style={{ marginBottom: '48px' }}>
                        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', fontSize: '24px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                            1. Information We Collect
                        </h2>
                        <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                            <li style={{ marginBottom: '8px' }}><strong>Personal Information:</strong> Name, email address, profile picture, and professional background.</li>
                            <li style={{ marginBottom: '8px' }}><strong>Location Data:</strong> When you use our "Nearby Map" feature, we collect precise geographical coordinates (latitude/longitude) to connect you with local opportunities.</li>
                            <li style={{ marginBottom: '8px' }}><strong>User-Generated Content:</strong> Startup ideas, industry inputs, budget parameters, signals, comments, and direct messages.</li>
                            <li><strong>Financial Information:</strong> We use third-party payment gateways (like Razorpay) for subscriptions. We do not store raw credit card or banking details on our servers.</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '48px' }}>
                        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', fontSize: '24px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                            2. AI Data Processing & Third-Party LLMs
                        </h2>
                        <p style={{ marginBottom: '16px' }}>
                            Starto utilizes advanced Artificial Intelligence to generate Market Reports and Action Plans. By utilizing these features:
                        </p>
                        <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                            <li style={{ marginBottom: '8px' }}>Your specific queries (industry, budget, location) are processed by third-party Large Language Models (LLMs).</li>
                            <li style={{ marginBottom: '8px' }}>We do <strong>not</strong> use your Personally Identifiable Information (PII) to train external third-party AI models.</li>
                            <li>However, do not submit highly sensitive, non-patented trade secrets into the general AI analysis prompt.</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '48px' }}>
                        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', fontSize: '24px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                            3. Data Retention and Deletion
                        </h2>
                        <p>
                            We retain your personal data only for as long as your account is active or as needed to provide you services. If you choose to delete your account, your profile and associated data will be removed from active databases within 30 days. Residual copies may remain in secure, encrypted backups for up to 90 days for legal and compliance auditing purposes.
                        </p>
                    </section>

                    <section style={{ marginBottom: '48px' }}>
                        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', fontSize: '24px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                            4. Data Sharing & Third Parties
                        </h2>
                        <p style={{ marginBottom: '16px' }}>
                            We <strong>never</strong> sell your personal data to data brokers. We only share information with:
                        </p>
                        <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                            <li style={{ marginBottom: '8px' }}><strong>Service Providers:</strong> Cloud hosting, AI processing partners, and payment gateways strictly bound by confidentiality agreements.</li>
                            <li style={{ marginBottom: '8px' }}><strong>Other Users:</strong> Information you voluntarily make public on your profile or the "Nearby Map."</li>
                            <li><strong>Legal Authorities:</strong> When required by a valid legal subpoena, court order, or to prevent imminent physical harm.</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '48px' }}>
                        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', fontSize: '24px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                            5. Your Rights (Under DPDP Act, 2023)
                        </h2>
                        <p style={{ marginBottom: '16px' }}>
                            As an Indian user, you have the right to:
                        </p>
                        <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                            <li style={{ marginBottom: '8px' }}>Request access to your personal data.</li>
                            <li style={{ marginBottom: '8px' }}>Request correction or erasure of your personal data.</li>
                            <li style={{ marginBottom: '8px' }}>Nominate an individual to exercise these rights in the event of your death or incapacity.</li>
                            <li>Withdraw consent at any time (though this may affect your ability to use the platform).</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '48px' }}>
                        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', fontSize: '24px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                            6. Contact & Grievance Officer
                        </h2>
                        <p>
                            To exercise your privacy rights or file a grievance regarding data usage, please contact our Data Protection Officer at: <a href="mailto:startoindiaofficial@gmail.com" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>startoindiaofficial@gmail.com</a>. We aim to respond to all legitimate requests within 30 days.
                        </p>
                    </section>
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
