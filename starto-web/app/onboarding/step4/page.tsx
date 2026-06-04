"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Navigation as NavIcon, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useOnboardingStore } from '@/store/useOnboardingStore'
import CityAutocomplete from '@/components/CityAutocomplete'

export default function OnboardingStep4() {
    const router = useRouter()
    const { city, address, lat, lng, setLocation } = useOnboardingStore()
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState(address || city || '')
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [isDetecting, setIsDetecting] = useState(false)

    const handleContinue = () => {
        if ((city || address) && lat && lng) {
            router.push('/onboarding/step5')
        }
    }

    const fetchSuggestions = async (query: string) => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }
        try {
            const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`);
            const data = await res.json();
            if (data.features) {
                setSuggestions(data.features);
                setShowSuggestions(true);
            }
        } catch (error) {
            console.error('Autocomplete error:', error);
        }
    };

    const handleSelectSuggestion = (feature: any) => {
        const { name, city: cityName, state, country } = feature.properties;
        const fullAddress = [name, cityName, state].filter(Boolean).join(', ');
        setSearchQuery(fullAddress);
        setLocation(cityName || name, feature.geometry.coordinates[1], feature.geometry.coordinates[0], fullAddress);
        setShowSuggestions(false);
    };

    const handleUseCurrentLocation = () => {
        if ("geolocation" in navigator) {
            setIsDetecting(true)
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const response = await fetch(`https://photon.komoot.io/api/reverse?lon=${longitude}&lat=${latitude}`);
                        const data = await response.json();
                        if (data.features && data.features[0]) {
                            const feat = data.features[0].properties;
                            const fullAddr = [feat.name, feat.city, feat.state].filter(Boolean).join(', ');
                            const cityFound = feat.city || feat.state || 'Selected Location';
                            setSearchQuery(fullAddr);
                            setLocation(cityFound, latitude, longitude, fullAddr);
                        } else {
                            setSearchQuery(`Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                            setLocation("Selected Location", latitude, longitude, `Point at ${latitude}, ${longitude}`);
                        }
                    } catch (error) {
                        console.error("Geocoding failed", error);
                        setLocation("Selected Location", latitude, longitude, "Current Location");
                    }
                    setIsDetecting(false);
                },
                (error) => {
                    console.error("Geolocation error", error);
                    setIsDetecting(false);
                }
            );
        }
    }

    return (
        <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6 font-sans">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#161618] p-10 rounded-[2rem] border border-white/5 max-w-lg w-full shadow-2xl relative overflow-hidden"
            >
                {/* Background Glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[100px] rounded-full" />
                
                <div className="relative z-10">
                    <div className="mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] uppercase font-bold tracking-widest mb-4">
                            Step 04 / 05
                        </div>
                        <h2 className="text-3xl font-display text-background mb-3">Where are you based?</h2>
                        <p className="text-text-muted text-sm leading-relaxed">
                            Providing your specific address helps us show you nearby ecosystem nodes, local founders, and regional opportunities.
                        </p>
                    </div>

                    <div className="space-y-6 mb-10">
                        <div className="relative group">
                            <div className="relative">
                                <NavIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        fetchSuggestions(e.target.value);
                                    }}
                                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                    placeholder="Enter your address or city..."
                                    className="w-full bg-surface/5 pl-12 pr-4 py-4 rounded-xl outline-none border border-white/5 focus:border-primary/50 focus:bg-surface/10 transition-all text-background text-sm"
                                />
                            </div>

                            <AnimatePresence>
                                {showSuggestions && suggestions.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute z-50 left-0 right-0 mt-2 bg-[#1C1C1E] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                                    >
                                        {suggestions.map((feat, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleSelectSuggestion(feat)}
                                                className="w-full text-left px-4 py-3 text-sm text-text-muted hover:bg-surface/5 transition-colors border-b border-white/5 last:border-0"
                                            >
                                                <p className="font-bold text-background">{feat.properties.name}</p>
                                                <p className="text-[10px] text-text-secondary">
                                                    {[feat.properties.city, feat.properties.state, feat.properties.country].filter(Boolean).join(', ')}
                                                </p>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button 
                            onClick={handleUseCurrentLocation}
                            disabled={isDetecting}
                            className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest hover:text-background transition-colors group disabled:opacity-50"
                        >
                            <NavIcon className={`w-3.5 h-3.5 group-hover:rotate-45 transition-transform ${isDetecting ? 'animate-spin' : ''}`} />
                            {isDetecting ? 'Detecting Location...' : 'Use my current location'}
                        </button>
                    </div>

                    <div className="bg-surface/5 border border-white/5 p-4 rounded-xl mb-10 backdrop-blur-sm">
                        <p className="text-[11px] text-text-muted leading-relaxed italic">
                            "Starto uses precise geospatial data to bridge the gap between digital networking and real-world local collaboration."
                        </p>
                    </div>

                    <button
                        onClick={handleContinue}
                        disabled={(!city && !address) || !lat || !lng}
                        className={`w-full py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 shadow-xl ${
                            (city || address) && lat && lng 
                            ? 'bg-surface text-text-primary hover:scale-[1.02] active:scale-[0.98]' 
                            : 'bg-surface/5 text-text-secondary cursor-not-allowed'
                        }`}
                    >
                        Continue
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
