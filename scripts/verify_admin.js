"use strict";
const a=require("node:assert/strict"),f=require("node:fs");
const h=f.readFileSync("admin.html","utf8"),c=f.readFileSync("js/admin.js","utf8"),s=f.readFileSync("supabase/functions/admin-api/index.ts","utf8");
for(const v of ["overview","users","progress","materials","questions","settings","audit"]){a.ok(h.includes('data-view="'+v+'"'));a.ok(h.includes('id="'+v+'-view"'));}
a.match(c,/if \(allowed\) loadView\(name\)/);a.match(c,/auth\.getUser\(\)/);a.match(c,/bootstrap-owner/);a.match(c,/user-access-set/);
for(const [id,act] of [["material-form","material-save"],["bank-form","bank-save"],["question-form","question-save"],["setting-form","setting-save"]]){a.ok(h.includes('id="'+id+'"'));a.ok(c.includes('"'+act+'"'));}
for(const act of ["material-delete","bank-delete","question-delete","setting-delete","audit-logs","user-detail","progress","users"]){a.ok(c.includes('"'+act+'"'));a.ok(s.includes('"'+act+'"'));}
a.match(s,/auth\.getUser\(token\)/);a.match(s,/metadata\.role !== "admin" && metadata\.admin !== true/);a.doesNotMatch(s,/user_metadata\?\.role|user_metadata\.role/);a.match(s,/if \(!token\).*?401/s);a.match(s,/admin_audit_logs/);a.match(s,/auditResult\.error/);a.match(s,/rollback/i);a.match(s,/targetId === user\.id/);a.match(s,/targetId === "8b2a6f97-3b12-44a9-b1da-59c759a7de24"/);a.match(s,/new Set\(normalizedOptions\.map/);a.match(s,/answerExists/);a.match(s,/payload\.updated_by=user\.id/);
console.log("OK: seven Admin panels, CRUD wiring, authorization, validation and audit contracts.");
