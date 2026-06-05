const fs = require('fs');
const file = 'starto-web/components/feed/ShareBadge.tsx';

if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // 1. Fix the rating from '—' to '0'
    content = content.replace(
        "{stats?.rating && stats.rating > 0 ? stats.rating.toFixed(1) : '—'}",
        "{stats?.rating && stats.rating > 0 ? stats.rating.toFixed(1) : '0'}"
    );

    // 2. Fix the cramped name by changing tracking-tighter to tracking-tight
    content = content.replace(
        'className="text-7xl font-display font-black tracking-tighter text-text-primary leading-none"',
        'className="text-6xl font-display font-black tracking-tight text-text-primary leading-tight"' // Slightly smaller font and looser tracking
    );

    // 3. Fix the bio being too large for long text
    content = content.replace(
        'className="text-2xl text-text-secondary italic leading-relaxed text-center px-12 font-display"',
        'className="text-xl text-text-secondary italic leading-relaxed text-center px-8 font-sans font-medium"' // Smaller, sans-serif for better readability
    );

    // 4. Reduce spacing slightly above the bio to give more breathing room to the stats
    content = content.replace(
        'className="mt-8 px-12 py-8 bg-surface-2 border border-border rounded-3xl relative max-w-[800px] mx-auto text-left shadow-inner"',
        'className="mt-6 px-10 py-6 bg-surface-2 border border-border rounded-3xl relative max-w-[800px] mx-auto text-left shadow-inner"'
    );
    
    // 5. Adjust the stats row margin so it doesn't collide with the bio
    content = content.replace(
        'className="grid grid-cols-3 gap-6 mt-12 w-full max-w-[900px] mx-auto"',
        'className="grid grid-cols-3 gap-6 mt-10 w-full max-w-[900px] mx-auto"'
    );

    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed rating symbol and improved layout breathing room');
}
