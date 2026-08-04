"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import '../events.css';
import { eventStartupsApi } from '@/lib/apiClient';

export default function ProfilePage({ params }: { params: { slug: string } }) {
    const [startup, setStartup] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStartup = async () => {
            try {
                const data = await eventStartupsApi.getBySlug(params.slug);
                if (!data) notFound();
                setStartup(data);
            } catch (err) {
                console.error("Failed to fetch startup", err);
                notFound();
            } finally {
                setLoading(false);
            }
        };
        fetchStartup();
    }, [params.slug]);

    if (loading) return <div className="sarathi-body flex items-center justify-center p-20">Loading...</div>;
    if (!startup) return <div className="sarathi-body flex items-center justify-center p-20">Startup not found.</div>;

    return (
        <div className="sarathi-body">
            {/* Header / Cover */}
            <header className="sarathi-profile-header animate-fade-up">
                <img src={startup.coverUrl} alt="Cover" className="sarathi-profile-cover" />
                <div className="sarathi-profile-overlay"></div>
                
                {/* Back Button */}
                <div className="sarathi-container" style={{ position: 'absolute', top: '2rem', left: '0', right: '0', zIndex: 20 }}>
                    <Link href="/events" style={{ color: 'white', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 500 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        Back to Exhibition
                    </Link>
                </div>
            </header>

            {/* Profile Content */}
            <main className="sarathi-profile-content animate-fade-up delay-100">
                <div className="sarathi-container" style={{ maxWidth: '800px' }}>
                    <img src={startup.logoUrl} alt={startup.name} className="sarathi-profile-logo animate-fade-up delay-200" />
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }} className="animate-fade-up delay-300">
                        <div>
                            <h1 className="sarathi-h1" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '0.5rem' }}>{startup.name}</h1>
                            <p style={{ fontSize: '1.25rem', color: 'var(--sarathi-text-muted)', fontWeight: 400, maxWidth: '500px' }}>"{startup.tagline}"</p>
                        </div>
                        <a href={startup.website} target="_blank" rel="noopener noreferrer" className="sarathi-btn sarathi-btn-primary">
                            Visit Website
                        </a>
                    </div>

                    <div className="sarathi-profile-meta animate-fade-up delay-300">
                        <span className="sarathi-badge">{startup.industry}</span>
                        <span className="sarathi-badge">{startup.city}</span>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid var(--sarathi-border)', margin: '3rem 0' }} />

                    <section className="sarathi-section animate-fade-up delay-300">
                        <h2 className="sarathi-section-title">The Mission</h2>
                        <p className="sarathi-body-text" style={{ fontSize: '1.25rem', color: 'var(--sarathi-text)' }}>
                            {startup.mission}
                        </p>
                    </section>

                    <section className="sarathi-section animate-fade-up delay-300">
                        <h2 className="sarathi-section-title">Contribution to Viksit Bharat 2047</h2>
                        <div className="sarathi-highlight-box">
                            <p className="sarathi-body-text" style={{ color: 'var(--sarathi-text)', margin: 0, fontSize: '1.125rem' }}>
                                {startup.viksitBharatContribution}
                            </p>
                        </div>
                    </section>

                </div>
            </main>

            {/* Mobile Sticky CTA */}
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '1rem', background: 'var(--sarathi-surface)', borderTop: '1px solid var(--sarathi-border)', zIndex: 50, display: 'flex', justifyContent: 'center' }} className="mobile-cta">
                <a href={startup.website} target="_blank" rel="noopener noreferrer" className="sarathi-btn sarathi-btn-primary" style={{ width: '100%', maxWidth: '400px' }}>
                    Visit Website
                </a>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @media (min-width: 768px) {
                    .mobile-cta { display: none !important; }
                }
            `}} />
        </div>
    );
}
