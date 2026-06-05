"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, Link as LinkIcon, Building2, CheckCircle2 } from 'lucide-react'
import { useSignalStore } from '@/store/useSignalStore'
import { useNetworkStore } from '@/store/useNetworkStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useRouter } from 'next/navigation'
import StatusModal from '@/components/feed/StatusModal'

interface HelpModalProps {
    isOpen: boolean
    onClose: () => void
    signalId: string
    signalTitle: string
}

export default function HelpModal({ isOpen, onClose, signalId, signalTitle }: HelpModalProps) {
    const { incrementOffer } = useSignalStore()
    const addOffer = useNetworkStore(state => state.addOffer)
    const { user } = useAuthStore()
    const router = useRouter()
    
    const [organizationName, setOrganizationName] = useState('')
    const [portfolioLink, setPortfolioLink] = useState('')
    const [message, setMessage] = useState('')
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [error, setError] = useState('')
    const [statusModal, setStatusModal] = useState<{isOpen: boolean, type: 'success' | 'error' | 'upgrade', title: string, message: string}>({
        isOpen: false,
        type: 'error',
        title: '',
        message: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Simple URL Validation
        const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/
        if (!portfolioLink.match(urlPattern)) {
            setError('Please provide a valid URL (e.g., https://linkedin.com/in/...)')
            return
        }

        try {
            await addOffer({
                signalId: signalId,
                organizationName: organizationName,
                portfolioLink: portfolioLink,
                message: message || `I'm interested in helping with: ${signalTitle}`
            });
            incrementOffer(signalId)
            setIsSubmitted(true)
            setTimeout(() => {
                setIsSubmitted(false)
                setOrganizationName('')
                setPortfolioLink('')
                setMessage('')
                onClose()
            }, 2000)
        } catch (err: any) {
            if (err.status === 403) {
                setStatusModal({
                    isOpen: true,
                    type: 'upgrade',
                    title: 'Upgrade Required',
                    message: `Limit reached! Your ${user?.plan || 'Explorer'} plan limit is exceeded.`
                })
            } else {
                setError(err.message || 'Failed to send offer. Please try again.')
            }
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-surface w-full max-w-[480px] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        <div className="p-6 border-b border-border flex justify-between items-center bg-surface relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent-blue" />
                            <div>
                                <h2 className="text-xl font-bold font-display">Offer Help</h2>
                                <p className="text-xs text-text-muted mt-1 truncate max-w-[300px]">For: {signalTitle}</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-surface-2 rounded-full transition-all text-text-muted">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {isSubmitted ? (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center justify-center py-8 text-center"
                                >
                                    <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle2 className="w-8 h-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold text-primary mb-2">Offer Sent!</h3>
                                    <p className="text-sm text-text-secondary">Thank you for stepping up to help.</p>
                                </motion.div>
                            ) : (
                                <>
                                    <section>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2 block text-left">Your Name / Organization</label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                            <input
                                                type="text"
                                                placeholder="John Doe / TechCorp"
                                                className="w-full bg-surface-2 border border-border p-3 pl-10 rounded-xl outline-none focus:border-black text-sm transition-colors"
                                                value={organizationName}
                                                onChange={(e) => setOrganizationName(e.target.value)}
                                            />
                                        </div>
                                    </section>

                                    <section>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2 block text-left">Most Recent Project Link</label>
                                        <div className="relative">
                                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                            <input
                                                type="url"
                                                placeholder="https://github.com/johndoe/project"
                                                className={`w-full bg-surface-2 border ${error ? 'border-red-500' : 'border-border'} p-3 pl-10 rounded-xl outline-none focus:border-black text-sm transition-colors`}
                                                value={portfolioLink}
                                                onChange={(e) => {
                                                    setPortfolioLink(e.target.value)
                                                    if (error) setError('')
                                                }}
                                            />
                                        </div>
                                        {error && <p className="text-[10px] text-red-500 mt-1 text-left">{error}</p>}
                                    </section>

                                    <section>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2 block text-left">Quick Message</label>
                                        <textarea
                                            placeholder="Tell them how you can help..."
                                            rows={2}
                                            className="w-full bg-surface-2 border border-border p-3 rounded-xl outline-none focus:border-black text-sm transition-colors resize-none"
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                        />
                                        <p className="text-[10px] text-text-muted mt-2 text-left">Provides context and credibility to your offer.</p>
                                    </section>

                                    <button 
                                        onClick={handleSubmit}
                                        disabled={!organizationName || !portfolioLink}
                                        className="w-full bg-primary text-background px-8 py-3.5 rounded-xl font-bold text-xs tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase mt-auto"
                                    >
                                        <Zap className="w-4 h-4 fill-background text-background" /> Send Offer
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
            
            <StatusModal
                isOpen={statusModal.isOpen}
                onClose={() => {
                    setStatusModal(prev => ({...prev, isOpen: false}))
                    if (statusModal.type === 'upgrade') {
                        onClose()
                        router.push('/subscription')
                    }
                }}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
            />
        </AnimatePresence>
    )
}

