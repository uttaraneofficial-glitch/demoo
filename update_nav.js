const fs = require('fs');
const files = [
    'starto-web/app/admin/page.tsx',
    'starto-web/app/admin/promo-codes/page.tsx',
    'starto-web/app/explore/page.tsx',
    'starto-web/app/feed/page.tsx',
    'starto-web/app/nearby/page.tsx',
    'starto-web/app/network/page.tsx',
    'starto-web/app/signals/[id]/page.tsx',
    'starto-web/app/subscription/page.tsx',
    'starto-web/app/profile/[username]/page.tsx'
];

const titles = {
    'starto-web/app/feed/page.tsx': 'Signals Feed',
    'starto-web/app/explore/page.tsx': 'Starto AI Explore',
    'starto-web/app/network/page.tsx': 'My Network',
    'starto-web/app/nearby/page.tsx': 'Nearby Startups',
    'starto-web/app/admin/page.tsx': 'Admin Dashboard',
    'starto-web/app/admin/promo-codes/page.tsx': 'Admin Promo Codes',
    'starto-web/app/subscription/page.tsx': 'Starto Premium',
    'starto-web/app/signals/[id]/page.tsx': 'Signal Details',
    'starto-web/app/profile/[username]/page.tsx': 'User Profile'
};

files.forEach(f => {
    if (fs.existsSync(f)) {
        let content = fs.readFileSync(f, 'utf8');
        
        content = content.replace(
            "import MobileBottomNav from '@/components/feed/MobileBottomNav'", 
            "import MobileNavigation from '@/components/feed/MobileNavigation'"
        );
        content = content.replace("<MobileBottomNav />", "");
        
        const title = titles[f] || 'Starto Ecosystem';
        content = content.replace(
            "<Sidebar />", 
            `<MobileNavigation title="${title}" />\n                <Sidebar />`
        );
        
        fs.writeFileSync(f, content, 'utf8');
        console.log('Updated ' + f);
    }
});
