const fs = require('fs');
const file = 'starto-web/app/profile/page.tsx';

if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix user.name.split to (user.name || '').split
    content = content.replace(/user\.name\.split/g, "(user.name || '').split");
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed undefined split on user.name');
}
