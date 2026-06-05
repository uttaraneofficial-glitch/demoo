const fs = require('fs');

// 1. Fix ShareBadge.tsx overflow issue
const badgeFile = 'starto-web/components/feed/ShareBadge.tsx';
if (fs.existsSync(badgeFile)) {
    let content = fs.readFileSync(badgeFile, 'utf8');
    
    // Remove overflow-hidden from the Main Central Card so the avatar isn't cut off
    content = content.replace(
        'className="w-full bg-surface border-2 border-border rounded-[3rem] p-16 flex flex-col items-center shadow-2xl relative overflow-hidden"',
        'className="w-full bg-surface border-2 border-border rounded-[3rem] p-16 flex flex-col items-center shadow-2xl relative"'
    );
    
    // Add text-[80px] to VerifiedAvatar explicitly for the ShareBadge so initials are huge
    content = content.replace(
        'className="!rounded-[2rem]"',
        'className="!rounded-[2rem] text-[80px]"'
    );

    fs.writeFileSync(badgeFile, content, 'utf8');
    console.log('Fixed ShareBadge.tsx overflow issue');
}

// 2. Fix VerifiedAvatar.tsx font size issue
const avatarFile = 'starto-web/components/feed/VerifiedAvatar.tsx';
if (fs.existsSync(avatarFile)) {
    let content = fs.readFileSync(avatarFile, 'utf8');
    
    // Replace the problematic style with a clean fallback if text size isn't passed via className
    content = content.replace(
        'className="text-lg tracking-tighter uppercase font-bold" style={{ fontSize: "clamp(12px, 40%, 40px)" }}',
        'className="tracking-tighter uppercase font-bold" style={{ fontSize: "0.45em" }}'
    );
    
    // Make the outer span set font-size based on width, but since we can't easily do that without JS,
    // we'll just rely on the parent (className) passing a text-[] size. If not, fallback to text-sm.
    content = content.replace(
        '<span className={`relative inline-flex shrink-0 ${size} ${className}`}>',
        '<span className={`relative inline-flex shrink-0 ${size} ${className} ${className.includes("text-") ? "" : "text-base"}`}>'
    );

    fs.writeFileSync(avatarFile, content, 'utf8');
    console.log('Fixed VerifiedAvatar.tsx font size');
}
