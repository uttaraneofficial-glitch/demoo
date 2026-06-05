const fs = require('fs');
const file = 'starto-web/app/profile/page.tsx';

if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Add state for the modal
    if (!content.includes('showShareModal')) {
        content = content.replace(
            /const \[isNetworkModalOpen, setIsNetworkModalOpen\] = useState\(false\)/g,
            "const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false)\n    const [showShareModal, setShowShareModal] = useState(false)"
        );
    }

    // 2. Add Share2 icon to lucide-react if missing
    if (!content.includes('Share2,') && content.includes('lucide-react')) {
        content = content.replace(
            /import \{ MapPin, Globe/g,
            "import { Share2, MapPin, Globe"
        );
    }

    // 3. Replace raw <ShareBadge /> with a button
    content = content.replace(
        /<ShareBadge \/>/g,
        `<button onClick={() => setShowShareModal(true)} className="px-4 py-2 border border-primary text-primary rounded-md text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/10">
                                                <Share2 className="w-3.5 h-3.5" /> Share Profile
                                            </button>`
    );

    // 4. Add the modal at the end of the return statement
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
                                            username={user.username || ''}
                                            name={user.name || ''}
                                            avatarUrl={user.avatarUrl}
                                            plan={user.plan}
                                            role={user.role || ''}
                                            city={user.city || ''}
                                            bio={user.bio || ''}
                                            stats={{ signals: dbSignals.length, connections: dbConnections.length, rating: avgRating }}
                                        />
                                    </div>
                                </div>
                                
                                <button onClick={() => {
                                    navigator.clipboard.writeText(\`https://startoindia.com/profile/\${user.username}\`);
                                    showToast('Profile link copied to clipboard!');
                                }} className="w-full py-4 bg-primary text-background font-bold uppercase tracking-widest rounded-xl hover:opacity-90">
                                    Copy Profile Link
                                </button>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )`;
        content = content.replace(/<\/div>\n\s*<\/div>\n\s*\)\n\}\s*$/g, modalCode + '\n}');
    }

    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed ShareBadge');
}
