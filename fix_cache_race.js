const fs = require('fs');
const file = 'starto-web/app/notifications/page.tsx';

if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    const oldFetch = `    const fetchNotifications = useCallback(async () => {
        try {
            const { data } = await notificationsApi.getAll();
            if (data) {
                const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
                const filtered = data
                    .map(normalizeNotif)
                    .filter((n: any) => new Date(n.createdAt).getTime() >= sevenDaysAgo)
                    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setNotifications(filtered);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('starto_notifs_cache', JSON.stringify(filtered));
                }
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        } finally {
            setIsLoading(false);
        }
    }, []);`;

    const newFetch = `    const fetchNotifications = useCallback(async () => {
        try {
            const res = await notificationsApi.getAll();
            // Strictly verify data is an array to avoid auth race condition returning null/undefined
            if (res && Array.isArray(res.data)) {
                const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
                const filtered = res.data
                    .map(normalizeNotif)
                    .filter((n: any) => new Date(n.createdAt).getTime() >= sevenDaysAgo)
                    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                
                setNotifications(filtered);
                setIsLoading(false); // Only mark as loaded when we have a successful array response
                
                if (typeof window !== 'undefined') {
                    localStorage.setItem('starto_notifs_cache', JSON.stringify(filtered));
                }
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err);
            // We intentionally do not setIsLoading(false) here, so the polling will keep trying instead of flashing the empty state
        }
    }, []);`;

    content = content.replace(oldFetch, newFetch);
    
    // Ensure the cache is loaded safely in useEffect to prevent Next.js hydration issues entirely
    const oldState = `const [notifications, setNotifications] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            try {
                const cached = localStorage.getItem('starto_notifs_cache');
                if (cached) return JSON.parse(cached);
            } catch (e) {}
        }
        return [];
    })`;
    
    const newState = `const [notifications, setNotifications] = useState<any[]>([])`;
    
    content = content.replace(oldState, newState);
    
    const oldEffect = `    // Real-time polling every 10 seconds for "no delay" feel
    useEffect(() => {
        fetchNotifications();
        const intervalId = setInterval(fetchNotifications, 10000);
        return () => clearInterval(intervalId);
    }, [fetchNotifications]);`;

    const newEffect = `    // Real-time polling every 5 seconds + Cache injection
    useEffect(() => {
        // 1. Instantly inject cache to guarantee zero-delay render
        try {
            const cached = localStorage.getItem('starto_notifs_cache');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed && parsed.length > 0) {
                    setNotifications(parsed);
                    setIsLoading(false);
                }
            }
        } catch(e) {}
        
        // 2. Fetch fresh data in the background
        fetchNotifications();
        
        // 3. Poll aggressively every 5 seconds for "real-world" feel
        const intervalId = setInterval(fetchNotifications, 5000);
        return () => clearInterval(intervalId);
    }, [fetchNotifications]);`;

    content = content.replace(oldEffect, newEffect);

    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed cache poisoning race condition and accelerated polling');
}
