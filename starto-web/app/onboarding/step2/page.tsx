"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Rocket, GraduationCap, Coins, Briefcase } from 'lucide-react'

const roles = [
    { id: 'founder', title: 'Founder', desc: 'Building something', icon: Rocket },
    { id: 'mentor', title: 'Mentor', desc: 'Guiding others', icon: GraduationCap },
    { id: 'investor', title: 'Investor', desc: 'Funding growth', icon: Coins },
    { id: 'talent', title: 'Talent', desc: 'Ready to contribute', icon: Briefcase },
]

export default function OnboardingStep2() {
    const [selected, setSelected] = useState('')

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-8 rounded-xl shadow-md border border-border max-w-xl w-full"
            >
                <h2 className="text-3xl mb-2">What best describes you?</h2>
                <p className="text-text-secondary mb-8">Select one role to continue.</p>

                <div className="grid grid-cols-2 gap-4">
                    {roles.map((role) => {
                        const Icon = role.icon
                        const isSelected = selected === role.id
                        return (
                            <button
                                key={role.id}
                                onClick={() => setSelected(role.id)}
                                className={`flex flex-col items-center text-center p-6 rounded-lg border-2 transition-all ${isSelected
                                        ? 'bg-primary text-background border-primary shadow-lg'
                                        : 'bg-white text-primary border-border hover:border-text-muted'
                                    }`}
                            >
                                <Icon className={`w-10 h-10 mb-4 ${isSelected ? 'text-white' : 'text-primary'}`} />
                                <h3 className="font-medium text-lg mb-1">{role.title}</h3>
                                <p className={`text-sm ${isSelected ? 'text-text-muted' : 'text-text-secondary'}`}>{role.desc}</p>
                            </button>
                        )
                    })}
                </div>

                <button
                    disabled={!selected}
                    className={`w-full mt-8 py-4 rounded-md font-medium transition-all ${selected ? 'bg-primary text-background hover:opacity-90' : 'bg-surface-2 text-text-muted cursor-not-allowed'
                        }`}
                >
                    Continue
                </button>
            </motion.div>
        </div>
    )
}
