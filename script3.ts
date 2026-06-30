import fs from 'fs';
import path from 'path';

function walk(dir: string, callback: (filepath: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(dirPath);
  });
}

walk('src', (filepath) => {
  if (filepath.endsWith('.tsx')) {
    let content = fs.readFileSync(filepath, 'utf8');
    let original = content;

    // Revert size changes
    content = content.replace(/text-sm font-bold uppercase tracking-widest/g, 'text-[11px] font-black uppercase tracking-[0.2em]');
    content = content.replace(/text-xs font-bold uppercase tracking-widest/g, 'text-[10px] font-black uppercase tracking-[0.1em]');
    content = content.replace(/text-xs font-bold text-zinc-500 uppercase tracking-widest/g, 'text-[10px] font-black text-zinc-500 uppercase tracking-[0.1em]');
    content = content.replace(/text-\[10px\] font-bold/g, 'text-[9px] font-black');
    content = content.replace(/font-bold uppercase tracking-widest/g, 'font-black uppercase tracking-[0.1em]');
    
    // Revert all remaining font-bold to font-black (which was what I did in script.ts)
    content = content.replace(/font-bold/g, 'font-black');

    // Add back font-mono to large numbers
    content = content.replace(/text-4xl font-black tracking-tight/g, 'text-4xl font-black tracking-tight font-mono');
    content = content.replace(/text-3xl font-black tracking-tight/g, 'text-3xl font-black tracking-tight font-mono');
    content = content.replace(/text-3xl md:text-5xl font-black uppercase tracking-tight/g, 'text-3xl md:text-5xl font-black uppercase tracking-tight font-mono'); // Maybe not this one, this is overview. But let's check what had font-mono.

    if (original !== content) {
      fs.writeFileSync(filepath, content, 'utf8');
      console.log(`Updated ${filepath}`);
    }
  }
});
