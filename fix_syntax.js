const fs = require('fs');
const file = 'starto-web/app/profile/page.tsx';

if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix the syntax error created by bad regex
    content = content.replace(/user\.\(username \|\| ''\)\.split/g, "(user.username || '').split");
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed syntax error in page.tsx');
}
