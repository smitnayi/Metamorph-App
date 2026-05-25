const fs = require('fs');
const path = require('path');

const rules = [
  { from: /\bbg-\[#111\]/g, to: 'bg-[#f4f4f5] dark:bg-[#111]' },
  { from: /\bbg-black\b/g, to: 'bg-white dark:bg-black' },
  { from: /\btext-white\b/g, to: 'text-zinc-900 dark:text-white' },
  { from: /\bbg-\[#0a0a0a\]/g, to: 'bg-[#fafafa] dark:bg-[#0a0a0a]' },
  { from: /\bbg-\[#0d0d0d\]/g, to: 'bg-white dark:bg-[#0d0d0d]' },
  { from: /\bborder-white\/10\b/g, to: 'border-black/5 dark:border-white/10' },
  { from: /\bborder-white\/20\b/g, to: 'border-black/10 dark:border-white/20' },
  { from: /\bborder-white\/5\b/g, to: 'border-black/5 dark:border-white/5' },
  { from: /\bbg-white\/5\b/g, to: 'bg-black/5 dark:bg-white/5' },
  { from: /\bbg-white\/10\b/g, to: 'bg-black/10 dark:bg-white/10' },
  { from: /\btext-zinc-400\b/g, to: 'text-zinc-600 dark:text-zinc-400' },
  { from: /\btext-zinc-300\b/g, to: 'text-zinc-700 dark:text-zinc-300' }
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  rules.forEach(r => {
    content = content.replace(r.from, r.to);
  });
  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
