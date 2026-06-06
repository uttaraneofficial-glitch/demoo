"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Building, Globe, Phone, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { signalsApi } from '@/lib/apiClient'
import CityAutocomplete from '@/components/CityAutocomplete'

interface CreateSpaceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SPACE_TYPES = [
    'Coworking Space',
    'Accelerator',
    'Incubator',
    'Event Hub',
    'VC Office',
    'Innovation Lab',
    'Community Cafe'
]

const ACCESS_MODELS = [
    'Free / Public',
    'Paid / Co-working',
    'Invite-Only',
    'Buy-a-Coffee'
]

const AMENITIES_LIST = [
    'Fast Wi-Fi',
    'Meeting Rooms',
    'Coffee / Tea',
    'Parking',
    'Quiet Zone',
    '24/7 Access',
    'Whiteboards'
]

export default function CreateSpaceModal({ isOpen, onClose }: CreateSpaceModalProps) {
    const { user, isAuthenticated } = useAuthStore()
    
    const [name, setName] = useState('')
    const [type, setType] = useState(SPACE_TYPES[0])
    const [description, setDescription] = useState('')
    const [address, setAddress] = useState('')
    const [city, setCity] = useState('')
    const [state, setState] = useState('')
    const [lat, setLat] = useState<number | null>(null)
    const [lng, setLng] = useState<number | null>(null)
    const [contact, setContact] = useState('')
    const [website, setWebsite] = useState('')
    
    const [accessModel, setAccessModel] = useState(ACCESS_MODELS[0])
    const [amenities, setAmenities] = useState<string[]>([])
    const [isOwner, setIsOwner] = useState(true)
    
    const [submitting, setSubmitting] = useState(false)
    const [toast, setToast] = useState<{ type: 'success' | 'warn'; msg: string } | null>(null)

    useEffect(() => {
        if (isOpen) {
            // Reset form
            setName('')
            setType(SPACE_TYPES[0])
            setDescription('')
            setAddress('')
            setCity(user?.city || '')
            setState(user?.state || '')
            setLat(user?.lat || null)
            setLng(user?.lng || null)
            setContact('')
            setWebsite('')
            setAccessModel(ACCESS_MODELS[0])
            setAmenities([])
            setIsOwner(true)
            setToast(null)
        }
    }, [isOpen, user])

    if (!isOpen) return null

    const handleSubmit = async () => {
        if (!name || !description || !city || !lat || !lng) {
            setToast({ type: 'warn', msg: 'Please fill in all required fields and select a location.' })
            return
        }

        setSubmitting(true)
        setToast(null)

        const { data, error } = await signalsApi.createSpace({
            name,
            type,
            description,
            address,
            city,
            state: state || 'India',
            lat,
            lng,
            contact,
            website,
            accessModel,
            amenities: JSON.stringify(amenities),
            isOwner
        })

        if (data && !error) {
            setToast({ type: 'success', msg: '✓ Space created successfully! Your hub is now live.' })
            setTimeout(() => {
                onClose()
            }, 1500)
        } else {
            setToast({ type: 'warn', msg: `Error: ${error || 'Failed to create space'}` })
        }
        setSubmitting(false)
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-primary/70 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-surface w-full max-w-[600px] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-border flex justify-between items-center bg-surface sticky top-0 z-10">
                        <div>
                            <h2 className="text-2xl font-bold font-display tracking-tight">Create a New Space</h2>
                            <p className="text-xs text-text-secondary mt-1 uppercase tracking-widest font-semibold opacity-60">Add your community hub to the map</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-surface-2 rounded-full transition-all text-text-muted">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                        {/* Space Name */}
                        <section>
                            <label className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3 block">Space Name <span className="text-primary">*</span></label>
                            <div className="relative group">
                                <Building className="absolute left-0 top-3 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="e.g. Starto Innovation Lab"
                                    className="w-full bg-transparent pl-8 pb-2 border-b border-border outline-none focus:border-primary text-lg font-display placeholder:text-text-muted/40 transition-all"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </section>

                        {/* Space Type */}
                        <section>
                            <label className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4 block text-center">What type of space is this?</label>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {SPACE_TYPES.map(t => (
                                    <button 
                                        key={t} 
                                        onClick={() => setType(t)}
                                        className={`px-5 py-2 rounded-full border text-xs font-bold uppercase tracking-tighter transition-all ${type === t ? 'bg-primary text-background border-primary shadow-lg shadow-black/20' : 'border-border text-text-secondary hover:border-primary hover:text-primary'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Description */}
                        <section>
                            <label className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3 block">Description <span className="text-primary">*</span></label>
                            <textarea
                                placeholder="Describe the facilities, vibe, and community focus of this space..."
                                className="w-full bg-surface-2 p-5 rounded-2xl border border-border outline-none focus:border-primary text-sm h-32 resize-none placeholder:text-text-muted/50 shadow-inner"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </section>

                        {/* Location */}
                        <section className="bg-surface-2 p-6 rounded-3xl space-y-6 border border-border/50">
                            <label className="text-xs font-bold uppercase tracking-widest text-text-muted mb-1 block flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Location Details
                            </label>
                            
                            <div className="space-y-4">
                                <div className="group">
                                    <label className="text-[10px] font-bold uppercase text-text-muted/60 mb-1 ml-1 block">Full Address / Landmark</label>
                                    <input
                                        type="text"
                                        placeholder="Floor, Building, Area..."
                                        className="w-full bg-surface px-4 py-3 rounded-xl border border-border outline-none focus:border-primary text-sm shadow-sm"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="group">
                                        <label className="text-[10px] font-bold uppercase text-text-muted/60 mb-1 ml-1 block">City & Coordinates</label>
                                        <CityAutocomplete 
                                            value={city}
                                            onChange={(cityName, latitude, longitude) => {
                                                setCity(cityName)
                                                if (latitude && longitude) {
                                                    setLat(latitude)
                                                    setLng(longitude)
                                                }
                                            }}
                                            placeholder="Search city for precise mapping..."
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                                
                                {lat && (
                                    <div className="flex items-center gap-2 text-[10px] font-mono text-green-600 bg-green-50 px-3 py-1 rounded-full w-fit">
                                        <CheckCircle className="w-3 h-3" />
                                        Mapped: {lat.toFixed(4)}, {lng?.toFixed(4)}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Contact & Links */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="group">
                                <label className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2 block flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5" /> Contact
                                </label>
                                <input
                                    type="text"
                                    placeholder="Phone or email"
                                    className="w-full bg-surface px-4 py-3 rounded-xl border border-border outline-none focus:border-primary text-sm shadow-sm"
                                    value={contact}
                                    onChange={(e) => setContact(e.target.value)}
                                />
                            </div>
                            <div className="group">
                                <label className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2 block flex items-center gap-2">
                                    <Globe className="w-3.5 h-3.5" /> Website
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    className="w-full bg-surface px-4 py-3 rounded-xl border border-border outline-none focus:border-primary text-sm shadow-sm"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                />
                            </div>
                        </section>
                    </div>

                    {/* Footer */}
                    <div className="p-8 bg-surface-2 border-t border-border space-y-4">
                        {/* Toast */}
                        <AnimatePresence>
                            {toast && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className={`flex items-center gap-3 p-4 rounded-2xl text-xs font-bold tracking-tight shadow-lg ${
                                        toast.type === 'success'
                                            ? 'bg-green-500 text-background shadow-green-500/20'
                                            : 'bg-orange-500 text-background shadow-orange-500/20'
                                    }`}
                                >
                                    {toast.type === 'success'
                                        ? <CheckCircle className="w-5 h-5 shrink-0" />
                                        : <AlertTriangle className="w-5 h-5 shrink-0" />
                                    }
                                    {toast.msg}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button 
                            onClick={handleSubmit}
                            disabled={submitting}
                            className={`w-full text-background px-8 py-5 rounded-2xl font-black text-xs tracking-[0.2em] flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase shadow-xl ${submitting ? 'bg-primary/60' : 'bg-primary hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 shadow-black/20'}`}
                        >
                            {submitting ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Publishing Hub…</>
                            ) : (
                                <>Add Space to Ecosystem</>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}





