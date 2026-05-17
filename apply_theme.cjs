const fs = require("fs");
const path = require("path");
const rules = [
  { from: /text-slate-900/g, to: "text-white" },
  { from: /text-slate-800/g, to: "text-white" },
  { from: /text-slate-700/g, to: "text-white" },
  { from: /text-slate-600/g, to: "text-zinc-400" },
  { from: /text-slate-500/g, to: "text-zinc-500" },
  { from: /text-slate-400/g, to: "text-zinc-600" },
  { from: /bg-slate-50\/50/g, to: "bg-white/5" },
  { from: /bg-slate-50/g, to: "bg-black" },
  { from: /bg-slate-100/g, to: "bg-[#222]" },
  { from: /bg-slate-200/g, to: "bg-white/10" },
  { from: /border-slate-200/g, to: "border-white/20" },
  { from: /border-slate-100/g, to: "border-white/10" },
  { from: /rounded-xl/g, to: "rounded-none" },
  { from: /rounded-lg/g, to: "rounded-none" },
  { from: /rounded-full/g, to: "rounded-none" },
  { from: /rounded-md/g, to: "rounded-none" },
  { from: /rounded/g, to: "rounded-none" },
  { from: /shadow-sm/g, to: "shadow-none" },
  { from: /bg-brand-600/g, to: "bg-orange-500 text-black border border-orange-500" },
  { from: /bg-brand-500/g, to: "bg-orange-500 text-black border border-orange-500" },
  { from: /bg-brand-[0-9]+/g, to: "bg-orange-500/10" },
  { from: /text-brand-[0-9]+/g, to: "text-orange-500" },
  { from: /border-brand-[0-9]+/g, to: "border-orange-500" },
  { from: /text-2xl font-bold/g, to: "text-4xl font-black uppercase tracking-tight" },
  { from: /text-sm font-medium text-white/g, to: "text-[10px] font-bold uppercase tracking-widest text-black" },
  { from: /text-sm font-medium text-slate-700/g, to: "text-[10px] font-bold uppercase tracking-widest text-zinc-400" },
  { from: /bg-emerald-100/g, to: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50" },
  { from: /text-emerald-700|text-emerald-800/g, to: "text-emerald-400" },
  { from: /bg-rose-100/g, to: "bg-rose-500/20 text-rose-400 border border-rose-500/50" },
  { from: /text-rose-700|text-rose-800/g, to: "text-rose-400" },
  { from: /bg-amber-100/g, to: "bg-amber-500/20 text-amber-400 border border-amber-500/50" },
  { from: /text-amber-700|text-amber-800|text-amber-900/g, to: "text-amber-400" },
  { from: /bg-indigo-100/g, to: "bg-indigo-500/20 text-indigo-400 border border-indigo-500/50" },
  { from: /bg-indigo-600/g, to: "bg-orange-500 text-black" },
  { from: /bg-indigo-[0-9]+/g, to: "bg-indigo-500/20" },
  { from: /text-indigo-[0-9]+/g, to: "text-indigo-400" },
  { from: /bg-white/g, to: "bg-black" },
  { from: /bg-slate-900/g, to: "bg-[#111]" },
  { from: /bg-blue-100/g, to: "bg-blue-500/20 text-blue-400 border border-blue-500/50" },
  { from: /text-blue-700|text-blue-800/g, to: "text-blue-400" },
  { from: /bg-orange-100/g, to: "bg-orange-500/20 text-orange-400 border border-orange-500/50" },
  { from: /text-orange-700/g, to: "text-orange-400" }
];
function applyRules(content) {
  let modified = content;
  rules.forEach((r) => {
    modified = modified.replace(r.from, r.to);
  });
  return modified;
}
["Orders.tsx", "Tasks.tsx", "Quality.tsx", "CRM.tsx", "Employees.tsx"].forEach((file) => {
  let p = path.join("src", "pages", file);
  if (fs.existsSync(p)) {
    fs.writeFileSync(p, applyRules(fs.readFileSync(p, "utf8")), "utf8");
    console.log("Modified", p);
  }
});
