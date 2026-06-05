const fs = require('fs');
const file = 'starto-web/app/layout.tsx';

if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    content = content.replace(
        "&libraries=geometry,places`}", 
        "&libraries=geometry,places&loading=async`}"
    );
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed Google Maps async warning');
}
