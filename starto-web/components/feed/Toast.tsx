"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
    isVisible: boolean
    message: string
    type?: ToastType
    onClose: () => void
    duration?: number
}

export default function Toast({ 
    isVisible, 
    message, 
    type = 'success', 
    onClose, 
    duration = 3000 
}: ToastProps) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose()
            }, duration)
            return () => clearTimeout(timer)
        }
    }, [isVisible, duration, onClose])

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] min-w-[320px] max-w-[90vw]"
                >
                    <div className="bg-primary/90 backdrop-blur-md text-background px-6 py-4 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {type === 'success' && <CheckCircle2 className="w-5 h-5 text-background" />}
                            {type === 'error' && <XCircle className="w-5 h-5 text-red-400" />}
                            {type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
                            <p className="text-sm font-medium tracking-wide">{message}</p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-1 hover:bg-surface/10 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4 text-background/40" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
