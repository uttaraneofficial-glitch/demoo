"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import '../landing.css';
import './events.css';
import { useAuthStore } from '@/store/useAuthStore';
import { eventStartupsApi } from '@/lib/apiClient';

export default function EventsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [scrolled, setScrolled] = useState(false);
    const { isAuthenticated, user } = useAuthStore();
    const [startups, setStartups] = useState<any[]>([]);

    useEffect(() => {
        const fetchStartups = async () => {
            try {
                const data = await eventStartupsApi.getAll();
                if (Array.isArray(data)) {
                    setStartups(data);
                } else {
                    console.warn("API did not return an array. Using empty array.", data);
                    setStartups([]);
                }
            } catch (err) {
                console.error("Failed to fetch startups", err);
                setStartups([]);
            }
        };
        fetchStartups();

        const handleScroll = () => {
            setScrolled(window.scrollY > 40);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const filteredStartups = startups.filter(startup => {
        const query = searchQuery.toLowerCase();
        return (
            startup.name.toLowerCase().includes(query) ||
            startup.industry.toLowerCase().includes(query) ||
            startup.city.toLowerCase().includes(query)
        );
    });

    return (
        <div className="sarathi-body" style={{ paddingTop: '72px' }}>
            {/* ── GLOBAL NAVIGATION ──────────────────────────────────────────── */}
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
                    <li><Link href="/events">Events</Link></li>
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

            {/* HERO SECTION */}
            <section className="sarathi-hero">
                <div className="sarathi-container">
                    <h1 className="sarathi-h1 animate-fade-up">SARATHI 2047</h1>
                    <h2 className="sarathi-subtitle animate-fade-up delay-100" style={{ margin: '0 auto 2rem' }}>
                        Building Viksit Bharat.<br/>One Startup at a Time.
                    </h2>
                    <p className="sarathi-body-text animate-fade-up delay-200" style={{ maxWidth: '700px', margin: '0 auto 3rem' }}>
                        SARATHI 2047 is Starto India's Independence Day initiative dedicated to celebrating startups that are solving real-world problems and building the future of India.
                    </p>
                    <div className="animate-fade-up delay-300">
                        <a href="#showcase" className="sarathi-btn sarathi-btn-primary">
                            Explore Startups
                        </a>
                    </div>
                </div>
            </section>

            {/* STATS SECTION */}
            <section className="sarathi-stats">
                <div className="sarathi-container">
                    <div className="sarathi-stats-grid">
                        <div className="animate-fade-up">
                            <div className="sarathi-stat-number">{startups.length}</div>
                            <div className="sarathi-stat-label">Startups Showcased</div>
                        </div>
                        <div className="animate-fade-up delay-100">
                            <div className="sarathi-stat-number">4</div>
                            <div className="sarathi-stat-label">Cities Represented</div>
                        </div>
                        <div className="animate-fade-up delay-200">
                            <div className="sarathi-stat-number">4</div>
                            <div className="sarathi-stat-label">Industries</div>
                        </div>
                        <div className="animate-fade-up delay-300">
                            <div className="sarathi-stat-number">2047</div>
                            <div className="sarathi-stat-label">Vision</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SHOWCASE SECTION */}
            <section id="showcase" className="sarathi-showcase">
                <div className="sarathi-container">
                    <div className="sarathi-filter-bar animate-fade-up">
                        <h2 className="sarathi-h2" style={{ marginBottom: 0 }}>Startup Showcase</h2>
                        <input 
                            type="text" 
                            className="sarathi-search" 
                            placeholder="Search by name, industry, or city..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="sarathi-grid">
                        {filteredStartups.map((startup, index) => (
                            <div key={startup.id} className={`sarathi-card animate-fade-up`} style={{ animationDelay: `${(index % 3) * 100}ms` }}>
                                <div className="sarathi-card-header">
                                    <img src={startup.logoUrl} alt={startup.name} className="sarathi-card-logo" />
                                    <div>
                                        <h3 className="sarathi-card-title">{startup.name}</h3>
                                        <div className="sarathi-card-meta">
                                            <span>{startup.industry}</span>
                                            <span>{startup.city}</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="sarathi-card-mission">"{startup.tagline}"</p>
                                <div className="sarathi-card-actions">
                                    <Link href={`/events/${startup.slug}`} className="sarathi-btn sarathi-btn-primary">
                                        View Profile
                                    </Link>
                                    <a href={startup.website} target="_blank" rel="noopener noreferrer" className="sarathi-btn sarathi-btn-outline">
                                        Website
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredStartups.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--sarathi-text-muted)' }}>
                            No startups found matching your search.
                        </div>
                    )}
                </div>
            </section>

            {/* FOOTER */}
            <footer style={{ borderTop: '1px solid var(--sarathi-border)', padding: '4rem 0', textAlign: 'center', background: 'var(--sarathi-surface)' }}>
                <div className="sarathi-container">
                    <p style={{ fontWeight: 500, marginBottom: '1rem', color: 'var(--sarathi-text)' }}>
                        Every startup featured here is contributing towards the vision of Viksit Bharat 2047.
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--sarathi-text-muted)' }}>
                        Powered by Startoindia
                    </p>
                </div>
            </footer>
        </div>
    );
}
