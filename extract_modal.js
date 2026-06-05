const fs = require('fs');

const modalFile = 'starto-web/components/feed/ShareProfileModal.tsx';
const modalContent = `import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Twitter, Linkedin, Link as LinkIcon } from 'lucide-react';
import { ShareBadge } from '@/components/feed/ShareBadge';
import html2canvas from 'html2canvas';

interface ShareProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    dbSignals: any[];
    dbConnections: any[];
    avgRating: number;
    showToast: (msg: string, type?: string) => void;
}

export default function ShareProfileModal({ isOpen, onClose, user, dbSignals, dbConnections, avgRating, showToast }: ShareProfileModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 overflow-y-auto pointer-events-none">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/80 backdrop-blur-md pointer-events-auto"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-[420px] bg-surface border border-border rounded-[2rem] p-6 flex flex-col gap-5 shadow-2xl pointer-events-auto my-auto"
                >
                    <div className="flex justify-between w-full items-center">
                        <h3 className="text-text-primary font-display text-2xl tracking-tight">Share Your Profile</h3>
                        <button onClick={onClose} className="p-2 rounded-full bg-surface-2 text-text-muted hover:text-text-primary hover:bg-border transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {/* Instant Preview Area via CSS Scale */}
                    <div 
                        className="w-full relative rounded-2xl overflow-hidden shadow-md border border-border aspect-[4/5] bg-surface-2"
                        ref={(el) => {
                            if (el) {
                                const scale = el.clientWidth / 1080;
                                const child = el.firstElementChild as HTMLElement;
                                if (child) child.style.transform = \`scale(\${scale})\`;
                            }
                        }}
                    >
                        <div id="share-badge-node" className="absolute top-0 left-0 w-[1080px] h-[1350px] origin-top-left">
                            <ShareBadge 
                                type="profile"
                                username={user?.username || ''}
                                name={user?.name || ''}
                                avatarUrl={user?.avatarUrl}
                                plan={user?.plan}
                                role={user?.role || ''}
                                city={user?.city || ''}
                                bio={user?.bio || ''}
                                stats={{ signals: dbSignals.length, connections: dbConnections.length, rating: avgRating }}
                            />
                        </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="w-full grid grid-cols-2 gap-3">
                        <button 
                            onClick={async () => {
                                const node = document.getElementById('share-badge-node');
                                if (node) {
                                    try {
                                        showToast('Generating image...', 'info');
                                        const clone = node.cloneNode(true);
                                        clone.style.transform = 'none';
                                        clone.style.position = 'fixed';
                                        clone.style.left = '-9999px';
                                        clone.style.top = '0';
                                        document.body.appendChild(clone);
                                        
                                        const canvas = await html2canvas(clone, {
                                            scale: 2,
                                            useCORS: true,
                                            allowTaint: true,
                                            backgroundColor: '#050505',
                                            width: 1080,
                                            height: 1350
                                        });
                                        
                                        document.body.removeChild(clone);
                                        
                                        const link = document.createElement('a');
                                        link.download = \`starto_badge_\${user?.username || 'profile'}.png\`;
                                        link.href = canvas.toDataURL('image/png');
                                        link.click();
                                    } catch (err) {
                                        console.error(err);
                                        showToast('Failed to generate image', 'error');
                                    }
                                }
                            }}
                            className="col-span-2 w-full py-4 bg-primary text-background font-bold uppercase tracking-widest rounded-xl hover:opacity-90 transition-colors flex items-center justify-center gap-2"
                        >
                            <Download className="w-5 h-5" /> Download Image (4:5)
                        </button>
                        
                        <button 
                            onClick={() => {
                                const url = \`https://demoo-production-f047.up.railway.app/profile/\${user?.username}\`;
                                const text = \`Check out my Starto Ecosystem Member profile!\\n\\n\`;
                                window.open(\`https://twitter.com/intent/tweet?text=\${encodeURIComponent(text)}&url=\${encodeURIComponent(url)}\`, '_blank');
                            }}
                            className="w-full py-3 bg-[#1DA1F2] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:opacity-90 flex items-center justify-center gap-2"
                        >
                            <Twitter className="w-4 h-4" /> Share
                        </button>
                        
                        <button 
                            onClick={() => {
                                const url = \`https://demoo-production-f047.up.railway.app/profile/\${user?.username}\`;
                                window.open(\`https://www.linkedin.com/sharing/share-offsite/?url=\${encodeURIComponent(url)}\`, '_blank');
                            }}
                            className="w-full py-3 bg-[#0A66C2] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:opacity-90 flex items-center justify-center gap-2"
                        >
                            <Linkedin className="w-4 h-4" /> Share
                        </button>

                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(\`https://demoo-production-f047.up.railway.app/profile/\${user?.username}\`);
                                showToast('Profile link copied to clipboard!', 'success');
                            }}
                            className="col-span-2 w-full py-3 border border-border text-text-primary font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-surface-2 flex items-center justify-center gap-2 transition-colors"
                        >
                            <LinkIcon className="w-4 h-4" /> Copy Profile Link
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
`;
fs.writeFileSync(modalFile, modalContent, 'utf8');

const profileFile = 'starto-web/app/profile/page.tsx';
let profileContent = fs.readFileSync(profileFile, 'utf8');

// Add import
if (!profileContent.includes('import ShareProfileModal')) {
    profileContent = profileContent.replace(
        "import NetworkModal from '@/components/feed/NetworkModal'",
        "import NetworkModal from '@/components/feed/NetworkModal'\nimport ShareProfileModal from '@/components/feed/ShareProfileModal'"
    );
}

// Remove old modal code from profile/page.tsx
const modalRegex = /\{\/\* Share Profile Modal \*\/\}[\s\S]*?<\/AnimatePresence>/m;
profileContent = profileContent.replace(modalRegex, '');

// Clean up unused html2canvas import
profileContent = profileContent.replace("import html2canvas from 'html2canvas'\n", "");

// Insert <ShareProfileModal ... /> right above <NetworkModal ... />
const networkModalStr = "<NetworkModal ";
if (profileContent.includes(networkModalStr) && !profileContent.includes('<ShareProfileModal ')) {
    profileContent = profileContent.replace(
        networkModalStr,
        `<ShareProfileModal 
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                user={user}
                dbSignals={dbSignals}
                dbConnections={dbConnections}
                avgRating={avgRating}
                showToast={showToast}
            />\n\n            <NetworkModal `
    );
}

fs.writeFileSync(profileFile, profileContent, 'utf8');
console.log('Extracted ShareProfileModal successfully!');

