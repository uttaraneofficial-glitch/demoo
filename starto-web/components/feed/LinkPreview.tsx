"use client"

import { useState, useEffect } from 'react'
import { ExternalLink, Image as ImageIcon } from 'lucide-react'

interface LinkPreviewProps {
    url: string
}

export default function LinkPreview({ url }: LinkPreviewProps) {
    const [preview, setPreview] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchPreview = async () => {
            if (!url) return;
            setLoading(true);
            try {
                const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
                const json = await res.json();
                if (json.status === 'success' && json.data) {
                    setPreview(json.data);
                }
            } catch (error) {
                console.error("Failed to fetch link preview", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPreview();
    }, [url]);

    if (loading) {
        return (
            <div className="w-full h-24 bg-surface-2 animate-pulse rounded-xl border border-border flex items-center justify-center">
                <span className="text-text-muted text-xs font-medium">Loading preview...</span>
            </div>
        );
    }

    if (!preview) {
        return (
            <a href={url} target="_blank" rel="noopener noreferrer" className="block p-4 bg-surface-2 hover:bg-primary/5 transition-colors text-primary text-sm font-medium flex items-center justify-center gap-2 rounded-xl border border-border">
                <ExternalLink className="w-4 h-4" /> View Attached Link
            </a>
        );
    }

    const { title, description, image, logo, publisher } = preview;

    // Detect if we should use compact mode (missing image, or known generic banners)
    const isGenericImage = image?.url?.includes('linkedin.com') || image?.url?.includes('google.com/docs') || image?.url?.includes('drive.google.com');
    const useCompactMode = !image?.url || isGenericImage;

    if (useCompactMode) {
        return (
            <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-surface hover:border-primary/50 transition-colors group"
            >
                <div className="w-16 h-16 shrink-0 bg-surface-2 rounded-lg overflow-hidden flex items-center justify-center border border-border">
                    {logo?.url ? (
                        <img src={logo.url} alt={publisher || "Logo"} className="w-8 h-8 object-contain" />
                    ) : (
                        <ExternalLink className="w-6 h-6 text-text-muted" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    {publisher && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">{publisher}</span>
                    )}
                    <h4 className="text-sm font-bold text-text-primary line-clamp-1 mb-1 group-hover:text-primary transition-colors">{title || url}</h4>
                    {description && (
                        <p className="text-xs text-text-secondary line-clamp-1">{description}</p>
                    )}
                </div>
            </a>
        );
    }

    return (
        <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block rounded-xl overflow-hidden border border-border bg-surface hover:border-primary/50 transition-colors group"
        >
            <div className="w-full h-48 sm:h-64 bg-surface-2 overflow-hidden relative">
                <img 
                    src={image.url} 
                    alt={title || "Link preview image"} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
            </div>
            
            <div className="p-4 bg-surface">
                {publisher && (
                    <div className="flex items-center gap-2 mb-2">
                        {logo?.url && <img src={logo.url} alt={publisher} className="w-4 h-4 rounded-sm" />}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{publisher}</span>
                    </div>
                )}
                <h4 className="text-sm font-bold text-text-primary line-clamp-1 mb-1">{title || url}</h4>
                {description && (
                    <p className="text-xs text-text-secondary line-clamp-2">{description}</p>
                )}
            </div>
        </a>
    )
}
