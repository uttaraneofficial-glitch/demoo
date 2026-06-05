const fs = require('fs');
const file = 'starto-web/app/profile/page.tsx';

if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Add import
    if (!content.includes('import { ShareBadge }')) {
        content = content.replace(
            "import VerifiedAvatar from '@/components/feed/VerifiedAvatar'",
            "import VerifiedAvatar from '@/components/feed/VerifiedAvatar'\nimport { ShareBadge } from '@/components/feed/ShareBadge'"
        );
    }
    
    // Add button
    if (!content.includes('<ShareBadge />')) {
        content = content.replace(
            /\{\s*displayPlan === 'Free' \? 'Upgrade' : 'My Plan'\s*\}\n\s*<\/Link>\n\s*<\/div>/g,
            `{displayPlan === 'Free' ? 'Upgrade' : 'My Plan'}
                                            </Link>
                                            <ShareBadge />
                                        </div>`
        );
    }
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Restored ShareBadge');
}
