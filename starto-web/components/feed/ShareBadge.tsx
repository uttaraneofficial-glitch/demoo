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
            className="w-[1080px] h-[1920px] bg-black text-white flex flex-col justify-between p-24 font-sans relative overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
                fontFamily: "'DM Sans', sans-serif"
            }}
        >
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[1000px] h-[1000px] bg-white/5 blur-[200px] rounded-full translate-y-1/3 -translate-x-1/4" />

            {/* Top Branding */}
            <div className="flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center p-3">
                        <img src="/icon.png" className="w-full h-full object-contain filter invert" alt="Starto" />
                    </div>
                    <span className="text-4xl font-bold tracking-tighter">Starto</span>
                </div>
                <div className="px-6 py-3 border-2 border-white/20 rounded-full text-2xl font-bold uppercase tracking-widest text-white/60">
                    {type === 'profile' ? 'Ecosystem Member' : 'Active Signal'}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="z-10 flex flex-col items-center justify-center flex-1 my-24">
                
                {/* Avatar Section */}
                <div className="relative mb-12">
                    <div className="w-[320px] h-[320px] rounded-[3rem] overflow-hidden border-8 border-white/10 shadow-2xl bg-white/5 flex items-center justify-center">
                        <VerifiedAvatar 
                            username={username}
                            avatarUrl={avatarUrl}
                            plan={plan}
                            size="w-[320px] h-[320px]"
                            badgeSize="w-24 h-24"
                            className="!rounded-none"
                        />
                    </div>
                </div>

                {type === 'profile' ? (
                    /* PROFILE BADGE */
                    <div className="text-center space-y-8 w-full max-w-[800px]">
                        <h1 className="text-7xl font-bold tracking-tight text-white">{name || username}</h1>
                        <p className="text-3xl text-white/60 font-mono tracking-widest uppercase">@{username}</p>
                        
                        <div className="flex items-center justify-center gap-6 text-2xl text-white/80 mt-8 bg-white/5 py-6 px-12 rounded-3xl border border-white/10 backdrop-blur-md">
                            {role && <span className="capitalize flex items-center gap-2"><Zap className="w-8 h-8 text-primary" /> {role}</span>}
                            {role && city && <span className="w-2 h-2 rounded-full bg-white/20" />}
                            {city && <span className="flex items-center gap-2"><MapPin className="w-8 h-8 text-primary" /> {city}</span>}
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-8 mt-16">
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-md text-center">
                                <p className="text-7xl font-bold text-white mb-4">{stats?.signals || 0}</p>
                                <p className="text-xl text-white/50 uppercase tracking-[0.2em] font-bold">Signals</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-md text-center">
                                <p className="text-7xl font-bold text-white mb-4">{stats?.connections || 0}</p>
                                <p className="text-xl text-white/50 uppercase tracking-[0.2em] font-bold">Network</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-md text-center">
                                <p className="text-7xl font-bold text-primary flex items-center justify-center gap-2 mb-4">
                                    {stats?.rating ? stats.rating.toFixed(1) : '—'}
                                    {stats?.rating && <Star className="w-12 h-12 fill-primary" />}
                                </p>
                                <p className="text-xl text-white/50 uppercase tracking-[0.2em] font-bold">Rating</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* SIGNAL BADGE */
                    <div className="text-center space-y-8 w-full max-w-[900px]">
                        <div className="inline-flex items-center gap-3 px-6 py-3 bg-primary/20 text-primary border border-primary/30 rounded-full text-2xl font-bold uppercase tracking-widest mb-4">
                            <Activity className="w-8 h-8" /> {signalData?.category || 'General'}
                        </div>
                        
                        <h1 className="text-7xl font-bold tracking-tight text-white leading-tight">{signalData?.title}</h1>
                        
                        <div className="flex items-center justify-center gap-4 text-3xl text-white/60 font-mono mt-8">
                            <span>Raised by</span>
                            <span className="text-white font-bold tracking-widest uppercase">@{username}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mt-16 w-full max-w-[700px] mx-auto">
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-md text-center flex flex-col items-center justify-center">
                                <Zap className="w-16 h-16 text-primary mb-6" />
                                <p className="text-5xl font-bold text-white mb-3">{stats?.responses || 0}</p>
                                <p className="text-xl text-white/50 uppercase tracking-[0.2em] font-bold">Responses</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-md text-center flex flex-col items-center justify-center">
                                <Clock className="w-16 h-16 text-white mb-6" />
                                <p className="text-5xl font-bold text-white mb-3">{stats?.progress ? Math.round(stats.progress) : 100}%</p>
                                <p className="text-xl text-white/50 uppercase tracking-[0.2em] font-bold">Urgency</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Footer */}
            <div className="z-10 text-center border-t border-white/10 pt-12 flex flex-col items-center">
                <div className="bg-white text-black px-12 py-6 rounded-full text-3xl font-bold shadow-2xl shadow-white/10 mb-8 flex items-center gap-4">
                    <img src="/icon.png" className="w-10 h-10 object-contain" alt="Starto" />
                    Join the ecosystem at starto.app
                </div>
                <p className="text-2xl text-white/40 font-mono tracking-widest">
                    {type === 'profile' ? `starto.app/profile/${username}` : `starto.app/signals/`}
                </p>
            </div>

        </div>
    )
})

ShareBadge.displayName = 'ShareBadge'
