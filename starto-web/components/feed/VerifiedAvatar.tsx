"use client"

import { useState } from 'react'
import { BadgeCheck } from 'lucide-react'

interface VerifiedAvatarProps {
    username: string
    avatarUrl?: string | null
    plan?: string | null
    isVerified?: boolean
    size?: string
    badgeSize?: string
    className?: string
    fallback?: React.ReactNode
}

function isVerifiedPlan(plan?: string | null) {
    if (!plan) return false
    const p = plan.toLowerCase()
    // Explorer is the only free plan, all others are paid/verified
    return !p.includes('explorer') && !p.includes('free')
}

export default function VerifiedAvatar({
    username,
    avatarUrl,
    plan,
    isVerified: explicitVerified,
    size = 'w-10 h-10',
    badgeSize = 'w-4 h-4',
    className = '',
}: VerifiedAvatarProps) {
    const [imageError, setImageError] = useState(false)
    const isExplorer = plan && plan.toLowerCase().includes('explorer')
    const verified = !isExplorer && (explicitVerified || isVerifiedPlan(plan))
    
    // Logic for Letter DP (Gmail style)
    const getInitials = (name: string) => {
        if (!name) return '??';
        // Remove role suffix if present
        const cleanName = name.split('_')[0].trim();
        const parts = cleanName.split(/\s+/).filter(Boolean);
        
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        if (parts.length === 1) {
            return parts[0].substring(0, 2).toUpperCase();
        }
        return '??';
    };

    const getBgColor = (name: string) => {
        const colors = [
            'bg-[#F44336]', 'bg-[#E91E63]', 'bg-[#9C27B0]', 'bg-[#673AB7]', 
            'bg-[#3F51B5]', 'bg-[#2196F3]', 'bg-[#03A9F4]', 'bg-[#00BCD4]', 
            'bg-[#009688]', 'bg-[#4CAF50]', 'bg-[#8BC34A]', 'bg-[#CDDC39]', 
            'bg-[#FFC107]', 'bg-[#FF9800]', 'bg-[#FF5722]', 'bg-[#795548]'
        ];
        let hash = 0;
        const str = name || 'U';
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const initials = getInitials(username || 'U');
    const bgColor = getBgColor(username || 'U');

    // Only show image if we have a URL and it hasn't failed to load
    const shouldShowImage = avatarUrl && !imageError;

    return (
        <span className={`relative inline-flex shrink-0 ${size} ${className} ${className.includes("text-") ? "" : "text-base"}`}>
            {/* Avatar circle */}
            <span className={`${size} rounded-full border border-border overflow-hidden relative flex items-center justify-center select-none ${shouldShowImage ? 'bg-surface-2' : `${bgColor} text-background`}`}>
                {shouldShowImage ? (
                    <img crossOrigin="anonymous"
                        src={avatarUrl?.startsWith("http") ? `${avatarUrl}${avatarUrl.includes("?") ? "&" : "?"}not-from-cache-please` : avatarUrl}
                        alt={username}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <span className="tracking-tighter uppercase font-bold">{initials}</span>
                )}
            </span>

            {/* Instagram-style verified badge — bottom-right corner */}
            {verified && (
                <span
                    title={`${plan} Verified`}
                    className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full flex items-center justify-center shadow-sm"
                    style={{ padding: '1px' }}
                >
                    <BadgeCheck className={`${badgeSize} fill-black text-white`} />
                </span>
            )}
        </span>
    )
}
