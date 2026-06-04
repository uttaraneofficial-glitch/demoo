
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
            className="w-[1080px] h-[1350px] bg-background text-text-primary flex flex-col justify-between p-16 font-sans relative overflow-hidden"
            style={{ 
                fontFamily: "'DM Sans', sans-serif"
            }}
        >
            {/* Minimalist Background Pattern matching Starto theme */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            
            {/* Top Border Accent */}
            <div className="absolute top-0 left-0 right-0 h-4 bg-primary" />

            {/* Header / Branding */}
            <div className="flex justify-between items-center z-10 w-full mt-4">
                <div className="flex items-center gap-4">
                    {/* The logo should use current color via invert dynamically based on theme */}
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center overflow-hidden">
                        <img src="/icon.png" className="w-12 h-12 object-contain dark:invert-0 invert" alt="Starto" />
                    </div>
                    <span className="text-4xl font-display font-black tracking-tighter uppercase text-text-primary">Starto</span>
                </div>
                <div className="px-6 py-2 bg-surface-2 border border-border rounded-full text-xl font-bold uppercase tracking-[0.2em] text-text-secondary shadow-sm">
                    {type === 'profile' ? 'Ecosystem Member' : 'Live Signal'}
                </div>
            </div>

            {/* Main Central Card */}
            <div className="z-10 flex-1 flex flex-col items-center justify-center w-full relative my-12">
                <div className="w-full bg-surface border-2 border-border rounded-[3rem] p-16 flex flex-col items-center shadow-2xl relative overflow-hidden">
                    
                    {/* Floating Avatar */}
                    <div className="absolute -top-28 left-1/2 -translate-x-1/2">
                        <div className="w-[220px] h-[220px] rounded-[2.5rem] overflow-hidden border-[6px] border-surface shadow-2xl bg-surface-2 flex items-center justify-center p-2">
                            <VerifiedAvatar 
                                username={username}
                                avatarUrl={avatarUrl}
                                plan={plan}
                                size="w-[190px] h-[190px]"
                                badgeSize="w-16 h-16"
                                className="!rounded-[2rem]"
                            />
                        </div>
                    </div>

                    {type === 'profile' ? (
                        /* PROFILE CARD CONTENT */
                        <div className="text-center space-y-6 w-full mt-28 relative z-10">
                            <h1 className="text-7xl font-display font-black tracking-tighter text-text-primary leading-none">{name || username}</h1>
                            <p className="text-3xl text-text-secondary font-mono tracking-widest uppercase">@{username}</p>
                            
                            <div className="flex items-center justify-center gap-6 text-2xl text-text-muted mt-6 font-medium">
                                {role && <span className="capitalize">{role}</span>}
                                {role && city && <span className="w-2 h-2 rounded-full bg-border" />}
                                {city && <span className="flex items-center gap-2"><MapPin className="w-6 h-6" /> {city}</span>}
                            </div>

                            {/* Bio Section */}
                            {bio && (
                                <div className="mt-8 px-12 py-8 bg-surface-2 border border-border rounded-3xl relative max-w-[800px] mx-auto text-left shadow-inner">
                                    <Quote className="absolute top-6 left-6 w-8 h-8 text-border rotate-180" />
                                    <p className="text-2xl text-text-secondary italic leading-relaxed text-center px-12 font-display">{bio}</p>
                                    <Quote className="absolute bottom-6 right-6 w-8 h-8 text-border" />
                                </div>
                            )}

                            {/* Stats Row */}
                            <div className="grid grid-cols-3 gap-6 mt-12 w-full max-w-[900px] mx-auto">
                                <div className="bg-surface-2 border border-border rounded-3xl p-8 text-center flex flex-col justify-center">
                                    <p className="text-6xl font-black text-text-primary mb-2 font-display">{stats?.signals || 0}</p>
                                    <p className="text-lg text-text-muted uppercase tracking-[0.2em] font-bold">Signals</p>
                                </div>
                                <div className="bg-primary border border-primary rounded-3xl p-8 text-center flex flex-col justify-center shadow-lg transform scale-105">
                                    <p className="text-6xl font-black text-background mb-2 font-display">{stats?.connections || 0}</p>
                                    <p className="text-lg text-background/80 uppercase tracking-[0.2em] font-bold">Network</p>
                                </div>
                                <div className="bg-surface-2 border border-border rounded-3xl p-8 text-center flex flex-col justify-center">
                                    <p className="text-6xl font-black text-text-primary flex items-center justify-center gap-2 mb-2 font-display">
                                        {stats?.rating && stats.rating > 0 ? stats.rating.toFixed(1) : '�'}
                                        <Star className={`w-10 h-10 ${(stats?.rating && stats.rating > 0) ? 'fill-yellow-500 text-yellow-500' : 'text-text-muted'}`} />
                                    </p>
                                    <p className="text-lg text-text-muted uppercase tracking-[0.2em] font-bold">Rating</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* SIGNAL CARD CONTENT */
                        <div className="text-center w-full mt-28 relative z-10">
                            <div className="inline-flex items-center gap-3 px-6 py-2 bg-surface-2 text-text-primary border border-border rounded-full text-xl font-bold uppercase tracking-[0.2em] mb-8 shadow-sm">
                                <Activity className="w-6 h-6" /> {signalData?.category || 'General'}
                            </div>
                            
                            <h1 className="text-6xl font-display font-black tracking-tight text-text-primary leading-tight mb-8 line-clamp-3 px-4">{signalData?.title}</h1>
                            
                            <div className="flex items-center justify-center gap-4 text-2xl text-text-secondary font-mono bg-surface-2 py-4 px-8 rounded-full border border-border max-w-fit mx-auto">
                                <span>Raised by</span>
                                <span className="text-primary font-bold tracking-widest uppercase">@{username}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mt-12 w-full max-w-[800px] mx-auto">
                                <div className="bg-surface-2 border border-border rounded-[2rem] p-10 text-center flex flex-col items-center justify-center">
                                    <Zap className="w-12 h-12 text-primary mb-4" />
                                    <p className="text-6xl font-black text-text-primary mb-2 font-display">{stats?.responses || 0}</p>
                                    <p className="text-lg text-text-muted uppercase tracking-[0.2em] font-bold">Responses</p>
                                </div>
                                <div className="bg-surface-2 border border-border rounded-[2rem] p-10 text-center flex flex-col items-center justify-center">
                                    <Clock className="w-12 h-12 text-text-secondary mb-4" />
                                    <p className="text-6xl font-black text-text-primary mb-2 font-display">{stats?.progress ? Math.round(stats.progress) : 100}%</p>
                                    <p className="text-lg text-text-muted uppercase tracking-[0.2em] font-bold">Urgency</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Footer */}
            <div className="z-10 w-full mt-4 flex flex-col items-center gap-6">
                <div className="bg-primary text-background w-full py-6 rounded-3xl text-3xl font-black uppercase tracking-[0.05em] flex items-center justify-center gap-4 shadow-xl font-display">
                    Join the ecosystem at startoindia.com
                </div>
                <p className="text-xl text-text-muted font-mono tracking-[0.25em] bg-surface border border-border py-2 px-6 rounded-full shadow-sm">
                    {type === 'profile' ? `STARTOINDIA.COM/PROFILE/${username.toUpperCase()}` : `STARTOINDIA.COM/SIGNALS`}
                </p>
            </div>
        </div>
    )
})

ShareBadge.displayName = 'ShareBadge'
