"use client"

import React, { forwardRef } from 'react'
import VerifiedAvatar from './VerifiedAvatar'
import { MapPin, Zap, Star, Activity, Clock } from 'lucide-react'

interface ShareBadgeProps {
    type: 'profile' | 'signal'
    username: string
    name?: string
    avatarUrl?: string | null
    plan?: string | null
    role?: string
    city?: string
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
    stats,
    signalData 
}, ref) => {
    
    return (
        <div 
            ref={ref}
            className="w-[1080px] h-[1920px] bg-[#030303] text-white flex flex-col p-20 font-sans relative overflow-hidden"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
            {/* Massive Glowing Ambient Orbs */}
            <div className="absolute top-[-10%] left-[-20%] w-[1000px] h-[1000px] bg-primary/30 blur-[250px] rounded-full mix-blend-screen" />
            <div className="absolute bottom-[-10%] right-[-20%] w-[1200px] h-[1200px] bg-blue-600/20 blur-[250px] rounded-full mix-blend-screen" />
            
            {/* Grid Texture Overlay */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CiAgPHBhdGggZD0iTTAgMGg0MHY0MEgwVjB6bTIwIDIwYzAgMTEuMDQ2LTguOTU0IDIwLTIwIDIwUzAgMzEuMDQ2IDAgMjAgOC45NTQgMCAyMCAwczIwIDguOTU0IDIwIDIweiIgZmlsbD0iI2ZmZmZmZiIgZmlsbC1vcGFjaXR5PSIwLjAxIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz4KPC9zdmc+')] opacity-50" />

            {/* Header Branding */}
            <div className="flex justify-between items-center z-10 w-full mb-16">
                <div className="flex items-center gap-4">
                    <img src="/icon.png" className="w-16 h-16 object-contain filter invert opacity-90" alt="Starto" />
                    <span className="text-4xl font-black tracking-tight uppercase text-white/90">Starto</span>
                </div>
                <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-xl font-bold uppercase tracking-[0.2em] text-white/60 backdrop-blur-md">
                    {type === 'profile' ? 'Ecosystem Member' : 'Live Signal'}
                </div>
            </div>

            {/* Central Glass Card */}
            <div className="z-10 flex-1 flex flex-col items-center justify-center w-full relative">
                <div className="w-full bg-white/[0.02] border border-white/10 rounded-[4rem] p-16 flex flex-col items-center shadow-[0_0_100px_rgba(0,0,0,0.5)] backdrop-blur-2xl relative">
                    
                    {/* Floating Avatar */}
                    <div className="absolute -top-32 left-1/2 -translate-x-1/2">
                        <div className="w-[260px] h-[260px] rounded-[3rem] overflow-hidden border-4 border-white/20 shadow-2xl bg-[#111] flex items-center justify-center p-2">
                            <VerifiedAvatar 
                                username={username}
                                avatarUrl={avatarUrl}
                                plan={plan}
                                size="w-[240px] h-[240px]"
                                badgeSize="w-20 h-20"
                                className="!rounded-[2.5rem]"
                            />
                        </div>
                    </div>

                    {type === 'profile' ? (
                        /* PROFILE BADGE CONTENT */
                        <div className="text-center space-y-6 w-full mt-32">
                            <h1 className="text-[5.5rem] font-black tracking-tighter text-white leading-none">{name || username}</h1>
                            <p className="text-3xl text-primary font-mono tracking-widest uppercase">@{username}</p>
                            
                            <div className="flex items-center justify-center gap-6 text-2xl text-white/70 mt-10">
                                {role && <span className="capitalize font-semibold tracking-wide">{role}</span>}
                                {role && city && <span className="w-2 h-2 rounded-full bg-white/30" />}
                                {city && <span className="font-semibold tracking-wide flex items-center gap-2"><MapPin className="w-6 h-6" /> {city}</span>}
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-3 gap-6 mt-16 w-full">
                                <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 text-center flex flex-col justify-center">
                                    <p className="text-6xl font-black text-white mb-2">{stats?.signals || 0}</p>
                                    <p className="text-lg text-white/40 uppercase tracking-[0.2em] font-bold">Signals</p>
                                </div>
                                <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 text-center flex flex-col justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50" />
                                    <p className="text-6xl font-black text-white mb-2 relative z-10">{stats?.connections || 0}</p>
                                    <p className="text-lg text-primary/80 uppercase tracking-[0.2em] font-bold relative z-10">Network</p>
                                </div>
                                <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 text-center flex flex-col justify-center">
                                    <p className="text-6xl font-black text-white flex items-center justify-center gap-2 mb-2">
                                        {stats?.rating ? stats.rating.toFixed(1) : '?"'}
                                        {stats?.rating && <Star className="w-10 h-10 fill-yellow-500 text-yellow-500" />}
                                    </p>
                                    <p className="text-lg text-white/40 uppercase tracking-[0.2em] font-bold">Rating</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* SIGNAL BADGE CONTENT */
                        <div className="text-center w-full mt-32">
                            <div className="inline-flex items-center gap-3 px-6 py-2 bg-primary/10 text-primary border border-primary/20 rounded-full text-xl font-bold uppercase tracking-[0.2em] mb-10">
                                <Activity className="w-6 h-6" /> {signalData?.category || 'General'}
                            </div>
                            
                            <h1 className="text-6xl font-black tracking-tight text-white leading-tight mb-8 line-clamp-3 px-4">{signalData?.title}</h1>
                            
                            <div className="flex items-center justify-center gap-4 text-2xl text-white/50 font-mono">
                                <span>Raised by</span>
                                <span className="text-primary font-bold tracking-widest uppercase">@{username}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mt-16 w-full max-w-[800px] mx-auto">
                                <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-10 text-center flex flex-col items-center justify-center">
                                    <Zap className="w-12 h-12 text-primary mb-6" />
                                    <p className="text-6xl font-black text-white mb-3">{stats?.responses || 0}</p>
                                    <p className="text-lg text-white/40 uppercase tracking-[0.2em] font-bold">Responses</p>
                                </div>
                                <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-10 text-center flex flex-col items-center justify-center">
                                    <Clock className="w-12 h-12 text-white/80 mb-6" />
                                    <p className="text-6xl font-black text-white mb-3">{stats?.progress ? Math.round(stats.progress) : 100}%</p>
                                    <p className="text-lg text-white/40 uppercase tracking-[0.2em] font-bold">Urgency</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Futuristic Footer */}
            <div className="z-10 w-full mt-10">
                <div className="bg-white text-black w-full py-8 rounded-[2rem] text-3xl font-black uppercase tracking-[0.1em] flex items-center justify-center gap-4 shadow-[0_10px_40px_rgba(255,255,255,0.15)] hover:scale-[1.02] transition-transform">
                    Join the ecosystem at starto.app
                </div>
                <div className="text-center mt-8">
                    <p className="text-2xl text-white/30 font-mono tracking-[0.3em]">
                        {type === 'profile' ? `STARTO.APP/PROFILE/${username.toUpperCase()}` : `STARTO.APP/SIGNALS`}
                    </p>
                </div>
            </div>
        </div>
    )
})

ShareBadge.displayName = 'ShareBadge'
