const fs = require("node:fs");
const assert = require("node:assert/strict");

const html = fs.readFileSync("akun.html", "utf8");
const auth = fs.readFileSync("js/auth.js", "utf8");
const client = fs.readFileSync("js/supabase-client.js", "utf8");
const config = fs.readFileSync("js/supabase-config.js", "utf8");

const requiredIds = [
  "account-message", "auth-forms", "signed-in-panel", "login-form",
  "signup-form", "reset-form", "update-password-form", "google-signin",
  "logout-button", "sync-now", "show-login", "show-signup", "show-reset",
  "back-to-login", "account-name", "account-email"
];

for (const id of requiredIds) {
  assert.match(html, new RegExp('id="' + id + '"'), "Missing account UI element: #" + id);
  assert.ok(auth.includes('"' + "#" + id + '"'), "Auth code does not reference #" + id);
}

const authMethods = [
  "signInWithOAuth", "signInWithPassword", "signUp",
  "resetPasswordForEmail", "updateUser", "signOut",
  "onAuthStateChange", "getSession"
];
for (const method of authMethods) {
  assert.ok(auth.includes(method), "Missing auth flow: " + method);
}

assert.match(auth, /emailRedirectTo:\s*location\.origin\s*\+\s*"\/akun\.html\?verified=1"/);
assert.match(auth, /redirectTo:\s*location\.origin\s*\+\s*"\/akun\.html\?mode=update-password"/);
assert.match(auth, /params\.get\("mode"\)\s*===\s*"update-password"/);
assert.match(auth, /type=recovery/);
assert.match(client, /autoRefreshToken:\s*true/);
assert.match(client, /persistSession:\s*true/);
assert.match(client, /detectSessionInUrl:\s*true/);
assert.ok(!client.includes("service_role"), "Service-role credential must never appear in browser client");
assert.ok(!config.includes("service_role"), "Service-role credential must never appear in public config template");

console.log("Auth smoke checks passed: UI hooks, email redirects, recovery mode, session options, and public-key boundary.");
