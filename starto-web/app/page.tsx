'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import './landing.css';
import { useAuthStore } from '@/store/useAuthStore';

export default function LandingPage() {
    const [scrolled, setScrolled] = useState(false);
    const { isAuthenticated, user } = useAuthStore();

    useEffect(() => {
        // Nav scroll effect
        const handleScroll = () => {
            setScrolled(window.scrollY > 40);
        };
        window.addEventListener('scroll', handleScroll);

        // Scroll reveal
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        const reveals = document.querySelectorAll('.reveal');
        reveals.forEach(el => observer.observe(el));

        return () => {
            window.removeEventListener('scroll', handleScroll);
            reveals.forEach(el => observer.unobserve(el));
        };
    }, []);

    return (
        <div className="landing-body">
            {/* ── TICKER ──────────────────────────────────────────────── */}
            <div className="ticker">
                <div className="ticker-inner">
                    <span>Ecosystem V3 Live</span>
                    <span>Help Signals</span>
                    <span>AI Market Reports</span>
                    <span>Geo-Intelligence</span>
                    <span>Verified Network</span>
                    <span>Spaces</span>
                    <span>Instant Help</span>
                    <span>Built for Bharat</span>
                    <span>Ecosystem V3 Live</span>
                    <span>Help Signals</span>
                    <span>AI Market Reports</span>
                    <span>Geo-Intelligence</span>
                    <span>Verified Network</span>
                    <span>Spaces</span>
                    <span>Instant Help</span>
                    <span>Built for Bharat</span>
                </div>
            </div>

            {/* ── NAVIGATION ──────────────────────────────────────────── */}
            <nav id="navbar" className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
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

            {/* ── HERO ────────────────────────────────────────────────── */}
            <section className="hero">
                <div className="hero-grid"></div>
                <div className="hero-orb hero-orb-1"></div>
                <div className="hero-orb hero-orb-2"></div>
                <div className="hero-orb hero-orb-3"></div>
                <div className="hero-eyebrow">India's first startup social media</div>
                <h1 className="hero-title">
                    Build where<br />
                    it <span className="accent-word">actually</span><br />
                    <span className="dim-word">works.</span>
                </h1>
                <p className="hero-sub">
                    Starto connects visionaries in Tier-2 and Tier-3 cities to the resources, mentors, funding signals, and AI intelligence they need to turn ambition into action.
                </p>
                <div className="hero-actions">
                    <Link href="/feed" className="btn-hero">
                        Enter the Ecosystem
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </Link>
                </div>
                <div className="stats-strip">
                    <div className="stat-item">
                        <div className="stat-num">500<span>+</span></div>
                        <div className="stat-label">Active Founders</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-num">48<span>+</span></div>
                        <div className="stat-label">Cities Connected</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-num">84<span>%</span></div>
                        <div className="stat-label">Signal Response Rate</div>
                    </div>
                </div>
            </section>

            {/* ── PLATFORM FEATURES ────────────────────────────────────── */}
            <section className="features">
                <div className="container">
                    <div className="features-header">
                        <div>
                            <div className="section-eyebrow">Core Platform</div>
                            <h2 className="section-title">
                                Everything you need<br />to <span className="alt">grow faster.</span>
                            </h2>
                        </div>
                        <p className="section-body">
                            A unified infrastructure layer purpose-built for Indian founders — from the first idea to first funding round and beyond.
                        </p>
                    </div>
                    <div className="feature-grid">
                        {/* Row 1 */}
                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <div className="feature-num">01 / Help Signals</div>
                            <h3>Raise Instant<br />Help Signals</h3>
                            <p>Post a time-bound signal to your local and global network. Get targeted responses from founders, mentors, and investors who can actually move the needle — within hours, not weeks.</p>
                            <div className="feature-tag-row">
                                <span className="feature-tag">Real-time</span>
                                <span className="feature-tag">7-Day Signals</span>
                                <span className="feature-tag">Category Routing</span>
                            </div>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>
                            </div>
                            <div className="feature-num">02 / Starto AI</div>
                            <h3>AI-Powered<br />Market Intelligence</h3>
                            <p>Get data-driven feasibility analysis, competitor mapping, and go-to-market insights powered by our proprietary AI models trained on Indian market dynamics and real startup signals.</p>
                            <div className="feature-tag-row">
                                <span className="feature-tag">Feasibility Reports</span>
                                <span className="feature-tag">TAM Analysis</span>
                                <span className="feature-tag">AI Insights</span>
                            </div>
                        </div>
                        {/* Wide card */}
                        <div className="feature-card wide">
                            <div className="feature-wide-grid">
                                <div>
                                    <div className="feature-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                                    </div>
                                    <div className="feature-num">03 / Geo Intelligence</div>
                                    <h3>Hyperlocal<br />Geospatial Map</h3>
                                    <p>Discover and connect with founders, investors, and mentors physically near you. Starto's live map visualizes the entire startup ecosystem around you — building real local networks, not just digital ones.</p>
                                    <div className="feature-tag-row" style={{ marginTop: '20px' }}>
                                        <span className="feature-tag">Live Map</span>
                                        <span className="feature-tag">Hyperlocal Nodes</span>
                                        <span className="feature-tag">Proximity Matching</span>
                                        <span className="feature-tag">48+ Cities</span>
                                    </div>
                                </div>
                                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '32px', position: 'relative', overflow: 'hidden', minHeight: '200px' }}>
                                    {/* Mini map mockup */}
                                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 60% 40%,rgba(197,217,65,0.07) 0%,transparent 60%)', pointerEvents: 'none' }}></div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        <span style={{ background: 'var(--accent-dim)', border: '1px solid rgba(197,217,65,0.3)', color: 'var(--accent)', fontSize: '11px', padding: '4px 12px', borderRadius: '100px', fontFamily: 'var(--font-mono)' }}>Bangalore ● 412</span>
                                        <span style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '11px', padding: '4px 12px', borderRadius: '100px', fontFamily: 'var(--font-mono)' }}>Hyderabad ● 321</span>
                                        <span style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '11px', padding: '4px 12px', borderRadius: '100px', fontFamily: 'var(--font-mono)' }}>Chennai ● 284</span>
                                        <span style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '11px', padding: '4px 12px', borderRadius: '100px', fontFamily: 'var(--font-mono)' }}>Hubli ● 156</span>
                                        <span style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '11px', padding: '4px 12px', borderRadius: '100px', fontFamily: 'var(--font-mono)' }}>Mangalore ● 128</span>
                                        <span style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '11px', padding: '4px 12px', borderRadius: '100px', fontFamily: 'var(--font-mono)' }}>Mysuru ● 142</span>
                                        <span style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '11px', padding: '4px 12px', borderRadius: '100px', fontFamily: 'var(--font-mono)' }}>Davangere ● 87</span>
                                        <span style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '11px', padding: '4px 12px', borderRadius: '100px', fontFamily: 'var(--font-mono)' }}>Belagavi ● 91</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            </div>
                            <div className="feature-num">04 / Network</div>
                            <h3>Verified<br />Founder Network</h3>
                            <p>Every profile on Starto is real. Our trust layer verifies identities, validates credentials, and surfaces your warm network first — so cold outreach becomes warm introduction.</p>
                            <div className="feature-tag-row">
                                <span className="feature-tag">Verified Profiles</span>
                                <span className="feature-tag">Trust Score</span>
                                <span className="feature-tag">Network Graph</span>
                            </div>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                            </div>
                            <div className="feature-num">05 / Spaces</div>
                            <h3>Community<br />Spaces</h3>
                            <p>Create or join topic-based community spaces around industries, technologies, and cities. Spaces bring together high-signal conversations and deep-domain expertise in one place.</p>
                            <div className="feature-tag-row">
                                <span className="feature-tag">Topic Rooms</span>
                                <span className="feature-tag">Deep Discussions</span>
                                <span className="feature-tag">Expert Access</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
            <section className="how-it-works">
                <div className="container">
                    <div className="section-eyebrow reveal">How It Works</div>
                    <h2 className="section-title reveal reveal-delay-1">From Signal<br />to <span className="alt">solution.</span></h2>
                    <div className="steps-grid">
                        <div className="step reveal">
                            <div className="step-num">01</div>
                            <h4>Create Your Profile</h4>
                            <p>Complete a 5-step onboarding to define your startup domain, city, stage, and what you need — Starto personalises the entire ecosystem view to your context.</p>
                            <div className="step-arrow">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </div>
                        </div>
                        <div className="step reveal reveal-delay-1">
                            <div className="step-num">02</div>
                            <h4>Raise a Signal</h4>
                            <p>Post a time-bound "Help Signal" describing exactly what you need — funding, co-founders, mentors, legal help, or technical resources. Be specific. The ecosystem responds.</p>
                            <div className="step-arrow">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </div>
                        </div>
                        <div className="step reveal reveal-delay-2">
                            <div className="step-num">03</div>
                            <h4>Receive Responses</h4>
                            <p>Verified founders, investors and mentors respond to your signal with offers, introductions, and resources. Our AI ranks responses by relevance and trust score.</p>
                            <div className="step-arrow">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </div>
                        </div>
                        <div className="step reveal reveal-delay-3">
                            <div className="step-num">04</div>
                            <h4>Build & Scale</h4>
                            <p>Connect, collaborate, and grow. Use Starto AI for market intelligence, track your network growth, and keep raising signals as your startup evolves through each stage.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── PLATFORM PREVIEW ─────────────────────────────────────── */}
            <section className="platform-section">
                <div className="container">
                    <div className="platform-inner">
                        <div className="platform-text">
                            <div className="section-eyebrow reveal">Signal Feed</div>
                            <h2 className="section-title reveal reveal-delay-1">
                                The pulse of<br /><span className="alt">startup India.</span>
                            </h2>
                            <p className="section-body reveal reveal-delay-2">
                                Your feed surfaces the most relevant signals from your city, industry, and network — updated in real time, 24/7.
                            </p>
                            <div className="platform-list reveal reveal-delay-3">
                                <div className="platform-list-item">
                                    <div className="platform-list-item-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    </div>
                                    <div className="platform-list-item-text">
                                        <h5>Time-Bound Signals</h5>
                                        <p>Every signal expires in 7 days, keeping the feed fresh, urgent, and actionable.</p>
                                    </div>
                                </div>
                                <div className="platform-list-item">
                                    <div className="platform-list-item-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                                    </div>
                                    <div className="platform-list-item-text">
                                        <h5>Smart Discovery</h5>
                                        <p>Search across all signals by city, industry, signal type, or keyword with instant results.</p>
                                    </div>
                                </div>
                                <div className="platform-list-item">
                                    <div className="platform-list-item-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.45 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                    </div>
                                    <div className="platform-list-item-text">
                                        <h5>Instant Chat</h5>
                                        <p>One-click direct messaging to anyone who responds to your signal — no gatekeeping.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="platform-mockup reveal reveal-delay-2">
                            <div className="mockup-header">
                                <div className="mockup-dot red"></div>
                                <div className="mockup-dot yellow"></div>
                                <div className="mockup-dot green"></div>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)', marginLeft: '8px', letterSpacing: '0.06em' }}>starto.io / feed</span>
                            </div>
                            <div className="mockup-body">
                                <div className="signal-card-preview">
                                    <div className="signal-card-top">
                                        <div className="signal-card-user">
                                            <div className="signal-avatar">RK</div>
                                            <div>
                                                <div className="signal-username">@rohit_k</div>
                                                <div className="signal-time">2h · Pune</div>
                                            </div>
                                        </div>
                                        <span className="signal-badge funding">Funding</span>
                                    </div>
                                    <div className="signal-title">Looking for angel investors with SaaS experience for our B2B logistics platform</div>
                                    <div className="signal-body">Pre-seed stage, 3 paying customers, seeking ₹50L–₹1Cr bridge round to reach Series A metrics...</div>
                                    <div className="signal-footer">
                                        <span className="signal-stat">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                            12 responses
                                        </span>
                                        <span className="signal-stat">6 days left</span>
                                    </div>
                                </div>
                                <div className="signal-card-preview">
                                    <div className="signal-card-top">
                                        <div className="signal-card-user">
                                            <div className="signal-avatar" style={{ background: 'linear-gradient(135deg,#34d399,#10b981)' }}>AM</div>
                                            <div>
                                                <div className="signal-username">@anjali_m</div>
                                                <div className="signal-time">5h · Nagpur</div>
                                            </div>
                                        </div>
                                        <span className="signal-badge mentor">Mentor</span>
                                    </div>
                                    <div className="signal-title">Need a GTM mentor with FMCG distribution experience for Tier-3 market entry</div>
                                    <div className="signal-body">Building a direct-to-farmer agri-input platform. Need someone who has cracked last-mile distribution...</div>
                                    <div className="signal-footer">
                                        <span className="signal-stat">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                            8 responses
                                        </span>
                                        <span className="signal-stat">5 days left</span>
                                    </div>
                                </div>
                                <div className="signal-card-preview">
                                    <div className="signal-card-top">
                                        <div className="signal-card-user">
                                            <div className="signal-avatar" style={{ background: 'linear-gradient(135deg,#60a5fa,#3b82f6)' }}>VT</div>
                                            <div>
                                                <div className="signal-username">@v_tech</div>
                                                <div className="signal-time">8h · Indore</div>
                                            </div>
                                        </div>
                                        <span className="signal-badge collab">Collab</span>
                                    </div>
                                    <div className="signal-title">React Native developer needed for fintech MVP — equity + salary offer</div>
                                    <div className="signal-body">We have a working backend and design system. Looking for a strong mobile developer for 6-month equity stake...</div>
                                    <div className="signal-footer">
                                        <span className="signal-stat">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                            21 responses
                                        </span>
                                        <span className="signal-stat">3 days left</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── METRICS ──────────────────────────────────────────────── */}
            <section className="metrics">
                <div className="container">
                    <div className="section-eyebrow reveal">By the Numbers</div>
                    <h2 className="section-title reveal reveal-delay-1">
                        Ecosystem<br /><span className="alt">momentum.</span>
                    </h2>
                    <div className="metrics-grid">
                        <div className="metric-card reveal">
                            <div className="metric-big">500<span className="suffix">+</span></div>
                            <div className="metric-label">Verified founders building across India — from the first idea to first funding round and beyond.</div>
                            <div className="metric-sub">Active Founders</div>
                        </div>
                        <div className="metric-card reveal reveal-delay-1">
                            <div className="metric-big">48<span className="suffix">+</span></div>
                            <div className="metric-label">Cities across India with active Starto founders — from Nashik to Guwahati, beyond the metros.</div>
                            <div className="metric-sub">Tier-2 & Tier-3 cities</div>
                        </div>
                        <div className="metric-card reveal reveal-delay-2">
                            <div className="metric-big">84<span className="suffix">%</span></div>
                            <div className="metric-label">of Help Signals raised on Starto receive at least one meaningful response within 24 hours.</div>
                            <div className="metric-sub">Same-day response rate</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CITIES MARQUEE ───────────────────────────────────────── */}
            <section className="cities">
                <div className="container">
                    <div className="section-eyebrow reveal">Our Geography</div>
                    <h2 className="section-title reveal reveal-delay-1" style={{ marginBottom: '8px' }}>
                        Built for the<br /><span className="alt">real India.</span>
                    </h2>
                    <p className="section-body reveal reveal-delay-2">Starto is live in 48+ cities. We go where the real builders are.</p>
                </div>
                <div className="cities-marquee-wrap" style={{ marginTop: '60px' }}>
                    <div className="cities-marquee">
                        <div className="city-pill"><span className="city-dot"></span>Bangalore</div>
                        <div className="city-pill"><span className="city-dot"></span>Mysuru</div>
                        <div className="city-pill"><span className="city-dot"></span>Mangalore</div>
                        <div className="city-pill"><span className="city-dot"></span>Hubli</div>
                        <div className="city-pill"><span className="city-dot"></span>Hassan</div>
                        <div className="city-pill"><span className="city-dot"></span>Dharwad</div>
                        <div className="city-pill"><span className="city-dot"></span>Belagavi</div>
                        <div className="city-pill"><span className="city-dot"></span>Bommasandra</div>
                        <div className="city-pill"><span className="city-dot"></span>Bagalkot</div>
                        <div className="city-pill"><span className="city-dot"></span>Kollegala</div>
                        <div className="city-pill"><span className="city-dot"></span>Khanatti</div>
                        <div className="city-pill"><span className="city-dot"></span>Davangere</div>
                        <div className="city-pill"><span className="city-dot"></span>Chikkanayakanahalli</div>
                        <div className="city-pill"><span className="city-dot"></span>Tumkur</div>
                        <div className="city-pill"><span className="city-dot"></span>Nelamangala</div>
                        <div className="city-pill"><span className="city-dot"></span>Koppal</div>
                        <div className="city-pill"><span className="city-dot"></span>Chamarajanagara</div>
                        <div className="city-pill"><span className="city-dot"></span>Chitradurga</div>
                        <div className="city-pill"><span className="city-dot"></span>Doddaballapur</div>
                        <div className="city-pill"><span className="city-dot"></span>Bangarpet</div>
                        <div className="city-pill"><span className="city-dot"></span>Kalburgi</div>
                        <div className="city-pill"><span className="city-dot"></span>Hyderabad</div>
                        <div className="city-pill"><span className="city-dot"></span>Visakhapatnam</div>
                        <div className="city-pill"><span className="city-dot"></span>Chennai</div>
                        <div className="city-pill"><span className="city-dot"></span>Coimbatore</div>
                        <div className="city-pill"><span className="city-dot"></span>Kochi</div>
                        <div className="city-pill"><span className="city-dot"></span>Madurai</div>
                        <div className="city-pill"><span className="city-dot"></span>Tiruchirappalli</div>
                        <div className="city-pill"><span className="city-dot"></span>Vijayawada</div>
                        <div className="city-pill"><span className="city-dot"></span>Guntur</div>
                        <div className="city-pill"><span className="city-dot"></span>Warangal</div>
                        <div className="city-pill"><span className="city-dot"></span>Nellore</div>
                        <div className="city-pill"><span className="city-dot"></span>Kurnool</div>
                        <div className="city-pill"><span className="city-dot"></span>Shimoga</div>
                        <div className="city-pill"><span className="city-dot"></span>Udupi</div>
                        <div className="city-pill"><span className="city-dot"></span>Bidar</div>
                        <div className="city-pill"><span className="city-dot"></span>Bellary</div>
                        <div className="city-pill"><span className="city-dot"></span>Gadag</div>
                        <div className="city-pill"><span className="city-dot"></span>Raichur</div>
                        <div className="city-pill"><span className="city-dot"></span>Pune</div>
                        <div className="city-pill"><span className="city-dot"></span>Indore</div>
                        <div className="city-pill"><span className="city-dot"></span>Jaipur</div>
                        <div className="city-pill"><span className="city-dot"></span>Surat</div>
                        <div className="city-pill"><span className="city-dot"></span>Ahmedabad</div>
                        <div className="city-pill"><span className="city-dot"></span>Lucknow</div>
                        <div className="city-pill"><span className="city-dot"></span>Bhopal</div>
                        <div className="city-pill"><span className="city-dot"></span>Nashik</div>
                        <div className="city-pill"><span className="city-dot"></span>Nagpur</div>
                        {/* duplicate for seamless loop */}
                        <div className="city-pill"><span className="city-dot"></span>Bangalore</div>
                        <div className="city-pill"><span className="city-dot"></span>Mysuru</div>
                        <div className="city-pill"><span className="city-dot"></span>Mangalore</div>
                        <div className="city-pill"><span className="city-dot"></span>Hubli</div>
                        <div className="city-pill"><span className="city-dot"></span>Hassan</div>
                        <div className="city-pill"><span className="city-dot"></span>Dharwad</div>
                        <div className="city-pill"><span className="city-dot"></span>Belagavi</div>
                        <div className="city-pill"><span className="city-dot"></span>Bommasandra</div>
                        <div className="city-pill"><span className="city-dot"></span>Bagalkot</div>
                        <div className="city-pill"><span className="city-dot"></span>Kollegala</div>
                        <div className="city-pill"><span className="city-dot"></span>Khanatti</div>
                        <div className="city-pill"><span className="city-dot"></span>Davangere</div>
                        <div className="city-pill"><span className="city-dot"></span>Chikkanayakanahalli</div>
                        <div className="city-pill"><span className="city-dot"></span>Tumkur</div>
                        <div className="city-pill"><span className="city-dot"></span>Nelamangala</div>
                        <div className="city-pill"><span className="city-dot"></span>Koppal</div>
                        <div className="city-pill"><span className="city-dot"></span>Chamarajanagara</div>
                        <div className="city-pill"><span className="city-dot"></span>Chitradurga</div>
                        <div className="city-pill"><span className="city-dot"></span>Doddaballapur</div>
                        <div className="city-pill"><span className="city-dot"></span>Bangarpet</div>
                        <div className="city-pill"><span className="city-dot"></span>Kalburgi</div>
                        <div className="city-pill"><span className="city-dot"></span>Hyderabad</div>
                        <div className="city-pill"><span className="city-dot"></span>Visakhapatnam</div>
                        <div className="city-pill"><span className="city-dot"></span>Chennai</div>
                        <div className="city-pill"><span className="city-dot"></span>Coimbatore</div>
                        <div className="city-pill"><span className="city-dot"></span>Kochi</div>
                        <div className="city-pill"><span className="city-dot"></span>Madurai</div>
                        <div className="city-pill"><span className="city-dot"></span>Tiruchirappalli</div>
                        <div className="city-pill"><span className="city-dot"></span>Vijayawada</div>
                        <div className="city-pill"><span className="city-dot"></span>Guntur</div>
                        <div className="city-pill"><span className="city-dot"></span>Warangal</div>
                        <div className="city-pill"><span className="city-dot"></span>Nellore</div>
                        <div className="city-pill"><span className="city-dot"></span>Kurnool</div>
                        <div className="city-pill"><span className="city-dot"></span>Shimoga</div>
                        <div className="city-pill"><span className="city-dot"></span>Udupi</div>
                        <div className="city-pill"><span className="city-dot"></span>Bidar</div>
                        <div className="city-pill"><span className="city-dot"></span>Bellary</div>
                        <div className="city-pill"><span className="city-dot"></span>Gadag</div>
                        <div className="city-pill"><span className="city-dot"></span>Raichur</div>
                        <div className="city-pill"><span className="city-dot"></span>Pune</div>
                        <div className="city-pill"><span className="city-dot"></span>Indore</div>
                        <div className="city-pill"><span className="city-dot"></span>Jaipur</div>
                        <div className="city-pill"><span className="city-dot"></span>Surat</div>
                        <div className="city-pill"><span className="city-dot"></span>Ahmedabad</div>
                        <div className="city-pill"><span className="city-dot"></span>Lucknow</div>
                        <div className="city-pill"><span className="city-dot"></span>Bhopal</div>
                        <div className="city-pill"><span className="city-dot"></span>Nashik</div>
                        <div className="city-pill"><span className="city-dot"></span>Nagpur</div>
                    </div>
                </div>
            </section>

            {/* ── PLANS ────────────────────────────────────────────────── */}
            <section className="plans">
                <div className="container">
                    <div className="section-eyebrow reveal">Pricing</div>
                    <h2 className="section-title reveal reveal-delay-1">
                        Start free.<br /><span className="alt">scale up.</span>
                    </h2>
                    <p className="section-body reveal reveal-delay-2" style={{ marginBottom: 0 }}>Transparent pricing designed to grow with every stage of your startup journey.</p>
                    <div className="plans-grid">
                        <div className="plan-card reveal">
                            <div className="plan-name">Starter</div>
                            <div className="plan-price">₹0</div>
                            <div className="plan-price-sub">Forever free · No credit card needed</div>
                            <div className="plan-divider"></div>
                            <div className="plan-features">
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    6 Active Signals
                                </div>
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    3 Connection Offers
                                </div>
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    3 AI Analysis calls per day
                                </div>
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    Space Signals
                                </div>
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    Nearby Feature
                                </div>
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    Instant Notification
                                </div>
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    Signal Insight
                                </div>
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    AI Execution Real World Report
                                </div>
                            </div>
                            <Link href="/auth" className="btn-plan btn-plan-outline">Get Started Free</Link>
                        </div>
                        <div className="plan-card featured reveal reveal-delay-1">
                            <div className="plan-name">Growth</div>
                            <div className="plan-price">₹499</div>
                            <div className="plan-price-sub">per month · billed monthly</div>
                            <div className="plan-divider"></div>
                            <div className="plan-features">
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    Unlimited Signals
                                </div>
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    Unlimited Offers
                                </div>
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    Unlimited AI Analysis
                                </div>
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    Connect on WhatsApp
                                </div>
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    Space Signals
                                </div>
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    Verification Badge
                                </div>
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    Nearby Feature
                                </div>
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    Instant Notification
                                </div>
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    Signal Insight
                                </div>
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    AI Execution Real World Report
                                </div>
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    Starto Manual Support
                                </div>
                            </div>
                            <Link href="/subscription" className="btn-plan btn-plan-dark">Upgrade to Growth</Link>
                        </div>
                        <div className="plan-card reveal reveal-delay-2">
                            <div className="plan-name">Pro</div>
                            <div className="plan-price">₹999</div>
                            <div className="plan-price-sub">per month · billed monthly</div>
                            <div className="plan-divider"></div>
                            <div className="plan-features">
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    100 Active Signals
                                </div>
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    Unlimited Offers
                                </div>
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    20 AI Analysis calls
                                </div>
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    Connect on WhatsApp
                                </div>
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    Space Signals
                                </div>
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    Verification Badge
                                </div>
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    Nearby Feature
                                </div>
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    Instant Notification
                                </div>
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    Signal Insight
                                </div>
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    AI Execution Real World Report
                                </div>
                                <div className="plan-feature">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    Starto Manual Support
                                </div>
                            </div>
                            <Link href="/subscription" className="btn-plan btn-plan-outline">Get Pro</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── TESTIMONIALS ─────────────────────────────────────────── */}
            <section className="testimonials">
                <div className="container">
                    <div className="section-eyebrow reveal">From Our Builders</div>
                    <h2 className="section-title reveal reveal-delay-1">
                        Real results,<br /><span className="alt">real founders.</span>
                    </h2>
                    <div className="testimonials-grid">
                        <div className="testimonial-card reveal">
                            <div className="testimonial-stars">
                                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                            </div>
                            <p className="testimonial-quote">Within 3 days of posting my signal, I had 7 responses from investors who actually understood the agri-tech space. One of them is now our lead angel. Starto is how India should do startup networking.</p>
                            <div className="testimonial-author">
                                <div className="testimonial-avatar">PD</div>
                                <div>
                                    <div className="testimonial-name">Priya Deshmukh</div>
                                    <div className="testimonial-meta">Founder, AgriLink · Pune</div>
                                </div>
                            </div>
                        </div>
                        <div className="testimonial-card reveal reveal-delay-1">
                            <div className="testimonial-stars">
                                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                            </div>
                            <p className="testimonial-quote">I found my CTO through Starto. Not LinkedIn. Not referrals. I raised a collab signal, and within 48 hours I had a brilliant developer who was also looking for exactly the same kind of opportunity. It works.</p>
                            <div className="testimonial-author">
                                <div className="testimonial-avatar">RS</div>
                                <div>
                                    <div className="testimonial-name">Rahul Singh</div>
                                    <div className="testimonial-meta">Co-Founder, FinSathi · Indore</div>
                                </div>
                            </div>
                        </div>
                        <div className="testimonial-card reveal reveal-delay-2">
                            <div className="testimonial-stars">
                                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                            </div>
                            <p className="testimonial-quote">The AI Market Report saved us 3 weeks of market research. It understood our niche — EV accessories for Tier-2 cities — and gave us data that even big consultancies wouldn't have for our specific geography.</p>
                            <div className="testimonial-author">
                                <div className="testimonial-avatar">NK</div>
                                <div>
                                    <div className="testimonial-name">Neel Kulkarni</div>
                                    <div className="testimonial-meta">Founder, VoltUp · Nashik</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── TEAM ─────────────────────────────────────────────────── */}
            <section className="team">
                <div className="container">
                    <div className="section-eyebrow reveal">The Builders</div>
                    <h2 className="section-title reveal reveal-delay-1">
                        Meet the<br /><span className="alt">ecosystem architects.</span>
                    </h2>
                    <p className="section-body reveal reveal-delay-2">We build what we believe — a platform we wish we'd had when we started.</p>
                    <div className="team-grid">
                        <div className="team-card reveal">
                            <div className="team-avatar">
                                <img src="/team/krishna.png" alt="Krishna Murthi" className="team-img" />
                            </div>
                            <div className="team-info">
                                <div className="team-name">Krishna Murthi</div>
                                <div className="team-role">Founder & CEO</div>
                            </div>
                        </div>
                        <div className="team-card reveal reveal-delay-1">
                            <div className="team-avatar">
                                <img src="/team/akshay.png" alt="Akshay Hangargi" className="team-img" />
                            </div>
                            <div className="team-info">
                                <div className="team-name">Akshay Hangargi</div>
                                <div className="team-role">Co-Founder</div>
                            </div>
                        </div>
                        <div className="team-card reveal reveal-delay-2">
                            <div className="team-avatar">
                                <img src="/team/sagar.png" alt="Sagar Ghate" className="team-img" />
                            </div>
                            <div className="team-info">
                                <div className="team-name">Sagar Ghate</div>
                                <div className="team-role">Backend Dev</div>
                            </div>
                        </div>
                        <div className="team-card reveal reveal-delay-1">
                            <div className="team-avatar">
                                <img src="/team/guru.png" alt="Guru Hugar" className="team-img" />
                            </div>
                            <div className="team-info">
                                <div className="team-name">Guru Hugar</div>
                                <div className="team-role">Frontend Dev</div>
                            </div>
                        </div>
                        <div className="team-card reveal reveal-delay-2">
                            <div className="team-avatar">
                                <img src="/team/kartik.png" alt="Kartik Malipatil" className="team-img" />
                            </div>
                            <div className="team-info">
                                <div className="team-name">Kartik Malipatil</div>
                                <div className="team-role">AI Engineer</div>
                            </div>
                        </div>
                        <div className="team-card reveal reveal-delay-3">
                            <div className="team-avatar">
                                <img src="/team/aziz.png" alt="Aziz M Nadaf" className="team-img" />
                            </div>
                            <div className="team-info">
                                <div className="team-name">Aziz M Nadaf</div>
                                <div className="team-role">Android Dev</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA ──────────────────────────────────────────────────── */}
            <section className="cta">
                <div className="container">
                    <div className="cta-inner reveal">
                        <div className="cta-eyebrow">Start today. It's free.</div>
                        <h2 className="cta-title">
                            Your ecosystem<br />awaits.
                        </h2>
                        <p className="cta-sub">Join 500+ founders already building in the places where it actually matters — and the networks that actually respond.</p>
                        <div className="cta-actions">
                            <Link href="/auth" className="btn-cta-dark">
                                Enter the Ecosystem
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </Link>
                            <Link href="/subscription" className="btn-cta-ghost">See Pricing</Link>
                        </div>
                    </div>
                </div>
            </section>

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
                                <a href="https://www.instagram.com/startoindia?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" className="social-btn" target="_blank" rel="noopener noreferrer">
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
                        <div className="footer-copy">© 2026 Starto. All rights reserved.</div>
                        <div className="footer-love">Built with <span>♥</span> for Bharat</div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
