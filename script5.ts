import fs from 'fs';
import path from 'path';

function walk(dir: string, callback: (filepath: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(dirPath);
  });
}

const ctaReplacements = [
  {
    regex: /bg-orange-500 px-6 py-3.5 md:py-4 rounded-\[16px\] text-xs font-semibold uppercase tracking-widest text-black hover:bg-orange-400 transition-colors shadow-\[0_0_20px_rgba\(249,115,22,0.3\)\]/g,
    replace: 'bg-orange-600 px-5 py-2.5 rounded-lg text-sm font-medium text-white hover:bg-orange-700 transition-colors shadow-sm'
  },
  {
    regex: /bg-orange-500 px-6 py-3 md:py-4 rounded-\[16px\] text-xs font-semibold uppercase tracking-wider text-black hover:bg-orange-400 transition-all shadow-\[0_0_20px_rgba\(249,115,22,0.3\)\]/g,
    replace: 'bg-orange-600 px-5 py-2.5 rounded-lg text-sm font-medium text-white hover:bg-orange-700 transition-colors shadow-sm'
  },
  {
    regex: /bg-orange-500 px-6 py-3 md:py-4 rounded-xl text-xs font-semibold uppercase tracking-wider text-black hover:bg-orange-400 transition-colors shadow-\[0_0_20px_rgba\(249,115,22,0.3\)\]/g,
    replace: 'bg-orange-600 px-5 py-2.5 rounded-lg text-sm font-medium text-white hover:bg-orange-700 transition-colors shadow-sm'
  },
  {
    regex: /bg-orange-500 px-6 py-3 md:py-4 rounded-\[16px\] text-xs font-semibold uppercase tracking-wider text-black hover:bg-orange-600 transition-all shadow-\[0_0_20px_rgba\(249,115,22,0.3\)\]/g,
    replace: 'bg-orange-600 px-5 py-2.5 rounded-lg text-sm font-medium text-white hover:bg-orange-700 transition-colors shadow-sm'
  },
  {
    regex: /bg-orange-500 text-black px-6 py-3.5 rounded-\[16px\] text-xs font-semibold uppercase tracking-wider hover:bg-orange-400 transition-all shadow-\[0_0_20px_rgba\(249,115,22,0.3\)\]/g,
    replace: 'bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors shadow-sm'
  },
  {
    regex: /bg-orange-500 hover:bg-orange-600 text-black px-6 py-3.5 rounded-\[16px\] text-xs font-semibold uppercase tracking-widest transition-colors w-full sm:w-auto inline-flex items-center justify-center gap-3 shadow-\[0_0_20px_rgba\(249,115,22,0.3\)\]/g,
    replace: 'bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto inline-flex items-center justify-center gap-2 shadow-sm'
  },
  {
    regex: /bg-orange-500 text-black rounded-\[16px\] text-xs font-semibold uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-\[0_0_20px_rgba\(249,115,22,0.3\)\]/g,
    replace: 'bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors shadow-sm'
  },
  
  // White / Secondary buttons
  {
    regex: /border border-black\/10 dark:border-white\/20 bg-white\/40 dark:bg-black\/20 backdrop-blur-md px-6 py-3 md:py-4 rounded-xl text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white hover:bg-white hover:text-black hover:border-black\/20 transition-all shadow-lg/g,
    replace: 'border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-2.5 rounded-lg text-sm font-medium text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm'
  },
  {
    regex: /border border-black\/10 dark:border-white\/20 bg-white\/40 dark:bg-black\/20 backdrop-blur-md px-6 py-3 md:py-4 rounded-xl text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white hover:bg-white hover:text-black hover:border-black\/20 transition-all/g,
    replace: 'border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-2.5 rounded-lg text-sm font-medium text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm'
  },
  {
    regex: /bg-white\/60 dark:bg-black\/40 backdrop-blur-md border border-black\/10 dark:border-white\/10 px-6 py-3 md:py-4 rounded-\[16px\] text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white hover:bg-white dark:hover:bg-black transition-all shadow-sm/g,
    replace: 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-5 py-2.5 rounded-lg text-sm font-medium text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm'
  },
  {
    regex: /px-6 py-3.5 bg-white\/60 dark:bg-black\/40 backdrop-blur-md border border-black\/10 dark:border-white\/10 rounded-\[16px\] text-xs font-semibold uppercase tracking-widest text-zinc-900 dark:text-white hover:bg-white dark:hover:bg-zinc-800 transition-colors shadow-sm active:scale-95/g,
    replace: 'px-5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm active:scale-95'
  }
];

walk('src', (filepath) => {
  if (filepath.endsWith('.tsx')) {
    let content = fs.readFileSync(filepath, 'utf8');
    let original = content;

    for (const { regex, replace } of ctaReplacements) {
      content = content.replace(regex, replace);
    }
    
    // Some general cleanups for excessive styling
    content = content.replace(/ uppercase tracking-widest/g, '');
    content = content.replace(/ uppercase tracking-wider/g, '');
    content = content.replace(/text-\[10px\]/g, 'text-xs');
    content = content.replace(/text-\[11px\]/g, 'text-sm');
    content = content.replace(/text-\[9px\]/g, 'text-xs');
    content = content.replace(/rounded-\[16px\]/g, 'rounded-xl');
    content = content.replace(/rounded-\[12px\]/g, 'rounded-lg');
    content = content.replace(/rounded-\[8px\]/g, 'rounded-md');
    
    // Replace leftover button text-black with text-white if bg-orange-500 is used on same line
    const lines = content.split('\n');
    content = lines.map(line => {
      if ((line.includes('bg-orange-500') || line.includes('bg-orange-600')) && line.includes('text-black')) {
        return line.replace(/text-black/g, 'text-white');
      }
      return line;
    }).join('\n');

    if (original !== content) {
      fs.writeFileSync(filepath, content, 'utf8');
      console.log(`Updated ${filepath}`);
    }
  }
});
