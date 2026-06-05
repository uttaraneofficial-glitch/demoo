const fs = require('fs');
const file = 'starto-web/app/profile/page.tsx';

if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix editForm.handleBase.toLowerCase() to (editForm.handleBase || '').toLowerCase()
    content = content.replace(/editForm\.handleBase\.toLowerCase/g, "(editForm.handleBase || '').toLowerCase");
    
    // Fix username.split to (username || '').split
    content = content.replace(/username\.split/g, "(username || '').split");
    
    // Fix name ? name.split to name ? (name || '').split
    content = content.replace(/name \? name\.split/g, "name ? (name || '').split");
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed undefined splits and lowercases');
}
