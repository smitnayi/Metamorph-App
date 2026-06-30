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

    content = content.replace(/text-\[10px\] font-black text-zinc-500 uppercase tracking-\[0.1em\]/g, 'text-xs font-bold text-zinc-500 uppercase tracking-widest');
    content = content.replace(/text-\[10px\] font-black uppercase tracking-\[0.1em\]/g, 'text-xs font-bold uppercase tracking-widest');
    content = content.replace(/text-\[11px\] font-black uppercase tracking-\[0.1em\]/g, 'text-sm font-bold uppercase tracking-widest');
    content = content.replace(/text-\[11px\] font-black uppercase tracking-\[0.2em\]/g, 'text-sm font-bold uppercase tracking-widest');
    content = content.replace(/text-\[9px\] font-black/g, 'text-[10px] font-bold');
    content = content.replace(/font-black uppercase tracking-\[0.1em\]/g, 'font-bold uppercase tracking-widest');
    content = content.replace(/font-black/g, 'font-bold');

    if (original !== content) {
      fs.writeFileSync(filepath, content, 'utf8');
      console.log(`Updated ${filepath}`);
    }
  }
});
