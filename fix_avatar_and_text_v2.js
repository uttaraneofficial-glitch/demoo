const fs = require('fs');

// 1. Fix Avatar caching CORS issue in html2canvas
const avatarFile = 'starto-web/components/feed/VerifiedAvatar.tsx';
if (fs.existsSync(avatarFile)) {
    let content = fs.readFileSync(avatarFile, 'utf8');
    
    // Replace the src attribute to append a cache buster if it's an http url
    content = content.replace(
        'src={avatarUrl}',
        'src={avatarUrl?.startsWith("http") ? `${avatarUrl}${avatarUrl.includes("?") ? "&" : "?"}not-from-cache-please` : avatarUrl}'
    );

    fs.writeFileSync(avatarFile, content, 'utf8');
    console.log('Fixed VerifiedAvatar CORS caching issue');
}

// 2. Fix Network text opacity bug in ShareBadge
const badgeFile = 'starto-web/components/feed/ShareBadge.tsx';
if (fs.existsSync(badgeFile)) {
    let content = fs.readFileSync(badgeFile, 'utf8');
    
    // Tailwind opacity modifiers (/80) fail on hex variables, so we use the opacity-80 class instead
    content = content.replace(
        'className="text-lg text-background/80 uppercase tracking-[0.2em] font-bold"',
        'className="text-lg text-background opacity-80 uppercase tracking-[0.2em] font-bold"'
    );

    fs.writeFileSync(badgeFile, content, 'utf8');
    console.log('Fixed ShareBadge network text color issue');
}
