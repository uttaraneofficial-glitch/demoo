const fs = require('fs');
const file = 'starto-web/app/profile/page.tsx';

if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Add button
    const targetStr = "{displayPlan === 'Free' ? 'Upgrade' : 'My Plan'}\n                                            </Link>\n                                        </div>";
    const replacementStr = "{displayPlan === 'Free' ? 'Upgrade' : 'My Plan'}\n                                            </Link>\n                                            <ShareBadge />\n                                        </div>";
    
    if (content.includes(targetStr)) {
        content = content.replace(targetStr, replacementStr);
        fs.writeFileSync(file, content, 'utf8');
        console.log('Restored ShareBadge button');
    } else {
        // Try Windows CRLF
        const targetStrCr = targetStr.replace(/\n/g, '\r\n');
        const replacementStrCr = replacementStr.replace(/\n/g, '\r\n');
        if (content.includes(targetStrCr)) {
            content = content.replace(targetStrCr, replacementStrCr);
            fs.writeFileSync(file, content, 'utf8');
            console.log('Restored ShareBadge button (CRLF)');
        } else {
            console.log('Could not find target string');
        }
    }
}
