const fs = require('fs');
const file = 'starto-web/app/profile/page.tsx';

if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // Remove generateShareBadge function
    content = content.replace(/const generateShareBadge = \(\) => \{[\s\S]*?\}, 300\); \/\/ Give it a moment to render off-screen\r?\n    \};\r?\n/, '');

    // Revert onClick for the button
    content = content.replace(
        "onClick={generateShareBadge} className=\"px-4 py-2 border border-primary text-primary",
        "onClick={() => setShowShareModal(true)} className=\"px-4 py-2 border border-primary text-primary"
    );

    // Replace the entire modal region
    const modalRegex = /\{\/\* Hidden Node for html2canvas \*\/\}[\s\S]*?<\/AnimatePresence>/m;
    
    const newModalCode = `
            {/* Share Profile Modal */}
            <AnimatePresence>
                {showShareModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 overflow-y-auto pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowShareModal(false)}
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
                                <button onClick={() => setShowShareModal(false)} className="p-2 rounded-full bg-surface-2 text-text-muted hover:text-text-primary hover:bg-border transition-all">
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
                                                // Create a temporary unscaled clone to get a perfect high-res render
                                                const clone = node.cloneNode(true) as HTMLElement;
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
                                        // Assume showToast is available in scope
                                        if (typeof showToast === 'function') showToast('Profile link copied to clipboard!');
                                    }}
                                    className="col-span-2 w-full py-3 border border-border text-text-primary font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-surface-2 flex items-center justify-center gap-2 transition-colors"
                                >
                                    <LinkIcon className="w-4 h-4" /> Copy Profile Link
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>`;

    content = content.replace(modalRegex, newModalCode);
    
    // Also remove the old fixed styling if it's there
    content = content.replace(
        /<div className="fixed top-1\/2 left-1\/2 -translate-x-1\/2 -translate-y-1\/2 z-\[110\] w-\[90%\] max-w-\[420px\] max-h-\[90vh\] overflow-y-auto bg-surface border border-border rounded-\[2rem\] p-6 flex flex-col items-center gap-5 shadow-2xl">/,
        "" // removed
    )

    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed Share Profile Modal permanently for Instant Render + Perfect Centering + Download');
}
