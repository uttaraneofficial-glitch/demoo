const fs = require('fs');
const avatarFile = 'starto-web/components/feed/VerifiedAvatar.tsx';
if (fs.existsSync(avatarFile)) {
    let content = fs.readFileSync(avatarFile, 'utf8');
    
    // Completely remove the problematic style and rely purely on Tailwind font sizes
    content = content.replace(
        'className="tracking-tighter uppercase font-bold" style={{ fontSize: "0.45em" }}',
        'className="tracking-tighter uppercase font-bold"'
    );

    fs.writeFileSync(avatarFile, content, 'utf8');
}
