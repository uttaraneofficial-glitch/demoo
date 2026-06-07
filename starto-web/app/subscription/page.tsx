"use client"

import Sidebar from '@/components/feed/Sidebar'
import MobileBottomNav from '@/components/feed/MobileBottomNav'
import { Check, Shield, Zap, Star, Rocket, X, BadgeCheck, Sparkles, Users, Crown, Heart, Target } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/useAuthStore'
import { usePaymentStore } from '@/store/usePaymentStore'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { subscriptionApi } from '@/lib/apiClient'
import StatusModal from '@/components/feed/StatusModal'
import Toast from '@/components/feed/Toast'

const mainPlans = [
    {
        id: 'EXPLORER',
        name: 'Explorer',
        price: 0,
        duration: 'Forever',
        tag: 'Free',
        description: 'Perfect for individual exploration.',
        features: ['6 Active Signals', '3 Connection Offers', '3 AI Analysis calls per day', 'Space Signals', 'Nearby Feature', 'Instant Notification', 'Signal Insight', 'AI Execution Real World Report'],
        icon: Rocket,
        highlight: false
    },
    {
        id: 'TRIAL',
        name: 'Trial',
        price: 29,
        duration: '7 days',
        tag: 'Entry',
        description: 'Test all premium features.',
        features: ['10 Active Signals', '10 Connection Offers', '5 AI Analysis calls', 'Connect on WhatsApp', 'Space Signals', 'Verification Badge', 'Nearby Feature', 'Instant Notification', 'Signal Insight', 'AI Execution Real World Report'],
        icon: Zap,
        highlight: false
    },
    {
        id: 'SPRINT',
        name: 'Sprint',
        price: 59,
        duration: '7 days',
        tag: 'Entry',
        description: 'Focused growth burst.',
        features: ['20 Active Signals', '20 Connection Offers', '10 AI Analysis calls', 'Connect on WhatsApp', 'Space Signals', 'Verification Badge', 'Nearby Feature', 'Instant Notification', 'Signal Insight', 'AI Execution Real World Report'],
        icon: Zap,
        highlight: false
    },
    {
        id: 'BOOST',
        name: 'Boost',
        price: 99,
        duration: '15 days',
        tag: 'Value',
        description: 'Maximize your visibility.',
        features: ['30 Active Signals', 'Unlimited Offers', '15 AI Analysis calls', 'Connect on WhatsApp', 'Space Signals', 'Verification Badge', 'Nearby Feature', 'Instant Notification', 'Signal Insight', 'AI Execution Real World Report'],
        icon: Sparkles,
        highlight: false
    },
    {
        id: 'PRO',
        name: 'Pro',
        price: 149,
        duration: '1 month',
        tag: 'Anchor',
        popular: true,
        description: 'The standard for builders.',
        features: ['100 Active Signals', 'Unlimited Offers', '20 AI Analysis calls', 'Connect on WhatsApp', 'Space Signals', 'Verification Badge', 'Nearby Feature', 'Instant Notification', 'Signal Insight', 'AI Execution Real World Report', 'Starto Manual Support'],
        icon: Shield,
        highlight: true
    },
    {
        id: 'PRO_PLUS',
        name: 'Pro Plus',
        price: 349,
        duration: '3 months',
        tag: 'Save',
        description: 'Scale your team and reach.',
        features: ['Unlimited Signals', 'Unlimited Offers', '30 AI Analysis calls', 'Connect on WhatsApp', 'Space Signals', 'Verification Badge', 'Nearby Feature', 'Instant Notification', 'Signal Insight', 'AI Execution Real World Report', 'Starto Manual Support'],
        icon: Star,
        highlight: false
    },
    {
        id: 'GROWTH',
        name: 'Growth',
        price: 579,
        duration: '6 months',
        tag: 'Save',
        description: 'Deep ecosystem integration.',
        features: ['Unlimited Signals', 'Unlimited Offers', 'Unlimited AI Analysis', 'Connect on WhatsApp', 'Space Signals', 'Verification Badge', 'Nearby Feature', 'Instant Notification', 'Signal Insight', 'AI Execution Real World Report', 'Starto Manual Support'],
        icon: Rocket,
        highlight: false
    },
    {
        id: 'ANNUAL',
        name: 'Annual',
        price: 999,
        duration: '12 months',
        tag: 'Long Term',
        description: 'Commit to full dominance.',
        features: ['Unlimited Everything', 'Legacy Profile Badge', 'Priority Support', 'Connect on WhatsApp', 'Space Signals', 'Verification Badge', 'Nearby Feature', 'Instant Notification', 'Signal Insight', 'AI Execution Real World Report', 'Starto Manual Support'],
        icon: Sparkles,
        highlight: false
    }
]

const captainPlans = [
    {
        id: 'CAPTAIN',
        name: 'Captain',
        price: 99,
        duration: '1 month',
        tag: 'Leader',
        description: 'Build your own community hub.',
        features: ['10 Active Signals', 'Unlimited Offers', '20 AI Analysis calls', 'Connect on WhatsApp', 'Space Signals', 'Verification Badge', 'Nearby Feature', 'Instant Notification', 'Signal Insight', 'AI Execution Real World Report'],
        icon: Crown,
        highlight: true
    },
    {
        id: 'CAPTAIN_PRO',
        name: 'Captain Pro',
        price: 799,
        duration: '12 months',
        tag: 'Elite',
        description: 'Ultimate power for community builders.',
        features: ['Unlimited Signals', 'Unlimited Offers', 'Unlimited AI Analysis', 'Connect on WhatsApp', 'Space Signals', 'Verification Badge', 'Nearby Feature', 'Instant Notification', 'Signal Insight', 'AI Execution Real World Report'],
        icon: Star,
        highlight: false
    }
]

const allPlans = [...mainPlans, ...captainPlans]

export default function SubscriptionPage() {
    const { user, updateUser, isAuthenticated } = useAuthStore()
    const router = useRouter()
    const [confirmPlan, setConfirmPlan] = useState<string | null>(null)
    const [isUpgrading, setIsUpgrading] = useState(false)
    const [successPlan, setSuccessPlan] = useState<string | null>(null)
    const [couponCode, setCouponCode] = useState('')

    const [backendPlans, setBackendPlans] = useState<any[]>([])
    const [statusModal, setStatusModal] = useState<{ isOpen: boolean, type: 'upgrade' | 'duplicate' | 'error', title: string, message: string }>({
        isOpen: false,
        type: 'error',
        title: '',
        message: ''
    })
    const [toast, setToast] = useState<{ isVisible: boolean, message: string, type: 'success' | 'error' | 'info' }>({
        isVisible: false,
        message: '',
        type: 'success'
    })

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ isVisible: true, message, type })
    }

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth')
            return
        }

        const loadData = async () => {
            const { data: plans } = await subscriptionApi.getPlans();
            if (plans) setBackendPlans(plans);

            const { data: status } = await subscriptionApi.getStatus();
            if (status) {
                updateUser({ plan: status.plan, planExpiresAt: status.expiresAt });
            }
        }
        loadData();
    }, [isAuthenticated, router, updateUser])

    // Merge backend prices into local plan objects
    const mergedMainPlans = mainPlans.map(lp => {
        const bp = backendPlans.find(b => b.plan === lp.id);
        return bp ? { ...lp, price: bp.amountRupees, duration: `${bp.durationDays} days` } : lp;
    })

    const mergedCaptainPlans = captainPlans.map(lp => {
        const bp = backendPlans.find(b => b.plan === lp.id);
        return bp ? { ...lp, price: bp.amountRupees, duration: `${bp.durationDays} days` } : lp;
    })

    const mergedAllPlans = [...mergedMainPlans, ...mergedCaptainPlans];

    const subscription = user?.subscription || user?.plan || 'Explorer'

    const handleUpgradeClick = (planName: string) => {
        if (planName === 'Explorer') return
        setConfirmPlan(planName)
    }

    const handleConfirmUpgrade = async () => {
        if (!confirmPlan) return
        setIsUpgrading(true)
        const addPayment = usePaymentStore.getState().addRecord
        const planDetails = mergedAllPlans.find(p => p.name === confirmPlan || p.id === confirmPlan)
        const targetPlanId = planDetails?.id || confirmPlan;

        try {
            // 0. Handle Coupon Flow
            if (targetPlanId === 'PRO_PLUS' && couponCode.trim()) {
                const { error: couponError } = await subscriptionApi.activateCoupon(targetPlanId, couponCode.trim());

                if (couponError) {
                    setStatusModal({
                        isOpen: true,
                        type: 'error',
                        title: 'Coupon Activation Failed',
                        message: couponError || "Invalid or expired coupon code."
                    })
                    setIsUpgrading(false);
                    return;
                }

                showToast("Pro Plus activated via coupon!");
                updateUser({ plan: confirmPlan, subscription: confirmPlan });
                addPayment({
                    planName: confirmPlan,
                    amount: 0,
                    currency: '₹',
                    dateTime: new Date().toLocaleString(),
                    status: 'Successful (Coupon)'
                });
                setSuccessPlan(confirmPlan);
                setConfirmPlan(null);
                setCouponCode('');

                const { data: status } = await subscriptionApi.getStatus();
                if (status) {
                    updateUser({ plan: status.plan, planExpiresAt: status.expiresAt });
                }
                setIsUpgrading(false);
                return;
            }

            // 1. Create order on backend
            const { data: orderData, error: orderError } = await subscriptionApi.createOrder(targetPlanId);

            if (orderError || !orderData) {
                if (orderError && orderError.startsWith('Unauthorized')) {
                    useAuthStore.getState().logout();
                    try { getAuth().signOut(); } catch (e) {}
                    window.location.href = '/login';
                    return;
                }
                setStatusModal({
                    isOpen: true,
                    type: 'error',
                    title: 'Upgrade Failed',
                    message: orderError || "Failed to initiate upgrade. Please try again."
                })
                setIsUpgrading(false);
                return;
            }

            // 2. Open Razorpay Checkout
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderData.amountPaid,
                currency: orderData.currency || "INR",
                name: "Startoindia",
                description: `Upgrade to ${confirmPlan}`,
                order_id: orderData.razorpayOrderId,
                handler: async (response: any) => {
                    // 3. Verify payment on success
                    const verifyPayload = {
                        razorpayOrderId: response.razorpay_order_id,
                        razorpaySubscriptionId: response.razorpay_subscription_id,
                        razorpayPaymentId: response.razorpay_payment_id,
                        razorpaySignature: response.razorpay_signature,
                    };

                    const { error: verifyError } = await subscriptionApi.verifyPayment(verifyPayload);

                    if (verifyError) {
                        setStatusModal({
                            isOpen: true,
                            type: 'error',
                            title: 'Verification Failed',
                            message: "Payment verification failed. Please contact support."
                        })
                    } else {
                        showToast("Subscription activated successfully!");
                        // 4. Update local state on success
                        updateUser({ plan: confirmPlan, subscription: confirmPlan });
                        addPayment({
                            planName: confirmPlan,
                            amount: planDetails?.price || 0,
                            currency: '₹',
                            dateTime: new Date().toLocaleString(),
                            status: 'Successful'
                        });
                        setSuccessPlan(confirmPlan);
                        setConfirmPlan(null);

                        // Refresh user status from backend
                        const { data: status } = await subscriptionApi.getStatus();
                        if (status) {
                            updateUser({ plan: status.plan, planExpiresAt: status.expiresAt });
                        }
                    }
                },
                prefill: {
                    name: user?.name,
                    email: user?.email,
                    contact: user?.phone
                },
                theme: { color: "#000000" },
                modal: {
                    ondismiss: () => {
                        setIsUpgrading(false);
                    }
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();

        } catch (err) {
            console.error("Upgrade error:", err);
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Upgrade Error',
                message: "An error occurred during upgrade. Please try again."
            })
            setIsUpgrading(false);
        }
    }

    if (!isAuthenticated || !user) return (
        <div className="min-h-screen bg-background flex justify-center items-center text-text-muted">Loading...</div>
    )

    return (
        <div className="min-h-screen bg-background flex justify-center">
            <div className="max-w-[1500px] w-full flex flex-col md:flex-row pb-16 md:pb-0">
                <Sidebar />

                <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">

                        {/* Header */}
                        <header className="text-center mb-16">
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 px-3 py-1 bg-surface-2 rounded-full border border-border mb-6"
                            >
                                <Sparkles className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-bold uppercase tracking-widest italic">The Unified Subscription Model</span>
                            </motion.div>
                            <h1 className="text-5xl lg:text-7xl font-display mb-6 tracking-tighter">Unified Growth<br />Ecosystem</h1>
                            <p className="text-text-secondary max-w-2xl mx-auto text-lg leading-relaxed mb-8">
                                Subscription tiers that empower all—Talent, Founders, and Leaders.
                                Unlock the tools to scale your vision in the Staro ecosystem.
                            </p>

                            {/* Current Status Badge */}
                            <div className="flex flex-wrap justify-center gap-4">
                                <div className="px-6 py-3 bg-surface-2 rounded-2xl border border-border flex items-center gap-3">
                                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                        <Users className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted leading-none mb-1">Current Role</p>
                                        <p className="font-bold text-sm">{user?.role || 'Member'}</p>
                                    </div>
                                </div>
                                <div className="px-6 py-3 bg-primary/5 rounded-2xl border border-primary/20 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                        <Shield className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary leading-none mb-1">Active Plan</p>
                                        <p className="font-bold text-sm">{subscription}</p>
                                    </div>
                                </div>
                            </div>
                        </header>

                        {/* Success Banner */}
                        <AnimatePresence>
                            {successPlan && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="mb-12 p-6 bg-surface-2 backdrop-blur-sm border border-border rounded-3xl flex items-center justify-between shadow-sm"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-surface-2 rounded-2xl flex items-center justify-center shadow-sm">
                                            <BadgeCheck className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-primary text-lg">Successfully Upgraded to {successPlan}!</p>
                                            <p className="text-sm text-text-secondary">Your network visibility and premium toolkit are now active.</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSuccessPlan(null)} className="text-text-muted hover:text-primary p-2">
                                        <X className="w-5 h-5" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Main Plans Section */}
                        <section className="mb-24">
                            <div className="flex items-center gap-3 mb-10">
                                <Rocket className="w-6 h-6 text-primary" />
                                <h2 className="text-3xl font-display">Standard Tiers</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {mergedMainPlans.map((plan, idx) => (
                                    <PlanCard key={plan.name} plan={plan} idx={idx} currentPlan={subscription} onUpgrade={handleUpgradeClick} />
                                ))}
                            </div>
                        </section>

                        {/* Captains Program Section */}
                        <section className="p-10 lg:p-16 bg-black rounded-[2.5rem] relative overflow-hidden text-white mb-20">
                            <div className="absolute top-0 right-0 p-20 bg-primary/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="relative z-10 flex flex-col lg:flex-row gap-16 items-center">
                                <div className="max-w-md">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 mb-6 text-[#F5F4F0]">
                                        <Crown className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Captain Priority</span>
                                    </div>
                                    <h2 className="text-4xl lg:text-5xl font-display mb-6">Captains Program</h2>
                                    <p className="text-gray-400 text-lg leading-relaxed mb-8">
                                        Become a pillar of the community. Lead your own hub, manage localized signals,
                                        and get exclusive administrative control over node networks.
                                    </p>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                                                <Check className="w-4 h-4" />
                                            </div>
                                            <span className="text-gray-300 font-medium font-mono text-sm underline decoration-primary/30">Community Governance</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                                                <Check className="w-4 h-4" />
                                            </div>
                                            <span className="text-gray-300 font-medium font-mono text-sm underline decoration-primary/30">Admin Dashboards</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full lg:w-auto shrink-0">
                                    {mergedCaptainPlans.map((plan, idx) => (
                                        <div key={plan.name} className={`p-8 rounded-[2rem] border transition-all duration-500 hover:scale-105 ${plan.highlight ? 'bg-primary text-background border-primary shadow-2xl' : 'bg-white/5 border-white/10 hover:border-white/30'} flex flex-col`}>
                                            <div className="mb-6">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${plan.highlight ? 'bg-background text-primary' : 'bg-primary/20 text-primary'}`}>
                                                    <plan.icon className="w-6 h-6" />
                                                </div>
                                                <h3 className="text-2xl font-display mb-1">{plan.name}</h3>
                                                <div className="flex items-baseline gap-1 mb-2">
                                                    <span className="text-3xl font-mono font-bold">₹{plan.price}</span>
                                                    <span className={`text-sm ${plan.highlight ? 'text-background/70' : 'text-gray-400'}`}>/month</span>
                                                </div>
                                            </div>
                                            <div className="flex-1 space-y-2.5 mb-8">
                                                {plan.features.map((f: string) => (
                                                    <div key={f} className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-primary opacity-60" />
                                                        <span className={`text-[12px] leading-tight ${plan.highlight ? 'text-background/70' : 'text-gray-300'}`}>{f}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => handleUpgradeClick(plan.name)}
                                                disabled={plan.name === 'Explorer'}
                                                className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all ${subscription?.toUpperCase() === plan.id?.toUpperCase() ? 'bg-accent-green text-white shadow-lg shadow-accent-green/20' : plan.highlight ? 'bg-black text-white hover:bg-black/90 hover:text-white' : 'bg-primary text-background hover:bg-primary/90'} disabled:opacity-50`}
                                            >
                                                {subscription?.toUpperCase() === plan.id?.toUpperCase() ? 'Renew Program' : `Join Program`}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                    </div>
                </main>
                <MobileBottomNav />
            </div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {confirmPlan && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
                        onClick={() => !isUpgrading && setConfirmPlan(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 30 }}
                            className="bg-surface rounded-[2rem] p-10 max-w-lg w-full shadow-2xl relative overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="absolute top-0 right-0 p-20 bg-primary/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                                    <Sparkles className="w-7 h-7 text-primary" />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-display tracking-tight">Activate {confirmPlan}</h3>
                                    <p className="text-sm text-text-muted">Confirming your ecosystem status</p>
                                </div>
                            </div>

                            <div className="p-6 bg-surface-2 rounded-2xl border border-border mb-8 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-text-secondary text-sm font-medium">Subscription Tier</span>
                                    <span className="font-bold flex items-center gap-2">
                                        <BadgeCheck className="w-4 h-4 text-primary" />
                                        {confirmPlan}
                                    </span>
                                </div>
                                <div className="h-px bg-border/50" />
                                <div className="flex justify-between items-center">
                                    <span className="text-text-secondary text-sm font-medium">Billed Amount</span>
                                    <div className="text-right">
                                        <p className="text-xl font-mono font-bold leading-none">₹{mergedAllPlans.find(p => p.name === confirmPlan)?.price}</p>
                                        <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mt-1">One-time Upgrade</p>
                                    </div>
                                </div>
                            </div>

                            {/* Coupon Input for Pro Plus */}
                            {(confirmPlan === 'Pro Plus' || mergedAllPlans.find(p => p.name === confirmPlan)?.id === 'PRO_PLUS') && (
                                <div className="mb-8 p-6 bg-primary/5 rounded-2xl border border-primary/20">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Sparkles className="w-4 h-4 text-primary" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-primary">Ecosystem Coupon</span>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Enter coupon code"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        className="w-full bg-surface border border-border px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-text-primary"
                                    />
                                    {couponCode === 'GOSTARTO' && (
                                        <p className="text-[10px] text-accent-green font-bold mt-2 uppercase tracking-tight">✨ Valid Coupon Detected: Amount will be waived</p>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setConfirmPlan(null)}
                                    disabled={isUpgrading}
                                    className="flex-1 border border-border py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-surface-2 transition-colors disabled:opacity-40"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmUpgrade}
                                    disabled={isUpgrading}
                                    className="flex-1 bg-primary text-background py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                >
                                    {isUpgrading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                            Activating Status...
                                        </>
                                    ) : (
                                        `Confirm Upgrade`
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <StatusModal
                isOpen={statusModal.isOpen}
                onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
            />

            <Toast
                isVisible={toast.isVisible}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
        </div>
    )
}

function PlanCard({ plan, idx, currentPlan, onUpgrade }: { plan: any, idx: number, currentPlan: string, onUpgrade: (n: string) => void }) {
    const isActive = currentPlan?.toUpperCase() === plan.id?.toUpperCase()
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`p-6 rounded-[2rem] border transition-all duration-300 relative group flex flex-col ${isActive ? 'bg-primary/5 border-primary shadow-xl shadow-primary/5' : 'bg-surface border-border hover:border-primary/40 hover:shadow-2xl'}`}
        >
            {plan.tag && (
                <div className={`absolute -top-2 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest left-1/2 -translate-x-1/2 ${plan.highlight ? 'bg-primary text-background' : 'bg-surface-2 text-text-muted border border-border'}`}>
                    {plan.tag}
                </div>
            )}

            <div className="mb-6 pt-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${plan.highlight ? 'bg-primary text-background' : 'bg-surface-2 text-primary'}`}>
                    <plan.icon className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-display mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-mono font-bold">₹{plan.price}</span>
                    <span className="text-[10px] text-text-muted font-bold uppercase">/ {plan.duration}</span>
                </div>
            </div>

            <div className="flex-1 space-y-2.5 mb-8">
                {plan.features.map((f: string) => (
                    <div key={f} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-primary opacity-60" />
                        <span className="text-[12px] text-text-secondary leading-tight">{f}</span>
                    </div>
                ))}
            </div>

            <button
                onClick={() => onUpgrade(plan.name)}
                disabled={plan.name === 'Explorer'}
                className={`w-full py-3.5 rounded-2xl font-bold uppercase tracking-widest text-[9px] transition-all shadow-sm ${isActive ? 'bg-primary text-background shadow-lg shadow-black/20 border-transparent' : plan.name === 'Explorer' ? 'bg-surface-2 text-text-muted' : 'bg-black text-white hover:bg-primary hover:text-background active:scale-95'}`}
            >
                {isActive ? 'Renew Plan' : plan.name === 'Explorer' ? 'Always Free' : 'Choose Plan'}
            </button>
        </motion.div>
    )
}




