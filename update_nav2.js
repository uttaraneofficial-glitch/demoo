const fs = require('fs');
const file = 'starto-web/app/profile/page.tsx';

if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    content = content.replace(
        "import MobileBottomNav from '@/components/feed/MobileBottomNav'", 
        "import MobileNavigation from '@/components/feed/MobileNavigation'"
    );
    content = content.replace("<MobileBottomNav />", "");
    
    content = content.replace(
        "<Sidebar />", 
        `<MobileNavigation title="Professional Network" />\n                <Sidebar />`
    );
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
}
