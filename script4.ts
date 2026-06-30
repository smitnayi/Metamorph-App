import fs from 'fs';
import path from 'path';

function walk(dir: string, callback: (filepath: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(dirPath);
  });
}

const fontReplacements: Record<string, string> = {
  'text-[10px] font-black uppercase tracking-[0.1em]': 'text-xs font-semibold text-zinc-500 uppercase tracking-wider',
  'text-[11px] font-black uppercase tracking-[0.1em]': 'text-xs font-semibold uppercase tracking-wider',
  'text-[11px] font-black uppercase tracking-[0.2em]': 'text-xs font-semibold uppercase tracking-widest',
  'text-[9px] font-black uppercase tracking-[0.1em]': 'text-[10px] font-semibold uppercase tracking-wider',
  'text-xs font-black uppercase tracking-[0.1em]': 'text-xs font-semibold uppercase tracking-wider',
  'font-black uppercase tracking-tight font-mono': 'font-bold tracking-tight',
  'font-black uppercase tracking-[0.1em]': 'font-semibold uppercase tracking-wider',
  'font-black uppercase tracking-[0.2em]': 'font-semibold uppercase tracking-widest',
  'text-sm font-black uppercase tracking-wide': 'text-sm font-semibold tracking-tight',
  'text-3xl md:text-5xl font-black uppercase tracking-tight font-mono': 'text-3xl md:text-4xl font-bold tracking-tight',
  'text-3xl md:text-5xl font-black uppercase tracking-tight': 'text-3xl md:text-4xl font-bold tracking-tight',
  'text-4xl font-black tracking-tight font-mono': 'text-4xl font-semibold tracking-tight',
  'text-3xl font-black tracking-tight font-mono': 'text-3xl font-semibold tracking-tight',
  'font-black': 'font-semibold'
};

const ctaReplacements = [
  {
    regex: /px-6 py-3.5 bg-orange-500 text-black rounded-\[16px\] text-\[11px\] font-black uppercase tracking-\[0.2em\] hover:bg-orange-600 transition-colors shadow-\[0_0_20px_rgba\(249,115,22,0.3\)\] active:scale-95/g,
    replace: 'px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm active:scale-95'
  },
  {
    regex: /px-6 py-3.5 bg-white\/60 dark:bg-black\/40 backdrop-blur-md border border-black\/10 dark:border-white\/10 rounded-\[16px\] text-\[11px\] font-black uppercase tracking-\[0.2em\] text-zinc-900 dark:text-white hover:bg-white dark:hover:bg-zinc-800 transition-colors shadow-sm active:scale-95/g,
    replace: 'px-5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm active:scale-95'
  },
  {
    regex: /bg-rose-500 text-white px-6 py-3 rounded-\[12px\] text-\[11px\] font-black uppercase tracking-\[0.1em\] pointer-events-none shadow-sm shadow-rose-500\/20/g,
    replace: 'bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium pointer-events-none shadow-sm'
  }
];

walk('src', (filepath) => {
  if (filepath.endsWith('.tsx')) {
    let content = fs.readFileSync(filepath, 'utf8');
    let original = content;

    for (const [key, value] of Object.entries(fontReplacements)) {
      content = content.split(key).join(value);
    }
    
    for (const { regex, replace } of ctaReplacements) {
      content = content.replace(regex, replace);
    }

    if (original !== content) {
      fs.writeFileSync(filepath, content, 'utf8');
      console.log(`Updated ${filepath}`);
    }
  }
});
