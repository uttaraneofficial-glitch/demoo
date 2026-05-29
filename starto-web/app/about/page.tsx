"use client"

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useAuthStore } from '@/store/useAuthStore'
import { Zap, Shield, Globe, Cpu, Heart, Twitter, Linkedin, Github, Mail, ArrowRight } from 'lucide-react'

const allTeam = [
    { name: 'Krishna Murthi', role: 'Founder & CEO', image: '/team/krishna.png' },
    { name: 'Akshay Hangargi', role: 'Co-Founder', image: '/team/akshay.png' },
    { name: 'Sagar Ghate', role: 'Backend Developer', image: '/team/sagar.png' },
    { name: 'Guru Hugar', role: 'Frontend Developer', image: '/team/guru.png' },
    { name: 'Kartik Malipatil', role: 'AI Engineer', image: '/team/kartik.png' },
    { name: 'Aziz M Nadaf', role: 'Android Developer', image: '/team/aziz.png' }
]

export default function AboutPage() {
    const { isAuthenticated, user } = useAuthStore();
    return (
        <div className="min-h-screen bg-background text-primary selection:bg-primary selection:text-background">
            
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-[100] px-10 h-[72px] flex items-center justify-between bg-background/80 backdrop-blur-[20px] border-b border-border transition-all duration-300">
                <Link href="/" className="flex items-center gap-[10px] no-underline">
                    <img src="/logo.png" alt="Starto Logo" className="h-[56px] w-auto block dark:invert" />
                </Link>
                <ul className="hidden md:flex items-center gap-[36px] list-none m-0 p-0">
                    <li><Link href="/about" className="text-[11px] font-bold uppercase tracking-[2px] text-primary transition-all border-b-2 border-primary pb-1">About</Link></li>
                    <li><Link href="/feed" className="text-[11px] font-bold uppercase tracking-[2px] text-text-secondary hover:text-primary transition-all">Platform</Link></li>
                    <li><Link href="/subscription" className="text-[11px] font-bold uppercase tracking-[2px] text-text-secondary hover:text-primary transition-all">Pricing</Link></li>
                    <li><Link href="/careers" className="text-[11px] font-bold uppercase tracking-[2px] text-text-secondary hover:text-primary transition-all">Careers</Link></li>
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

            <main className="pt-52 pb-32 px-6 max-w-[1400px] mx-auto">
                
                {/* Intro Quotes Section */}
                <section className="mb-40 text-center relative">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1 }}
                    >
                        <p className="text-primary font-mono text-[10px] tracking-[0.5em] uppercase mb-10">The Mission</p>
                        <h2 className="text-4xl md:text-7xl font-display uppercase tracking-tighter leading-[0.9] mb-12">
                            Innovation is not about an idea.<br />
                            It's about the <span className="text-text-muted">Ecosystem.</span>
                        </h2>
                        <div className="w-24 h-px bg-border mx-auto mb-12" />
                        <p className="text-text-secondary text-xl max-w-3xl mx-auto italic leading-relaxed">
                            "Starto was built on the belief that the next generation of Indian giants will emerge 
                            from Tier-2 and Tier-3 cities. We don't just provide networking; we provide the ground 
                            where vision actually finds its way to work."
                        </p>
                    </motion.div>
                </section>

                {/* Team Grid */}
                <section className="mb-60">
                    <div className="text-center mb-24">
                        <h2 className="text-4xl md:text-6xl font-display uppercase tracking-tight">The Builders</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {allTeam.map((member, idx) => (
                            <motion.div
                                key={member.name}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex flex-col group"
                            >
                                <div className="rounded-[2.5rem] bg-white overflow-hidden shadow-sm transition-all duration-500 group-hover:shadow-xl group-hover:-translate-y-1">
                                    <div className="w-full aspect-[4/5] relative">
                                        <Image 
                                            src={member.image} 
                                            alt={member.name}
                                            fill
                                            className="object-contain"
                                            priority={idx < 3}
                                        />
                                    </div>
                                </div>
                                <div className="mt-8 px-4 text-center md:text-left">
                                    <h4 className="text-2xl font-bold text-primary mb-2">{member.name}</h4>
                                    <p className="text-xs text-text-muted font-bold uppercase tracking-widest">{member.role}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Closing Vision Section */}
                <section className="py-40 border-t border-border text-center">
                    <Zap className="w-12 h-12 text-primary fill-primary mx-auto mb-10" />
                    <h3 className="text-3xl md:text-5xl font-display uppercase tracking-tight mb-8">
                        Building for the <br /> 500 Million.
                    </h3>
                    <p className="text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed mb-12">
                        Starto V3 is the culmination of years of ecosystem research. 
                        We are bridging the intelligence gap for founders who are 
                        building the future of Bharat.
                    </p>
                    <Link href="/feed" className="inline-flex items-center gap-3 bg-primary text-background px-12 py-5 rounded-full font-bold text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/10">
                        Join the Ecosystem <ArrowRight className="w-4 h-4" />
                    </Link>
                </section>

            </main>

            {/* Comprehensive Footer */}
            <footer className="bg-surface-2 pt-24 pb-12 px-6 md:px-12 border-t border-border">
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
