const fs = require('fs');
const file = 'starto-web/app/profile/page.tsx';

if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Replace the motion.div classes for the modal container
    const oldModalClass = "className=\"fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] w-[90%] max-w-[420px] flex flex-col items-center gap-6\"";
    const newModalClass = "className=\"fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] w-[90%] max-w-[420px] max-h-[90vh] overflow-y-auto bg-surface border border-border rounded-[2rem] p-6 flex flex-col items-center gap-5 shadow-2xl\"";
    
    content = content.replace(oldModalClass, newModalClass);

    // 2. Fix the header text color so it works in light/dark mode
    content = content.replace(
        "className=\"text-white font-display text-2xl tracking-tight\"",
        "className=\"text-text-primary font-display text-2xl tracking-tight\""
    );
    
    // 3. Fix the X button
    content = content.replace(
        "className=\"p-2 rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all\"",
        "className=\"p-2 rounded-full bg-surface-2 text-text-muted hover:text-text-primary hover:bg-border transition-all\""
    );

    // 4. Update the preview area container
    content = content.replace(
        "className=\"w-full relative rounded-3xl overflow-hidden shadow-2xl border border-white/20 aspect-[4/5] bg-black/50 flex items-center justify-center\"",
        "className=\"w-full relative rounded-2xl overflow-hidden shadow-md border border-border aspect-[4/5] bg-surface-2 flex items-center justify-center\""
    );

    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed Modal Styling for Senior Level UI');
}
