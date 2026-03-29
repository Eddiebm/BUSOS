import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const DIRS = [path.join(root, "app"), path.join(root, "components")];

const REPLACEMENTS = [
  ["bg-success/100/15", "bg-success/15"],
  ["bg-warning/100/15", "bg-primary/15"],
  ["bg-warning/100/10", "bg-primary/10"],
  ["bg-warning/100/20", "bg-primary/20"],
  ["bg-warning/100/5", "bg-primary/5"],
  ["bg-warning/100/90", "bg-primary"],
  ["bg-warning/100/80", "bg-primary/80"],
  ["bg-warning/100/70", "bg-primary/70"],
  ["bg-warning/100/75", "bg-primary/75"],
  ["hover:bg-warning/100/20", "hover:bg-primary/20"],
  ["hover:bg-warning/100/15", "hover:bg-primary/15"],
  ["border-amber-500/15", "border-primary/15"],
  ["focus:border-amber-500/50", "focus:border-primary/50"],
  ["focus:ring-amber-500/30", "focus:ring-primary/30"],
  ["text-amber-400/80", "text-primary/80"],
  ["text-amber-400", "text-primary"],
  ["text-amber-200/70", "text-primary/70"],
  ["text-amber-200", "text-primary"],
  ["hover:bg-amber-400", "hover:bg-primary/85"],
  ["bg-amber-600", "bg-primary"],
  ["hover:bg-amber-700", "hover:bg-primary/90"],
  ["text-zinc-50", "text-foreground"],
  ["text-zinc-950", "text-primary-foreground"],
  ["ring-orange-200", "ring-warning/30"],
  ["ring-yellow-200", "ring-warning/35"],
  ["bg-pink-50", "bg-accent/20"],
  ["text-pink-700", "text-accent-foreground"],
  ["text-orange-700", "text-warning"],
  ["text-yellow-700", "text-warning"],
  ["text-emerald-300", "text-success"],
  ["text-emerald-500", "text-success"],
  ["text-emerald-900", "text-success"],
  ["text-emerald-950", "text-success"],
  ["text-orange-950", "text-foreground"],
  ["text-amber-950", "text-foreground"],
  ["text-indigo-950", "text-foreground"],
  ["text-indigo-500", "text-primary"],
  ["focus:border-indigo-500", "focus:border-primary"],
  ["focus:ring-indigo-200", "focus:ring-primary/30"],
  ["focus:ring-indigo-500", "focus:ring-ring"],
  ["border-amber-400", "border-primary/50"],
  ["border-red-600", "border-destructive"],
  ["from-zinc-950", "from-background"],
  ["via-zinc-950", "via-background"],
  ["to-zinc-900", "to-card"],
  ["to-blue-950/40", "to-info/20"],
  ["to-rose-950/50", "to-destructive/25"],
  ["bg-blue-950/40", "bg-info/15"],
  ["border-blue-500/25", "border-info/25"],
  ["hover:text-red-100", "hover:text-destructive-foreground"],
  ["bg-red-950/40", "bg-destructive/15"],
  ["bg-red-950/50", "bg-destructive/20"],
  ["text-red-100", "text-destructive-foreground"],
  ["text-red-900", "text-destructive"],
  ["hover:text-red-950", "hover:text-destructive"],
  ["text-red-950", "text-destructive"],
  ["text-blue-800", "text-info"],
  ["hover:bg-blue-200", "hover:bg-info/25"],
  ["hover:bg-red-200", "hover:bg-destructive/25"],
  ["hover:bg-indigo-200", "hover:bg-primary/20"],
  ["bg-red-600", "bg-destructive"],
  ["hover:bg-red-700", "hover:bg-destructive/90"],
  ["bg-blue-600", "bg-info"],
  ["hover:bg-blue-700", "hover:bg-info/90"],
  ["text-blue-800", "text-info"],
  ["bg-slate-300", "bg-muted"],
  ["bg-slate-400", "bg-muted-foreground"],
  ["hover:bg-slate-700", "hover:bg-muted"],
  ["bg-blue-50", "bg-info/10"],
  ["hover:bg-slate-800", "hover:bg-muted"],
  ["text-indigo-950", "text-foreground"],
  ["border-slate-500", "border-border"],
  ["focus:border-slate-500", "focus:border-primary"],
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

let changed = 0;
for (const dir of DIRS) {
  for (const f of walk(dir)) {
    let s = fs.readFileSync(f, "utf8");
    const orig = s;
    for (const [from, to] of REPLACEMENTS) {
      s = s.split(from).join(to);
    }
    if (s !== orig) {
      fs.writeFileSync(f, s, "utf8");
      changed++;
      console.log("updated", path.relative(root, f));
    }
  }
}
console.log("files changed:", changed);
