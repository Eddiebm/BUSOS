/**
 * One-off refactor: replace hardcoded Tailwind palette classes with semantic tokens.
 * Run: node scripts/refactor-theme-classes.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const DIRS = [path.join(root, "app"), path.join(root, "components")];

/** Longest-first so partial class names don't break (e.g. zinc-950 before zinc-9). */
const REPLACEMENTS = [
  ["border-amber-200", "border-primary/40"],
  ["border-amber-300", "border-primary/45"],
  ["border-amber-400/40", "border-primary/50"],
  ["border-amber-500/20", "border-primary/25"],
  ["border-amber-500/25", "border-primary/30"],
  ["border-amber-500/30", "border-primary/35"],
  ["border-amber-500/35", "border-primary/40"],
  ["border-amber-500/40", "border-primary/45"],
  ["border-amber-600", "border-primary"],
  ["border-blue-200", "border-info/35"],
  ["border-blue-300", "border-info/40"],
  ["border-emerald-200", "border-success/35"],
  ["border-green-200", "border-success/35"],
  ["border-indigo-200", "border-primary/35"],
  ["border-indigo-300", "border-primary/40"],
  ["border-indigo-400", "border-primary/50"],
  ["border-orange-200", "border-warning/40"],
  ["border-pink-200", "border-accent/40"],
  ["border-purple-200", "border-secondary/40"],
  ["border-red-200", "border-destructive/40"],
  ["border-red-300", "border-destructive/45"],
  ["border-red-500/30", "border-destructive/35"],
  ["border-slate-100", "border-border"],
  ["border-slate-200", "border-border"],
  ["border-slate-300", "border-border"],
  ["border-yellow-200", "border-warning/40"],
  ["border-zinc-600", "border-border"],
  ["border-zinc-700", "border-border"],
  ["border-zinc-700/80", "border-border/80"],
  ["border-zinc-800", "border-border"],
  ["border-zinc-800/80", "border-border/80"],
  ["border-zinc-800/80", "border-border/80"],
  ["ring-indigo-300", "ring-ring"],
  ["ring-indigo-400", "ring-ring"],
  ["ring-slate-500", "ring-ring"],
  ["ring-offset-2", "ring-offset-background"],
  ["bg-amber-50", "bg-warning/10"],
  ["bg-amber-50/30", "bg-warning/10"],
  ["bg-amber-100", "bg-warning/15"],
  ["bg-amber-500/5", "bg-primary/5"],
  ["bg-amber-500/10", "bg-primary/10"],
  ["bg-amber-500/15", "bg-primary/15"],
  ["bg-amber-500/20", "bg-primary/20"],
  ["bg-amber-500/70", "bg-primary/70"],
  ["bg-amber-500/80", "bg-primary/80"],
  ["bg-black/40", "bg-overlay/40"],
  ["bg-black/50", "bg-overlay/50"],
  ["bg-blue-50", "bg-info/10"],
  ["bg-blue-100", "bg-info/15"],
  ["bg-emerald-50", "bg-success/10"],
  ["bg-green-50", "bg-success/10"],
  ["bg-green-100", "bg-success/15"],
  ["bg-indigo-50", "bg-primary/8"],
  ["bg-indigo-50/50", "bg-primary/8"],
  ["bg-indigo-100", "bg-primary/12"],
  ["bg-indigo-600", "bg-primary"],
  ["bg-orange-50", "bg-warning/10"],
  ["bg-orange-100", "bg-warning/15"],
  ["bg-pink-100", "bg-accent/15"],
  ["bg-purple-50", "bg-secondary/10"],
  ["bg-purple-100", "bg-secondary/15"],
  ["bg-red-50", "bg-destructive/10"],
  ["bg-red-500/10", "bg-destructive/10"],
  ["bg-red-500/20", "bg-destructive/20"],
  ["bg-slate-50", "bg-background"],
  ["bg-slate-100", "bg-muted"],
  ["bg-slate-200", "bg-muted"],
  ["bg-slate-800", "bg-foreground"],
  ["bg-slate-900", "bg-foreground"],
  ["bg-white", "bg-card"],
  ["bg-yellow-50", "bg-warning/10"],
  ["bg-yellow-100", "bg-warning/15"],
  ["bg-zinc-800/50", "bg-muted/50"],
  ["bg-zinc-800/80", "bg-muted/80"],
  ["bg-zinc-900/40", "bg-card/40"],
  ["bg-zinc-900/50", "bg-card/50"],
  ["bg-zinc-900/60", "bg-card/60"],
  ["bg-zinc-900/80", "bg-card/80"],
  ["bg-zinc-950/80", "bg-background/80"],
  ["bg-zinc-950", "bg-background"],
  ["bg-zinc-900", "bg-card"],
  ["bg-zinc-800", "bg-muted"],
  ["text-amber-50", "text-primary-foreground"],
  ["text-amber-100", "text-primary"],
  ["text-amber-200/80", "text-primary"],
  ["text-amber-200/90", "text-primary"],
  ["text-amber-200/95", "text-primary"],
  ["text-amber-300", "text-primary"],
  ["text-amber-400/90", "text-primary"],
  ["text-amber-500/80", "text-primary"],
  ["text-amber-600", "text-primary"],
  ["text-amber-700", "text-primary"],
  ["text-amber-800", "text-primary"],
  ["text-blue-500", "text-info"],
  ["text-blue-600", "text-info"],
  ["text-blue-700", "text-info"],
  ["text-blue-900", "text-foreground"],
  ["text-emerald-400", "text-success"],
  ["text-green-500", "text-success"],
  ["text-green-600", "text-success"],
  ["text-green-700", "text-success"],
  ["text-green-800", "text-success"],
  ["text-green-900", "text-foreground"],
  ["text-indigo-600", "text-primary"],
  ["text-indigo-700", "text-primary"],
  ["text-indigo-800", "text-primary"],
  ["text-indigo-900", "text-foreground"],
  ["text-orange-900", "text-foreground"],
  ["text-pink-900", "text-foreground"],
  ["text-purple-700", "text-secondary-foreground"],
  ["text-purple-900", "text-foreground"],
  ["text-red-200", "text-destructive-foreground"],
  ["text-red-400", "text-destructive"],
  ["text-red-500", "text-destructive"],
  ["text-red-600", "text-destructive"],
  ["text-red-700", "text-destructive"],
  ["text-red-800", "text-destructive"],
  ["text-slate-300", "text-muted-foreground"],
  ["text-slate-400", "text-muted-foreground"],
  ["text-slate-500", "text-muted-foreground"],
  ["text-slate-600", "text-muted-foreground"],
  ["text-slate-700", "text-foreground"],
  ["text-slate-800", "text-foreground"],
  ["text-slate-900", "text-foreground"],
  ["text-yellow-800", "text-warning"],
  ["text-zinc-100", "text-foreground"],
  ["text-zinc-200", "text-foreground"],
  ["text-zinc-300", "text-muted-foreground"],
  ["text-zinc-400", "text-muted-foreground"],
  ["text-zinc-500", "text-muted-foreground"],
  ["text-zinc-600", "text-muted-foreground"],
  ["text-black", "text-foreground"],
  ["hover:bg-amber-50", "hover:bg-primary/10"],
  ["hover:bg-indigo-50", "hover:bg-primary/10"],
  ["hover:bg-indigo-700", "hover:bg-primary/90"],
  ["hover:bg-red-600", "hover:bg-destructive/90"],
  ["hover:bg-slate-50", "hover:bg-muted"],
  ["hover:bg-slate-100", "hover:bg-muted"],
  ["hover:bg-zinc-800", "hover:bg-muted"],
  ["hover:bg-zinc-800/80", "hover:bg-muted/80"],
  ["hover:bg-slate-800", "hover:bg-foreground/90"],
  ["focus:ring-slate-500", "focus:ring-ring"],
  ["focus:border-slate-400", "focus:border-primary"],
  ["hover:text-amber-400", "hover:text-primary"],
  ["hover:text-indigo-600", "hover:text-primary"],
  ["hover:text-red-600", "hover:text-destructive"],
  ["hover:text-slate-700", "hover:text-foreground"],
  ["hover:text-zinc-200", "hover:text-foreground"],
  ["hover:text-zinc-700", "hover:text-foreground"],
  ["hover:border-indigo-400", "hover:border-primary"],
  ["focus:border-indigo-400", "focus:border-primary"],
  ["focus:ring-indigo-300", "focus:ring-ring"],
  ["placeholder:text-slate-400", "placeholder:text-muted-foreground"],
  ["placeholder:text-zinc-400", "placeholder:text-muted-foreground"],
  ["placeholder:text-zinc-600", "placeholder:text-muted-foreground"],
  ["divide-slate-100", "divide-border"],
  ["divide-zinc-800", "divide-border"],
  ["from-slate-50", "from-background"],
  ["to-slate-100", "to-muted"],
  ["shadow-slate-200/50", "shadow-border/50"],
  ["bg-blue-500/20", "bg-info/20"],
  ["text-blue-200", "text-info"],
  ["bg-zinc-700", "bg-muted"],
  ["bg-red-100", "bg-destructive/15"],
];

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (name.endsWith(".tsx")) acc.push(p);
  }
  return acc;
}

function refactorFile(filePath) {
  let s = fs.readFileSync(filePath, "utf8");
  const orig = s;
  for (const [from, to] of REPLACEMENTS) {
    if (from === to) continue;
    s = s.split(from).join(to);
  }
  if (s !== orig) {
    fs.writeFileSync(filePath, s, "utf8");
    return true;
  }
  return false;
}

let changed = 0;
for (const dir of DIRS) {
  for (const f of walk(dir)) {
    if (refactorFile(f)) {
      changed++;
      console.log("updated", path.relative(root, f));
    }
  }
}
console.log("files changed:", changed);
