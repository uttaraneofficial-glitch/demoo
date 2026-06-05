const fs = require('fs');
const modalFile = 'starto-web/components/feed/ShareProfileModal.tsx';

if (fs.existsSync(modalFile)) {
    let content = fs.readFileSync(modalFile, 'utf8');
    
    // Replace html2canvas import
    content = content.replace(
        "import html2canvas from 'html2canvas';",
        "import * as htmlToImage from 'html-to-image';"
    );
    
    // Replace the download logic block
    const oldLogicRegex = /const clone = node\.cloneNode\(true\)[\s\S]*?link\.click\(\);/m;
    const newLogic = `
                                        const dataUrl = await htmlToImage.toPng(node, {
                                            pixelRatio: 2,
                                            cacheBust: true,
                                            style: { transform: 'none' },
                                            width: 1080,
                                            height: 1350
                                        });
                                        
                                        const link = document.createElement('a');
                                        link.download = \`starto_badge_\${user?.username || 'profile'}.png\`;
                                        link.href = dataUrl;
                                        link.click();
`;
    content = content.replace(oldLogicRegex, newLogic.trim());

    fs.writeFileSync(modalFile, content, 'utf8');
    console.log('Replaced html2canvas with html-to-image');
}
