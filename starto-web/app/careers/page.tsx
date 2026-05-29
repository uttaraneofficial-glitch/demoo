"use client"

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useAuthStore } from '@/store/useAuthStore'
import { Briefcase, ArrowLeft, Twitter, Linkedin, Github, Mail, Heart, Zap } from 'lucide-react'

export default function CareersPage() {
    const { isAuthenticated, user } = useAuthStore();
    return (
        <div className="min-h-screen bg-background text-primary selection:bg-primary selection:text-background">
            
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-[100] px-10 h-[72px] flex items-center justify-between bg-background/80 backdrop-blur-[20px] border-b border-border transition-all duration-300">
                <Link href="/" className="flex items-center gap-[10px] no-underline">
                    <img src="/logo.png" alt="Starto Logo" className="h-[56px] w-auto block dark:invert" />
                </Link>
                <ul className="hidden md:flex items-center gap-[36px] list-none m-0 p-0">
                    <li><Link href="/" className="text-[11px] font-bold uppercase tracking-[2px] text-text-secondary hover:text-primary transition-all">Home</Link></li>
                    <li><Link href="/about" className="text-[11px] font-bold uppercase tracking-[2px] text-text-secondary hover:text-primary transition-all">About</Link></li>
                    <li><Link href="/feed" className="text-[11px] font-bold uppercase tracking-[2px] text-text-secondary hover:text-primary transition-all">Platform</Link></li>
                    <li><Link href="/subscription" className="text-[11px] font-bold uppercase tracking-[2px] text-text-secondary hover:text-primary transition-all">Pricing</Link></li>
                    <li><Link href="/careers" className="text-[11px] font-bold uppercase tracking-[2px] text-primary transition-all border-b-2 border-primary pb-1">Careers</Link></li>
                </ul>
                <div className="flex items-center gap-5">
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
                            <Link href="/auth" className="text-[11px] font-bold uppercase tracking-[2px] text-text-secondary hover:text-primary transition-all">Sign In</Link>
                            <Link href="/auth" className="bg-primary text-background px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-[1px] hover:opacity-80 transition-all">
                                Get Started →
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            <main className="pt-52 pb-32 px-6 flex flex-col items-center justify-center">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center max-w-2xl"
                >
                    <div className="w-20 h-20 bg-surface rounded-3xl flex items-center justify-center mx-auto mb-10 border border-border shadow-xl">
                        <Briefcase className="w-8 h-8 text-primary" />
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl font-display uppercase tracking-tighter mb-6">
                        Join the <span className="text-text-muted">Ecosystem</span>
                    </h1>
                    
                    <div className="w-16 h-px bg-primary mx-auto mb-10" />
                    
                    <p className="text-text-secondary text-xl leading-relaxed mb-12 italic">
                        "We are currently not hiring at the moment, but we are always looking for passionate builders to join the Starto vision."
                    </p>
                    
                    <div className="p-8 rounded-[2rem] bg-surface border border-border text-sm font-mono tracking-wider text-text-muted uppercase shadow-sm">
                        No active positions available right now. <br />
                        Stay tuned for future opportunities.
                    </div>
                </motion.div>
            </main>

            {/* Comprehensive Footer */}
            <footer className="bg-surface-2 pt-24 pb-12 px-6 md:px-12 border-t border-border mt-32">
                <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-3 mb-8">
                            <Image src="/logo.png" alt="Starto" width={160} height={52} className="object-contain dark:invert" />
                        </div>
                        <p className="text-text-secondary text-lg max-w-sm leading-relaxed mb-10">
                            A unified growth ecosystem for Tier-2 & Tier-3 investor hubs. 
                            Built to empower the next generation of Indian entrepreneurs.
                        </p>
                        <div className="flex gap-6">
                            <a href="https://x.com/Startoindia" target="_blank" rel="noopener noreferrer">
                                <Twitter className="w-5 h-5 text-text-muted hover:text-primary cursor-pointer transition-colors" />
                            </a>
                            <a href="https://www.linkedin.com/company/startoindia/" target="_blank" rel="noopener noreferrer">
                                <Linkedin className="w-5 h-5 text-text-muted hover:text-primary cursor-pointer transition-colors" />
                            </a>
                            <Github className="w-5 h-5 text-text-muted hover:text-primary cursor-pointer transition-colors" />
                            <a href="mailto:startoindiaofficial@gmail.com">
                                <Mail className="w-5 h-5 text-text-muted hover:text-primary cursor-pointer transition-colors" />
                            </a>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mb-10">Ecosystem</h4>
                        <ul className="space-y-4 text-text-secondary text-sm font-medium">
                            <li className="hover:text-primary transition-colors cursor-pointer">Real-time Signals</li>
                            <li className="hover:text-primary transition-colors cursor-pointer">AI Market Explore</li>
                            <li className="hover:text-primary transition-colors cursor-pointer">Geospatial Nodes</li>
                            <li className="hover:text-primary transition-colors cursor-pointer">Verified Connections</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mb-10">Company</h4>
                        <ul className="space-y-4 text-text-secondary text-sm font-medium">
                            <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                            <li><Link href="/careers" className="hover:text-primary transition-colors">Careers</Link></li>
                            <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                            <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                            <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center border-t border-border pt-12 gap-6">
                    <p className="text-text-muted font-mono text-[9px] tracking-[0.3em] uppercase">
                        &copy; 2026 STARTO ECOSYSTEM PVT LTD. ALL RIGHTS RESERVED.
                    </p>
                    <div className="flex gap-10">
                        <Heart className="w-4 h-4 text-accent-red animate-pulse" />
                        <span className="text-text-muted font-mono text-[9px] tracking-[0.3em] uppercase">MADE IN BHARAT</span>
                    </div>
                </div>
            </footer>
        </div>
    )
}
