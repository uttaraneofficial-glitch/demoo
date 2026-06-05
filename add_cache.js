const fs = require('fs');
const file = 'starto-web/app/notifications/page.tsx';

if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // 1. Replace the useState initialization to use localStorage caching
    const oldState = "const [notifications, setNotifications] = useState<any[]>([])";
    const newState = `const [notifications, setNotifications] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            try {
                const cached = localStorage.getItem('starto_notifs_cache');
                if (cached) return JSON.parse(cached);
            } catch (e) {}
        }
        return [];
    })`;
    
    content = content.replace(oldState, newState);
    
    // 2. Update fetchNotifications to save to localStorage
    const oldSetNotifs = "setNotifications(filtered);";
    const newSetNotifs = `setNotifications(filtered);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('starto_notifs_cache', JSON.stringify(filtered));
                }`;
                
    content = content.replace(oldSetNotifs, newSetNotifs);

    fs.writeFileSync(file, content, 'utf8');
    console.log('Implemented zero-delay localStorage caching for notifications');
}
