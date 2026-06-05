const fs = require('fs');
const file = 'starto-web/app/profile/page.tsx';

if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // Add html2canvas import
    if (!content.includes('import html2canvas')) {
        content = content.replace(
            "import { useState, useEffect } from 'react'",
            "import { useState, useEffect } from 'react'\nimport html2canvas from 'html2canvas'"
        );
    }
    
    // Add Download icon to lucide-react if missing
    if (!content.includes('Download,')) {
        content = content.replace(
            "import { Share2, MapPin, Globe",
            "import { Download, Share2, MapPin, Globe"
        );
    }

    // Add badgeImage state
    if (!content.includes('badgeImage')) {
        content = content.replace(
            "const [showShareModal, setShowShareModal] = useState(false)",
            "const [showShareModal, setShowShareModal] = useState(false)\n    const [badgeImage, setBadgeImage] = useState<string | null>(null)\n    const [isGenerating, setIsGenerating] = useState(false)"
        );
    }

    // Add generation function
    if (!content.includes('generateShareBadge')) {
        const genFunc = `
    const generateShareBadge = () => {
        setShowShareModal(true);
        setBadgeImage(null);
        setIsGenerating(true);
        
        setTimeout(async () => {
            const node = document.getElementById('share-badge-node');
            if (node) {
                try {
                    const canvas = await html2canvas(node, {
                        scale: 2, // High quality
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#050505'
                    });
                    setBadgeImage(canvas.toDataURL('image/png'));
                } catch (err) {
                    console.error('Failed to generate badge', err);
                    showToast('Failed to generate preview', 'error');
                } finally {
                    setIsGenerating(false);
                }
            }
        }, 300); // Give it a moment to render off-screen
    };
`;
        content = content.replace(
            "const handleSave = async () => {",
            genFunc + "\n    const handleSave = async () => {"
        );
    }

    // Replace the open modal button onClick
    content = content.replace(
        "onClick={() => setShowShareModal(true)} className=\"px-4 py-2 border border-primary text-primary",
        "onClick={generateShareBadge} className=\"px-4 py-2 border border-primary text-primary"
    );

    // Completely replace the modal and add the hidden node
    const modalRegex = /\{\/\* Share Profile Modal \*\/\}(.|\n)*?<\/AnimatePresence>/m;
    const newModalCode = `
            {/* Hidden Node for html2canvas */}
            <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1 }}>
                <div id="share-badge-node" style={{ width: '1080px', height: '1350px' }}>
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

            {/* Share Profile Modal */}
            <AnimatePresence>
                {showShareModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowShareModal(false)}
                            className="fixed inset-0 bg-black/90 z-[100] backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] w-[90%] max-w-[420px] flex flex-col items-center gap-6"
                        >
                            <div className="flex justify-between w-full items-center">
                                <h3 className="text-white font-display text-2xl tracking-tight">Share Your Profile</h3>
                                <button onClick={() => setShowShareModal(false)} className="p-2 rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            {/* Preview Area (4:5 Aspect Ratio) */}
                            <div className="w-full relative rounded-3xl overflow-hidden shadow-2xl border border-white/20 aspect-[4/5] bg-black/50 flex items-center justify-center">
                                {badgeImage ? (
                                    <img src={badgeImage} alt="Ecosystem Member Badge" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center gap-4 text-white/50">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                        <p className="font-mono text-xs tracking-widest uppercase">Generating High-Res Badge...</p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="w-full grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => {
                                        if (badgeImage) {
                                            const link = document.createElement('a');
                                            link.download = \`starto_badge_\${user?.username || 'profile'}.png\`;
                                            link.href = badgeImage;
                                            link.click();
                                            showToast('Badge downloaded successfully!');
                                        }
                                    }}
                                    disabled={!badgeImage}
                                    className="col-span-2 w-full py-4 bg-primary text-background font-bold uppercase tracking-widest rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                                        showToast('Profile link copied to clipboard!');
                                    }}
                                    className="col-span-2 w-full py-3 border border-white/20 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-white/10 flex items-center justify-center gap-2 transition-colors"
                                >
                                    <LinkIcon className="w-4 h-4" /> Copy Profile Link
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
`;
    content = content.replace(modalRegex, newModalCode);

    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed ShareBadge Modal with html2canvas and exact specifications!');
}
