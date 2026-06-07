"use client";

import { useEffect, useState } from 'react';
import Sidebar from '@/components/feed/Sidebar';
import { Check, Zap, Rocket, Star, Shield, Crown, ArrowRight, Loader2 } from 'lucide-react';
import { subscriptionApi, getAuthToken } from '@/lib/apiClient';
import StatusModal from '@/components/feed/StatusModal';
import Toast from '@/components/feed/Toast';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

interface PlanDetails {
    plan: string;
    amountPaise: number;
    amountRupees: number;
    durationDays: number;
    billingType: string;
}

export default function PricingPage() {
    const { user, token } = useAuthStore();
    const [plans, setPlans] = useState<PlanDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [statusModal, setStatusModal] = useState<{isOpen: boolean, type: 'upgrade' | 'duplicate' | 'error', title: string, message: string}>({
        isOpen: false,
        type: 'error',
        title: '',
        message: ''
    });
    const [toast, setToast] = useState<{isVisible: boolean, message: string, type: 'success' | 'error' | 'info'}>({
        isVisible: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ isVisible: true, message, type });
    };

    const router = useRouter();

    useEffect(() => {
        subscriptionApi.getPlans().then(({ data }) => {
            if (data) setPlans(data);
            setLoading(false);
        });
    }, []);

    const handleUpgrade = async (planName: string) => {
        if (!user || !token) {
            router.push('/login');
            return;
        }

        setPurchasing(planName);
        try {
            const { data: order, error } = await subscriptionApi.createOrder(planName);
            if (error || !order) {
                setStatusModal({
                    isOpen: true,
                    type: 'error',
                    title: 'Order Failed',
                    message: error || "Failed to create order. Please try again."
                });
                return;
            }

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amountPaid,
                currency: order.currency,
                name: "Startoindia",
                description: `Upgrade to ${planName} Plan`,
                order_id: order.razorpayOrderId,
                handler: async (response: any) => {
                    const verifyPayload = {
                        razorpayOrderId: response.razorpay_order_id,
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
                       });
                    } else {
                        showToast("Subscription activated successfully!");
                        setTimeout(() => window.location.reload(), 1500);
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.phone
                },
                theme: { color: "#000000" }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error(err);
        } finally {
            setPurchasing(null);
        }
    };

    const getFeatures = (plan: string) => {
        const features: Record<string, string[]> = {
            'EXPLORER': ['2 Active Signals', '3 Connection Offers', '3 AI Analysis calls', 'Standard Search'],
            'TRIAL': ['5 Active Signals', '10 Connection Offers', '5 AI Market Calls', 'WhatsApp Unlock', '7 Days Access'],
            'SPRINT': ['5 Active Signals', '20 Connection Offers', '10 AI Market Calls', 'WhatsApp Unlock', '7 Days Access'],
            'BOOST': ['8 Active Signals', 'Unlimited Offers', '15 AI Market Calls', 'WhatsApp Unlock', '15 Days Access'],
            'PRO': ['10 Active Signals', 'Unlimited Offers', '20 AI Market Calls', 'WhatsApp Unlock', 'Basic Analytics'],
            'PRO_PLUS': ['Unlimited Signals', 'Unlimited Offers', '30 AI Market Calls', 'Full Market Reports', 'Advanced Analytics'],
            'GROWTH': ['Everything Unlimited', 'Priority Ecosystem Support', 'Verified Node Badge', '180 Days Access'],
            'ANNUAL': ['Best Value: Unlimited everything', 'Strategic Growth Advisory', 'Founding Member Badge', '365 Days Access'],
            'CAPTAIN': ['Community Leadership Tools', '10 Active Signals', 'Unlimited Offers', '20 AI Market Calls'],
            'CAPTAIN_PRO': ['Executive Ecosystem Access', 'Unlimited Everything', 'Strategic Support', 'Senior Captain Badge']
        };
        return features[plan] || ['Standard Platform Access'];
    };

    const getPlanIcon = (plan: string) => {
        if (plan.includes('PRO')) return <Crown className="w-5 h-5 text-accent-yellow" />;
        if (plan === 'GROWTH' || plan === 'ANNUAL') return <Shield className="w-5 h-5 text-accent-blue" />;
        if (plan.includes('CAPTAIN')) return <Star className="w-5 h-5 text-accent-orange" />;
        return <Rocket className="w-5 h-5 text-accent-green" />;
    };

    return (
        <div className="min-h-screen bg-background flex justify-center">
            <div className="max-w-[1400px] w-full flex">
                <Sidebar />

                <main className="flex-1 p-8 md:p-16 overflow-y-auto">
                    <header className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-display mb-4">Choose Your Growth Node</h1>
                        <p className="text-text-secondary text-lg">Scalable intelligence for every stage of your investor journey.</p>
                    </header>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                            <p className="text-text-muted">Loading available plans...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
                            {plans.map((p) => {
                                const isCurrent = user?.plan === p.plan;
                                const isPro = p.plan.includes('PRO') || p.plan === 'ANNUAL';
                                
                                return (
                                    <div 
                                        key={p.plan} 
                                        className={`p-8 rounded-2xl flex flex-col transition-all border ${
                                            isPro 
                                            ? 'bg-primary text-background shadow-2xl shadow-primary/20 border-transparent' 
                                            : 'bg-surface border-border hover:border-text-muted'
                                        }`}
                                    >
                                        <div className="mb-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-xl font-display">{p.plan.replace('_', ' ')}</h3>
                                                {getPlanIcon(p.plan)}
                                            </div>
                                            <p className={`${isPro ? 'text-background/60' : 'text-text-secondary'} text-sm h-10`}>
                                                Optimized for {p.durationDays === 365 ? 'long-term' : 'rapid'} ecosystem growth.
                                            </p>
                                        </div>

                                        <div className="mb-8">
                                            <span className="text-4xl font-mono">₹{p.amountRupees.toLocaleString()}</span>
                                            <span className={`${isPro ? 'text-background/40' : 'text-text-muted'} text-xs ml-2`}>
                                                / {p.durationDays} days
                                            </span>
                                        </div>

                                        <ul className="space-y-4 mb-10 flex-1">
                                            {getFeatures(p.plan).map(f => (
                                                <li key={f} className="flex gap-3 text-sm items-start">
                                                    <Check className={`w-4 h-4 ${isPro ? 'text-accent-green' : 'text-primary'} shrink-0 mt-0.5`} />
                                                    <span>{f}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <button 
                                            onClick={() => handleUpgrade(p.plan)}
                                            disabled={purchasing === p.plan}
                                            className={`w-full py-4 rounded-md font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${
                                                isCurrent 
                                                ? 'bg-accent-green text-background hover:bg-accent-green/90 shadow-lg shadow-accent-green/20' 
                                                : isPro 
                                                ? 'bg-surface text-primary hover:bg-surface/90' 
                                                : 'bg-primary text-background hover:bg-primary/90'
                                            }`}
                                        >
                                            {purchasing === p.plan ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : isCurrent ? (
                                                <>Renew / Top Up <Zap className="w-4 h-4 fill-current" /></>
                                            ) : (
                                                <>Get Started <ArrowRight className="w-4 h-4" /></>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>

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
    );
}
