"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import './events.css';
import { startups } from './data/startups';

export default function EventsPage() {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredStartups = startups.filter(startup => {
        const query = searchQuery.toLowerCase();
        return (
            startup.name.toLowerCase().includes(query) ||
            startup.industry.toLowerCase().includes(query) ||
            startup.city.toLowerCase().includes(query)
        );
    });

    return (
        <div className="sarathi-body">
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
