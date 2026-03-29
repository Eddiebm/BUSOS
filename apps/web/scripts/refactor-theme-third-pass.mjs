import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const DIRS = [path.join(root, "app"), path.join(root, "components")];

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

const TOKEN_FIXES = [
  ["text-white", "text-primary-foreground"],
  ["bg-black/70", "bg-overlay/70"],
  ["hover:text-red-300", "hover:text-destructive/80"],
  ["focus:ring-red-500", "focus:ring-destructive"],
  ["border-red-500/40", "border-destructive/40"],
  ["ring-blue-200", "ring-info/35"],
  ["ring-purple-200", "ring-secondary/40"],
  ["ring-green-200", "ring-success/35"],
  ["ring-pink-200", "ring-accent/40"],
  ["ring-slate-200", "ring-border"],
  ["ring-slate-300", "ring-border"],
  ["bg-rose-50/80", "bg-destructive/10"],
  ["bg-rose-50", "bg-destructive/8"],
  ["border-rose-200", "border-destructive/30"],
  ["text-rose-900", "text-destructive"],
  ["text-rose-950/90", "text-destructive/90"],
  ["from-indigo-50", "from-accent/30"],
  ["to-white", "to-card"],
  ["border-indigo-100", "border-primary/20"],
  ["from-zinc-900", "from-card"],
  ["to-zinc-950", "to-background"],
  ["bg-rose-500/80", "bg-destructive/70"],
  ["bg-rose-500", "bg-destructive"],
  ["focus:border-blue-500", "focus:border-primary"],
  ["focus:ring-blue-500", "focus:ring-ring"],
  ["border-indigo-600", "border-primary"],
  ["from-amber-50", "from-primary/10"],
  ["to-amber-100/80", "to-primary/15"],
  ["from-amber-500", "from-primary"],
  ["to-amber-600", "to-primary"],
  ["hover:from-amber-600", "hover:from-primary/90"],
  ["hover:to-amber-700", "hover:to-primary/85"],
  ["ring-amber-300", "ring-primary/40"],
  ["ring-green-300", "ring-success/40"],
  ["ring-purple-300", "ring-secondary/40"],
  ["ring-blue-300", "ring-info/40"],
  ["ring-rose-300", "ring-destructive/40"],
  ["text-yellow-900", "text-warning"],
  ["bg-rose-100", "bg-destructive/12"],
  ["text-amber-900", "text-foreground"],
  ["bg-gray-50", "bg-background"],
  ["text-gray-900", "text-foreground"],
  ["text-gray-700", "text-foreground"],
  ["text-gray-600", "text-muted-foreground"],
  ["text-gray-500", "text-muted-foreground"],
  ["border-gray-300", "border-input"],
  ["bg-gray-900", "bg-foreground"],
  ["hover:bg-gray-800", "hover:bg-foreground/90"],
  ["focus:ring-gray-900", "focus:ring-ring"],
  ["bg-gray-200", "bg-muted"],
];

function fixFile(filePath) {
  let s = fs.readFileSync(filePath, "utf8");
  const orig = s;
  for (const [from, to] of TOKEN_FIXES) {
    s = s.split(from).join(to);
  }
  s = s.replace(/(bg-foreground[^\n"]*)(text-primary-foreground)/g, "$1text-background");
  if (s !== orig) {
    fs.writeFileSync(filePath, s, "utf8");
    return true;
  }
  return false;
}

let n = 0;
for (const dir of DIRS) {
  for (const f of walk(dir)) {
    if (fixFile(f)) {
      n++;
      console.log("updated", path.relative(root, f));
    }
  }
}
console.log("files:", n);
