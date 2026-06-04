"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, CheckCircle, AlertTriangle } from 'lucide-react'
import { useSignalStore, Signal } from '@/store/useSignalStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useRouter } from 'next/navigation'
import { signalsApi } from '@/lib/apiClient'
import { canPostSignal, getSignalLimit } from '@/lib/planUtils'
import CityAutocomplete from '@/components/CityAutocomplete'

interface RaiseSignalModalProps {
    isOpen: boolean;
    onClose: () => void;
    editSignal?: Signal;
}

export default function RaiseSignalModal({ isOpen, onClose, editSignal }: RaiseSignalModalProps) {
    const { user, token, updateUser } = useAuthStore();
    const { addSignal } = useSignalStore();
    const router = useRouter();
    
    const [signalType, setSignalType] = useState<'need' | 'help'>('need');
    const [category, setCategory] = useState('Talent');
    const [headline, setHeadline] = useState('');
    const [details, setDetails] = useState('');
    const [duration, setDuration] = useState(0);
    const [stage, setStage] = useState('MVP');
    const [address, setAddress] = useState('');
    const [cityInfo, setCityInfo] = useState({ city: '', state: '' });
    const [coords, setCoords] = useState<{lat?: number, lng?: number}>({});
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'warn'; msg: string } | null>(null);

    useEffect(() => {
        if (isOpen && editSignal) {
            setSignalType(editSignal.type || 'need');
            setCategory(editSignal.category);
            setHeadline(editSignal.title || '');
            setDetails(editSignal.description || '');
            const parsedDuration = parseInt((editSignal.strength || '7').split(' ')[0]);
            setDuration(isNaN(parsedDuration) ? 7 : parsedDuration);
            setStage((editSignal as any).stage || 'MVP');
            setAddress((editSignal as any).address || (editSignal as any).city || '');
            setCityInfo({ 
                city: (editSignal as any).city || '', 
                state: (editSignal as any).state || '' 
            });
            if ((editSignal as any).lat && (editSignal as any).lng) {
                setCoords({ lat: (editSignal as any).lat, lng: (editSignal as any).lng });
            }
        } else if (isOpen && !editSignal) {
            setHeadline('');
            setDetails('');
            setCategory('Talent');
            setDuration(0);
            setStage('MVP');
            setAddress('');
            setCityInfo({ city: '', state: '' });
            setCoords({});
            setSignalType('need');
            setToast(null);
        }
    }, [isOpen, editSignal]);

    if (!isOpen) return null

    const handleSelectLocation = (cityName: string, lat?: number, lng?: number, fullAddress?: string) => {
        setAddress(fullAddress || cityName);
        setCity(cityName);
        if (lat && lng) setCoords({ lat, lng });
    };

    const setCity = (cityName: string) => {
        // Try to split city/state if comma present
        const parts = cityName.split(',').map(p => p.trim());
        setCityInfo({ 
            city: parts[0] || '', 
            state: parts[1] || '' 
        });
    };

    const handleBroadcast = async () => {
        if (!headline || !details || duration === 0) return;

        if (!address || address.trim() === '') {
            setToast({ type: 'warn', msg: 'Please enter a location.' });
            return;
        }

        // Backend constraints validation
        if (headline.length < 5) {
            setToast({ type: 'warn', msg: 'Title must be at least 5 characters long.' });
            return;
        }
        if (headline.length > 200) {
            setToast({ type: 'warn', msg: 'Title must be less than 200 characters.' });
            return;
        }
        if (details.length < 10) {
            setToast({ type: 'warn', msg: 'Description must be at least 10 characters long.' });
            return;
        }

        const currentCount = user?.signalCount || 0;
        const limit = getSignalLimit(user?.plan);
        if (!canPostSignal(user?.plan, currentCount) && !editSignal) {
            setToast({ type: 'warn', msg: `🚫 Limit reached! Your ${user?.plan || 'Explorer'} plan allows only ${limit} signals.` });
            setTimeout(() => { router.push('/subscription'); onClose(); }, 2500);
            return;
        }

        const isExplorer = !user?.plan || user.plan.toUpperCase() === 'EXPLORER';
        if (duration > 7 && isExplorer) {
            setToast({ type: 'warn', msg: '🚫 StarPro Feature: Explorer plan allows max 7 days. Please upgrade.' });
            setTimeout(() => { router.push('/subscription'); onClose(); }, 2500);
            return;
        }

        setSubmitting(true);
        setToast(null);

        const currentUsername = user?.username || 'user';

        if (editSignal) {
            const { error } = await signalsApi.update(
                editSignal.id,
                {
                    title: headline,
                    description: details,
                    category,
                    type: signalType,
                    seeking: category,
                    timelineDays: duration,
                    signalStrength: `${duration} Days`,
                    stage: stage,
                    city: cityInfo.city || address || 'Global',
                    state: cityInfo.state || 'Global',
                    address: address,
                    lat: coords.lat,
                    lng: coords.lng,
                }
            );

            if (!error) {
                // Also update local store for instant UI feedback
                useSignalStore.getState().updateSignal(editSignal.id, {
                    title: headline,
                    category,
                    description: details,
                    strength: `${duration} Days`,
                    type: signalType,
                });
                setSubmitting(false);
                onClose();
            } else {
                setToast({ type: 'warn', msg: `Server update failed: ${error}. Changes may not persist.` });
                // Still update local store so user sees change immediately
                useSignalStore.getState().updateSignal(editSignal.id, {
                    title: headline,
                    category,
                    description: details,
                    strength: `${duration} Days`,
                    type: signalType,
                });
                setTimeout(() => { onClose(); }, 2000);
            }
            setSubmitting(false);
            return;
        }

        const { data, error, status } = await signalsApi.create(
            {
                title: headline,
                description: details,
                category,
                type: signalType,
                seeking: category,
                stage: stage,
                seeking: category,
                stage: stage,
                city: cityInfo.city || address || 'Global',
                state: cityInfo.state || 'Global',
                address: address,
                lat: coords.lat,
                lng: coords.lng,
                timelineDays: duration,
                signalStrength: `${duration} Days`,
            }
        );

        if (data && !error) {
            // ✅ Saved to DB — also add to local store with the SAME ID for de-duplication
            addSignal({
                title: headline,
                username: currentUsername,
                timeAgo: 'Just now',
                category,
                description: details,
                strength: `${duration} Days`,
                type: signalType,
                userPlan: user?.subscription || user?.plan || 'Free',
            }, data.id);
            updateUser({ signalCount: (user?.signalCount || 0) + 1 });
            setToast({ type: 'success', msg: '✓ Signal broadcast to backend DB!' });
            setTimeout(() => { onClose(); }, 1200);
        } else if (status === 401) {
            // ⚠️ Authentication Issue
            addSignal({
                title: headline,
                username: currentUsername,
                timeAgo: 'Just now',
                category,
                description: details,
                strength: `${duration} Days`,
                type: signalType,
                userPlan: user?.subscription || user?.plan || 'Free',
            });
            setToast({ type: 'warn', msg: '⚠ Session expired. Please login again.' });
            setTimeout(() => { onClose(); }, 1500);
        } else if (status === 403) {
            // 🚫 Limit reached or Forbidden
            const errMsg = error || 'Signal limit reached for your plan.';
            setToast({ type: 'warn', msg: `🚫 ${errMsg}` });
            if (errMsg.toLowerCase().includes('limit')) {
                setTimeout(() => { router.push('/subscription'); onClose(); }, 2000);
            }
        } else {
            // Network error or other — fall back to local
            addSignal({
                title: headline,
                username: currentUsername,
                timeAgo: 'Just now',
                category,
                description: details,
                strength: `${duration} Days`,
                type: signalType,
                userPlan: user?.subscription || user?.plan || 'Free',
            });
            setToast({ type: 'warn', msg: `Saved locally. Will sync when online.` });
            setTimeout(() => { onClose(); }, 1800);
        }

        setSubmitting(false);
    };


    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-surface w-full max-w-[540px] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
                >
                    <div className="p-6 border-b border-border flex justify-between items-center bg-surface">
                        <h2 className="text-2xl font-bold font-display">{editSignal ? 'Modify Signal' : 'Raise a New Signal'}</h2>
                        <button onClick={onClose} className="p-2 hover:bg-surface-2 rounded-full transition-all text-text-muted">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">


                        {/* Project Stage */}
                        <section>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 block">Project Stage</label>
                            <div className="flex flex-wrap gap-2">
                                {['Design', 'MVP', 'Live'].map(s => (
                                    <button 
                                        key={s} 
                                        onClick={() => setStage(s)}
                                        className={`px-4 py-1.5 rounded-full border text-sm transition-all ${stage === s ? 'bg-primary text-background border-primary font-medium' : 'border-border text-text-secondary hover:border-black hover:text-black'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Category */}
                        <section>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 block">Select Category</label>
                            <div className="flex flex-wrap gap-2">
                                {['Talent', 'Founder', 'Mentor', 'Instant Help'].map(cat => (
                                    <button 
                                        key={cat} 
                                        onClick={() => setCategory(cat)}
                                        className={`px-4 py-1.5 rounded-full border text-sm transition-all ${category === cat ? 'bg-black text-white border-black font-medium text-sm' : 'border-border text-text-secondary hover:border-black text-sm hover:text-black'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Location */}
                        <section className="relative">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium text-text-primary">Location / Address</label>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        if (navigator.geolocation) {
                                            setToast({ type: 'success', msg: 'Detecting location...' });
                                            navigator.geolocation.getCurrentPosition(async (pos) => {
                                                const lat = pos.coords.latitude;
                                                const lng = pos.coords.longitude;
                                                setCoords({ lat, lng });
                                                try {
                                                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                                                    const data = await res.json();
                                                    if (data && data.address) {
                                                        const city = data.address.city || data.address.town || data.address.village || 'Unknown City';
                                                        const state = data.address.state || 'Unknown State';
                                                        setCityInfo({ city, state });
                                                        setAddress(data.display_name);
                                                        setToast({ type: 'success', msg: 'Location accurately captured!' });
                                                    } else {
                                                        setAddress(`GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                                                        setToast({ type: 'success', msg: 'GPS coordinates captured!' });
                                                    }
                                                } catch (e) {
                                                    setAddress(`GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                                                    setToast({ type: 'success', msg: 'GPS coordinates captured!' });
                                                }
                                            }, (err) => {
                                                setToast({ type: 'warn', msg: 'Location permission denied' });
                                            });
                                        }
                                    }}
                                    className="text-[10px] font-bold uppercase text-primary hover:underline"
                                >
                                    Use my current location
                                </button>
                            </div>
                            <CityAutocomplete 
                                value={address}
                                onChange={handleSelectLocation}
                                placeholder="Enter city or full address..."
                                inputClassName="w-full bg-surface p-3 rounded-none border-b border-border outline-none focus:border-primary text-sm placeholder:text-text-muted/60"
                            />
                            

                            {coords.lat && (
                                <p className="text-[9px] text-text-muted mt-1 font-mono">GPS: {coords.lat.toFixed(4)}, {coords.lng?.toFixed(4)}</p>
                            )}
                        </section>

                        {/* Headline */}
                        <section>
                            <label className="text-sm font-medium text-text-primary mb-2 block">What's the signal headline?</label>
                            <input
                                type="text"
                                placeholder="Type a catchy headline..."
                                className="w-full bg-surface p-3 rounded-none border-b border-border outline-none focus:border-primary text-base placeholder:text-text-muted/60 font-serif pb-2 placeholder:font-serif"
                                value={headline}
                                onChange={(e) => setHeadline(e.target.value)}
                            />
                        </section>

                        {/* Details */}
                        <section>
                            <label className="text-sm font-medium text-text-primary mb-2 block">Details & Context</label>
                            <textarea
                                placeholder="Explain what you are looking for or offering in more detail..."
                                className="w-full bg-surface p-4 rounded-xl border border-border outline-none focus:border-primary text-sm gap-2 h-32 resize-none placeholder:text-text-muted/60 shadow-sm"
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                            />
                        </section>

                        {/* Duration */}
                        <section>
                            <label className="text-sm font-medium text-text-primary mb-2 flex justify-between items-center block">
                                <span>Signal Duration <span className="text-red-500">*</span></span>
                                <span className={`font-mono font-bold ${duration === 0 ? 'text-text-muted' : (duration > 7 && (!user?.plan || user.plan.toUpperCase() === 'EXPLORER')) ? 'text-orange-600' : 'text-primary'} flex items-center gap-2`}>
                                    {editSignal && <span className="text-[9px] uppercase bg-surface-1 px-1.5 py-0.5 rounded border border-border text-text-muted flex items-center gap-1"><Zap className="w-2.5 h-2.5" /> Fixed</span>}
                                    {duration === 0 ? 'Not Selected' : `${duration} Days`}
                                </span>
                            </label>
                            <div className={`p-4 rounded-xl border transition-colors ${duration > 7 ? 'bg-orange-50/50 border-orange-200' : duration === 0 ? 'bg-surface-2 border-red-200' : 'bg-surface-2 border-border'}`}>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="30" 
                                    className={`w-full accent-primary ${editSignal ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
                                    value={duration}
                                    onChange={(e) => !editSignal && setDuration(parseInt(e.target.value))}
                                    disabled={!!editSignal}
                                />
                                <div className="flex justify-between text-[10px] text-text-muted mt-2 font-medium uppercase tracking-widest">
                                    <span>0</span>
                                    <span>1 Day</span>
                                    <span className="text-text-primary font-bold">7 Days (Free Max)</span>
                                    <span>30 Days</span>
                                </div>
                                {editSignal && (
                                    <p className="text-[9px] text-text-muted mt-3 italic">Note: Signal duration cannot be modified after broadcast to maintain ecosystem stability.</p>
                                )}
                            </div>
                            
                            <AnimatePresence>
                                {duration > 7 && (!user?.plan || user.plan.toUpperCase() === 'EXPLORER') && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-4 bg-orange-50 border border-orange-200 p-3 rounded-lg flex items-start gap-3 overflow-hidden"
                                    >
                                        <div className="bg-orange-100 p-1.5 rounded-full mt-0.5">
                                            <Zap className="w-3.5 h-3.5 text-orange-600 fill-orange-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-orange-900">StarPro Feature</h4>
                                            <p className="text-[10px] text-orange-800 mt-0.5 leading-relaxed">Signals lasting longer than 7 days require an active StarPro subscription. Please upgrade to broadcast for {duration} days.</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </section>
                    </div>

                    <div className="p-6 space-y-3">
                        {/* Toast feedback */}
                        <AnimatePresence>
                            {toast && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className={`flex items-center gap-2 p-3 rounded-lg text-xs font-medium ${
                                        toast.type === 'success'
                                            ? 'bg-surface-2 border border-border text-primary'
                                            : 'bg-orange-50 border border-orange-200 text-orange-700'
                                    }`}
                                >
                                    {toast.type === 'success'
                                        ? <CheckCircle className="w-4 h-4 shrink-0" />
                                        : <AlertTriangle className="w-4 h-4 shrink-0" />
                                    }
                                    {toast.msg}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button 
                            onClick={handleBroadcast}
                            disabled={!headline || !details || duration === 0 || submitting}
                            className={`w-full text-white px-8 py-3.5 rounded-xl font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase ${(duration > 7 && (!user?.plan || user.plan.toUpperCase() === 'EXPLORER')) ? 'bg-orange-500 hover:bg-orange-600' : 'bg-black hover:bg-black/90'}`}
                        >
                            {submitting ? (
                                <><Zap className="w-4 h-4 fill-white text-white animate-pulse" /> Broadcasting…</>
                            ) : duration === 0 ? (
                                <>Select Duration to Broadcast</>
                            ) : (duration > 7 && (!user?.plan || user.plan.toUpperCase() === 'EXPLORER')) ? (
                                <><Zap className="w-4 h-4 fill-white text-white" /> Upgrade to Pro → Subscription</>
                            ) : (
                                <><Zap className="w-4 h-4 fill-white text-white" /> Broadcast to Network</>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
