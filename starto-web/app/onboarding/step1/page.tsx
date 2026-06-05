"use client"

import { motion } from 'framer-motion'
import { LogIn, Mail, Smartphone } from 'lucide-react'

export default function OnboardingStep1() {
    return (
        <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6 text-background text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-md w-full"
            >
                <h1 className="text-4xl md:text-6xl mb-2 tracking-tight">Starto</h1>
                <p className="text-text-muted mb-12 text-lg">Where Ecosystems Connect.</p>

                <div className="space-y-4">
                    <button className="w-full bg-surface text-primary py-4 px-6 rounded-md font-medium flex items-center justify-center gap-3 hover:bg-opacity-90 transition-all shadow-lg shadow-white/5">
                        <LogIn className="w-5 h-5" />
                        Continue with Google
                    </button>

                    <button className="w-full border border-white/20 text-background py-4 px-6 rounded-md font-medium flex items-center justify-center gap-3 hover:bg-surface/10 transition-all">
                        <Mail className="w-5 h-5" />
                        Continue with Email
                    </button>

                    <button className="w-full border border-white/20 text-background py-4 px-6 rounded-md font-medium flex items-center justify-center gap-3 hover:bg-surface/10 transition-all">
                        <Smartphone className="w-5 h-5" />
                        Continue with Phone
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
