const fs = require('fs');
const file = 'starto-web/app/notifications/page.tsx';

if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // 1. Import VerifiedAvatar
    if (!content.includes('VerifiedAvatar')) {
        content = content.replace(
            "import Sidebar from '@/components/feed/Sidebar'",
            "import Sidebar from '@/components/feed/Sidebar'\nimport VerifiedAvatar from '@/components/feed/VerifiedAvatar'"
        );
    }
    
    // 2. Change the pink color to primary for offers
    content = content.replace(
        "if (t.includes('offer')) return 'text-[#9C27B0] bg-[#9C27B0]/10 border-[#9C27B0]/20'",
        "if (t.includes('offer')) return 'text-primary bg-primary/10 border-primary/20'"
    );

    // 3. Add extractSender function
    const extractFunc = `
    const extractSender = (notif: any) => {
        let meta = notif.data;
        if (typeof meta === 'string' && meta.trim().startsWith('{')) {
            try { meta = JSON.parse(meta); } catch (e) {}
        }
        
        if (notif.senderName) return { name: notif.senderName, avatar: notif.senderAvatar || notif.avatarUrl };
        if (meta?.senderName) return { name: meta.senderName, avatar: meta.senderAvatar || meta.avatarUrl };
        
        // Parse from body
        const body = notif.body || '';
        const match = body.match(/^([A-Za-z\\s]+) (sent|commented|accepted|requested|liked|replied)/i);
        if (match) return { name: match[1].trim(), avatar: null };
        
        return null;
    }
    `;
    
    if (!content.includes('extractSender')) {
        content = content.replace(
            "const getIcon = (type: string = '') => {",
            extractFunc + "\n    const getIcon = (type: string = '') => {"
        );
    }

    // 4. Update the render block to use VerifiedAvatar
    const oldRender = `
                                                    <div className={\`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center border \${getColor(notif.type)}\`}>
                                                        {getIcon(notif.type)}
                                                    </div>
    `;
    const newRender = `
                                                    <div className="shrink-0 relative">
                                                        {(() => {
                                                            const sender = extractSender(notif);
                                                            if (sender && !notif.type?.toLowerCase().includes('plan')) {
                                                                return (
                                                                    <VerifiedAvatar 
                                                                        username={sender.name}
                                                                        avatarUrl={sender.avatar}
                                                                        size="w-14 h-14"
                                                                        className="!rounded-2xl shadow-sm"
                                                                    />
                                                                )
                                                            }
                                                            return (
                                                                <div className={\`w-14 h-14 rounded-2xl flex items-center justify-center border \${getColor(notif.type)}\`}>
                                                                    {getIcon(notif.type)}
                                                                </div>
                                                            )
                                                        })()}
                                                    </div>
    `;
    
    content = content.replace(oldRender.trim(), newRender.trim());

    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated notifications page with avatars and fixed colors');
}
