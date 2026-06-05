const fs = require('fs');
const file = 'starto-web/app/profile/page.tsx';

if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    if (!content.includes('Share Profile Modal')) {
        const modalCode = `
            {/* Share Profile Modal */}
            <AnimatePresence>
                {showShareModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowShareModal(false)}
                            className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] w-[90%] max-w-[400px] flex flex-col items-center gap-6"
                        >
                            <div className="flex justify-between w-full">
                                <h3 className="text-white font-display text-xl">Share Your Profile</h3>
                                <button onClick={() => setShowShareModal(false)} className="text-white/60 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            
                            <div className="w-full relative rounded-[2rem] overflow-hidden shadow-2xl border border-white/20 aspect-[4/5] bg-black">
                                <div className="absolute top-0 left-0 origin-top-left w-[1080px] h-[1350px]" style={{ transform: 'scale(0.37)' }}>
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
                            
                            <button onClick={() => {
                                navigator.clipboard.writeText(\`https://demoo-production-f047.up.railway.app/profile/\${user?.username}\`);
                                showToast('Profile link copied to clipboard!');
                            }} className="w-full py-4 bg-primary text-background font-bold uppercase tracking-widest rounded-xl hover:opacity-90">
                                Copy Profile Link
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
`;
        
        // Find the last </div>\n    )\n} and inject before it
        const targetStr = "        </div>\r\n    )\r\n}";
        const targetStrUnix = "        </div>\n    )\n}";
        
        if (content.includes(targetStr)) {
            content = content.replace(targetStr, modalCode + targetStr);
        } else if (content.includes(targetStrUnix)) {
            content = content.replace(targetStrUnix, modalCode + targetStrUnix);
        } else {
            console.log("Could not find insertion point.");
            // Try fallback matching the end of file
            content = content.replace(/<\/div>\s*\)\s*\}\s*$/, modalCode + "\n        </div>\n    )\n}");
        }

        fs.writeFileSync(file, content, 'utf8');
        console.log('Added Share Modal successfully');
    } else {
        console.log('Share Profile Modal already exists');
    }
}
