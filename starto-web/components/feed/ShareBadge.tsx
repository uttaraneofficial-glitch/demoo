"use client"

import React, { forwardRef } from 'react'
import VerifiedAvatar from './VerifiedAvatar'
import { MapPin, Zap, Star, Activity, Clock, Quote } from 'lucide-react'

interface ShareBadgeProps {
    type: 'profile' | 'signal'
    username: string
    name?: string
    avatarUrl?: string | null
    plan?: string | null
    role?: string
    city?: string
    bio?: string
    stats?: {
        signals?: number
        connections?: number
        rating?: number
        responses?: number
        views?: number
        progress?: number
    }
    signalData?: {
        title: string
        category: string
        strength: string
    }
}

export const ShareBadge = forwardRef<HTMLDivElement, ShareBadgeProps>(({ 
    type, 
    username, 
    name, 
    avatarUrl, 
    plan, 
    role, 
    city, 
    bio,
    stats,
    signalData 
}, ref) => {
    
    return (
        <div 
            ref={ref}
            className="w-[1080px] h-[1350px] bg-[#050505] text-white flex flex-col justify-between p-16 font-sans relative overflow-hidden"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
            {/* Massive Premium Glowing Ambient Orbs */}
            <div className="absolute top-[-20%] left-[-20%] w-[900px] h-[900px] bg-primary/40 blur-[200px] rounded-full mix-blend-screen opacity-80" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[1000px] h-[1000px] bg-indigo-600/30 blur-[250px] rounded-full mix-blend-screen opacity-70" />
            
            {/* Subtle Grid Texture */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CiAgPHBhdGggZD0iTTAgMGg0MHY0MEgwVjB6bTIwIDIwYzAgMTEuMDQ2LTguOTU0IDIwLTIwIDIwUzAgMzEuMDQ2IDAgMjAgOC45NTQgMCAyMCAwczIwIDguOTU0IDIwIDIweiIgZmlsbD0iI2ZmZmZmZiIgZmlsbC1vcGFjaXR5PSIwLjAyIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz4KPC9zdmc+')] opacity-60" />

            {/* Header / Branding */}
            <div className="flex justify-between items-center z-10 w-full">
                <div className="flex items-center gap-4">
                    <img src="/icon.png" className="w-16 h-16 object-contain filter invert opacity-90" alt="Starto" />
                    <span className="text-4xl font-black tracking-tighter uppercase text-white">Starto</span>
                </div>
                <div className="px-6 py-2 bg-white/[0.08] border border-white/20 rounded-full text-xl font-bold uppercase tracking-[0.2em] text-white/80 backdrop-blur-md shadow-lg">
                    {type === 'profile' ? 'Ecosystem Member' : 'Live Signal'}
                </div>
            </div>

            {/* Main Central Card */}
            <div className="z-10 flex-1 flex flex-col items-center justify-center w-full relative my-12">
                <div className="w-full bg-white/[0.04] border border-white/10 rounded-[3rem] p-16 flex flex-col items-center shadow-[0_20px_100px_rgba(0,0,0,0.6)] backdrop-blur-2xl relative">
                    
                    {/* Nested Glow inside the card */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-[3rem] pointer-events-none" />

                    {/* Floating Avatar */}
                    <div className="absolute -top-28 left-1/2 -translate-x-1/2">
                        <div className="w-[220px] h-[220px] rounded-[2.5rem] overflow-hidden border-4 border-white/20 shadow-2xl bg-[#111] flex items-center justify-center p-2 relative">
                            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                            <VerifiedAvatar 
                                username={username}
                                avatarUrl={avatarUrl}
                                plan={plan}
                                size="w-[200px] h-[200px]"
                                badgeSize="w-16 h-16"
                                className="!rounded-[2rem] relative z-10"
                            />
                        </div>
                    </div>

                    {type === 'profile' ? (
                        /* PROFILE CARD CONTENT */
                        <div className="text-center space-y-6 w-full mt-28 relative z-10">
                            <h1 className="text-7xl font-black tracking-tighter text-white leading-none drop-shadow-lg">{name || username}</h1>
                            <p className="text-3xl text-primary font-mono tracking-widest uppercase drop-shadow-md">@{username}</p>
                            
                            <div className="flex items-center justify-center gap-6 text-2xl text-white/80 mt-6 font-medium">
                                {role && <span className="capitalize">{role}</span>}
                                {role && city && <span className="w-2 h-2 rounded-full bg-white/40" />}
                                {city && <span className="flex items-center gap-2"><MapPin className="w-6 h-6" /> {city}</span>}
                            </div>

                            {/* Bio Section */}
                            {bio && (
                                <div className="mt-8 px-12 py-6 bg-black/20 border border-white/5 rounded-3xl relative max-w-[800px] mx-auto text-left">
                                    <Quote className="absolute top-4 left-4 w-6 h-6 text-primary/40 rotate-180" />
                                    <p className="text-xl text-white/70 italic leading-relaxed text-center px-8">{bio}</p>
                                    <Quote className="absolute bottom-4 right-4 w-6 h-6 text-primary/40" />
                                </div>
                            )}

                            {/* Stats Row */}
                            <div className="grid grid-cols-3 gap-6 mt-12 w-full max-w-[900px] mx-auto">
                                <div className="bg-black/30 border border-white/10 rounded-3xl p-8 text-center flex flex-col justify-center transition-all hover:bg-black/50">
                                    <p className="text-6xl font-black text-white mb-2">{stats?.signals || 0}</p>
                                    <p className="text-lg text-white/50 uppercase tracking-[0.2em] font-bold">Signals</p>
                                </div>
                                <div className="bg-primary/10 border border-primary/30 rounded-3xl p-8 text-center flex flex-col justify-center relative overflow-hidden shadow-[0_0_30px_rgba(var(--primary),0.2)]">
                                    <p className="text-6xl font-black text-white mb-2 relative z-10">{stats?.connections || 0}</p>
                                    <p className="text-lg text-primary uppercase tracking-[0.2em] font-bold relative z-10">Network</p>
                                </div>
                                <div className="bg-black/30 border border-white/10 rounded-3xl p-8 text-center flex flex-col justify-center transition-all hover:bg-black/50">
                                    <p className="text-6xl font-black text-white flex items-center justify-center gap-2 mb-2">
                                        {stats?.rating && stats.rating > 0 ? stats.rating.toFixed(1) : '—'}
                                        <Star className={`w-10 h-10 ${(stats?.rating && stats.rating > 0) ? 'fill-yellow-500 text-yellow-500' : 'text-white/20'}`} />
                                    </p>
                                    <p className="text-lg text-white/50 uppercase tracking-[0.2em] font-bold">Rating</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* SIGNAL CARD CONTENT */
                        <div className="text-center w-full mt-28 relative z-10">
                            <div className="inline-flex items-center gap-3 px-6 py-2 bg-primary/20 text-primary border border-primary/30 rounded-full text-xl font-bold uppercase tracking-[0.2em] mb-8 shadow-lg shadow-primary/10">
                                <Activity className="w-6 h-6" /> {signalData?.category || 'General'}
                            </div>
                            
                            <h1 className="text-6xl font-black tracking-tight text-white leading-tight mb-8 line-clamp-3 px-4 drop-shadow-xl">{signalData?.title}</h1>
                            
                            <div className="flex items-center justify-center gap-4 text-2xl text-white/60 font-mono bg-black/20 py-4 px-8 rounded-full border border-white/5 max-w-fit mx-auto">
                                <span>Raised by</span>
                                <span className="text-primary font-bold tracking-widest uppercase">@{username}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mt-12 w-full max-w-[800px] mx-auto">
                                <div className="bg-black/30 border border-white/10 rounded-[2rem] p-10 text-center flex flex-col items-center justify-center shadow-inner">
                                    <Zap className="w-12 h-12 text-primary mb-4" />
                                    <p className="text-6xl font-black text-white mb-2">{stats?.responses || 0}</p>
                                    <p className="text-lg text-white/50 uppercase tracking-[0.2em] font-bold">Responses</p>
                                </div>
                                <div className="bg-black/30 border border-white/10 rounded-[2rem] p-10 text-center flex flex-col items-center justify-center shadow-inner">
                                    <Clock className="w-12 h-12 text-white/80 mb-4" />
                                    <p className="text-6xl font-black text-white mb-2">{stats?.progress ? Math.round(stats.progress) : 100}%</p>
                                    <p className="text-lg text-white/50 uppercase tracking-[0.2em] font-bold">Urgency</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Footer */}
            <div className="z-10 w-full mt-4 flex flex-col items-center gap-6">
                <div className="bg-white text-black w-full py-6 rounded-3xl text-3xl font-black uppercase tracking-[0.05em] flex items-center justify-center gap-4 shadow-[0_10px_40px_rgba(255,255,255,0.2)]">
                    Join the ecosystem at startoindia.com
                </div>
                <p className="text-xl text-white/40 font-mono tracking-[0.25em] bg-black/40 py-2 px-6 rounded-full border border-white/5">
                    {type === 'profile' ? `STARTOINDIA.COM/PROFILE/${username.toUpperCase()}` : `STARTOINDIA.COM/SIGNALS`}
                </p>
            </div>
        </div>
    )
})

ShareBadge.displayName = 'ShareBadge'
