const fs = require("node:fs");
const path = require("node:path");
const root = process.cwd();
const output = path.join(root, "dist");
const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) throw new Error("Missing required Vercel environment variables: " + missing.join(", "));
fs.rmSync(output, { recursive: true, force: true });
fs.cpSync(root, output, {
  recursive: true,
  filter(source) {
    const relative = path.relative(root, source);
    if (!relative) return true;
    return ![".git", ".github", "dist", "node_modules", "docs", "supabase", "scripts"].includes(relative.split(path.sep)[0]);
  }
});
const config = { url: process.env.NEXT_PUBLIC_SUPABASE_URL, publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY };
fs.writeFileSync(path.join(output, "js", "supabase-config.js"), "window.SNBT_SUPABASE_CONFIG = " + JSON.stringify(config) + ";\n", "utf8");
console.log("Static site built; only the public Supabase client configuration was included.");
