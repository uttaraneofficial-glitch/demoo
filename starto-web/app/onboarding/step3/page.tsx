"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'

const industries = [
    "AgriTech", "EdTech", "FinTech", "HealthTech", "RetailTech", "LogiTech",
    "CleanTech", "FoodTech", "PropTech", "HRTech", "LegalTech", "GovTech",
    "SpaceTech", "DeepTech", "SaaS", "eCommerce", "Manufacturing", "Other"
]

export default function OnboardingStep3() {
    const [query, setQuery] = useState('')
    const [selected, setSelected] = useState('')

    const filtered = industries.filter(i => i.toLowerCase().includes(query.toLowerCase()))

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface p-8 rounded-xl shadow-md border border-border max-w-lg w-full"
            >
                <h2 className="text-3xl mb-8">What is your industry?</h2>

                <div className="mb-8">
                    <label className="text-sm font-medium mb-4 block">What is your industry?</label>
                    <input
                        type="text"
                        placeholder="e.g. AgriTech, EdTech..."
                        value={selected}
                        onChange={(e) => setSelected(e.target.value)}
                        className="w-full bg-surface-2 p-4 rounded-md outline-none focus:ring-2 focus:ring-primary/10 border border-border focus:border-text-muted transition-all"
                    />
                </div>

                <button
                    disabled={!selected}
                    className={`w-full py-4 rounded-md font-medium transition-all ${selected ? 'bg-primary text-background hover:opacity-90' : 'bg-surface-2 text-text-muted cursor-not-allowed'
                        }`}
                >
                    Continue
                </button>
            </motion.div>
        </div>
    )
}
