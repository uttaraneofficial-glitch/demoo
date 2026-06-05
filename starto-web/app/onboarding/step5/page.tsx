"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Loader2, Rocket } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useOnboardingStore } from '@/store/useOnboardingStore'
import { useAuthStore } from '@/store/useAuthStore'
import { usersApi } from '@/lib/apiClient'

export default function OnboardingStep5() {
    const router = useRouter()
    const onboarding = useOnboardingStore()
    const { token, updateUser } = useAuthStore()
    
    const [username, setUsername] = useState(onboarding.username)
    const [bio, setBio] = useState(onboarding.bio)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleEnterStarto = async () => {
        setLoading(true)
        setError(null)
        
        try {
            const { data, error: apiError } = await usersApi.updateProfile({
                name: onboarding.name || username,
                username: username,
                bio: bio,
                role: onboarding.role,
                industry: onboarding.industry,
                city: onboarding.city,
                address: onboarding.address,
                lat: onboarding.lat || undefined,
                lng: onboarding.lng || undefined,
                avatarUrl: onboarding.avatarUrl
            })

            if (data) {
                updateUser(data)
                router.push('/feed')
            } else {
                setError(apiError || "Failed to update profile. Please try again.")
            }
        } catch (err) {
            setError("Something went wrong. Check your connection.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6 font-sans">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#161618] p-10 rounded-[2rem] border border-white/5 max-w-lg w-full shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/5 blur-[100px] rounded-full" />

                <div className="relative z-10">
                    <div className="mb-10 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] uppercase font-bold tracking-widest mb-4">
                            Step 05 / 05
                        </div>
                        <h2 className="text-3xl font-display text-background mb-3">Set up your identity.</h2>
                        <p className="text-text-muted text-sm">Final step to enter the Starto ecosystem.</p>
                    </div>

                    <div className="flex flex-col items-center mb-10">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary mb-6 block">Select your avatar</label>
                        <div className="grid grid-cols-4 gap-4 w-full">
                            {[1, 2, 3, 4].map(num => {
                                const url = `/avatars/avatar${num}.svg`;
                                const isSelected = onboarding.avatarUrl === url;
                                return (
                                    <button 
                                        key={num}
                                        onClick={() => onboarding.setAvatar(url)}
                                        className={`relative w-full aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 ${
                                            isSelected ? 'border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]' : 'border-white/5 grayscale hover:grayscale-0'
                                        }`}
                                    >
                                        <img src={(process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080') + url} className="w-full h-full object-cover" alt={`Avatar ${num}`} />
                                        {isSelected && (
                                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                <Check className="w-6 h-6 text-text-primary" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[10px] text-text-secondary mt-4 font-medium uppercase tracking-tighter">
                            {onboarding.avatarUrl ? 'Selected Platform Avatar' : 'No selection — using Letter DP instead'}
                        </p>
                    </div>

                    <div className="space-y-6 mb-10">
                        <div>
                            <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary mb-2 block">Username</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-bold group-focus-within:text-primary transition-colors">@</span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="your_handle"
                                    className="w-full bg-surface/5 p-4 pl-10 rounded-xl outline-none border border-white/5 focus:border-primary/50 focus:bg-surface/10 transition-all text-background text-sm"
                                />
                                {username.length > 3 && (
                                    <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-green" />
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary block">Bio</label>
                                <span className="text-[10px] text-text-secondary font-bold uppercase">{bio.length}/300</span>
                            </div>
                            <textarea
                                maxLength={300}
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Your ecosystem mission..."
                                className="w-full bg-surface/5 p-4 rounded-xl outline-none border border-white/5 focus:border-primary/50 focus:bg-surface/10 transition-all text-background text-sm h-32 resize-none"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs text-center">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleEnterStarto}
                        disabled={!username || loading}
                        className={`w-full py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 shadow-xl ${
                            username && !loading
                            ? 'bg-primary text-text-primary hover:scale-[1.02] active:scale-[0.98]' 
                            : 'bg-surface/5 text-text-secondary cursor-not-allowed'
                        }`}
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Enter Starto
                                <Rocket className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
