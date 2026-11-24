#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");

const api = fs.readFileSync("supabase/functions/student-practice-preview/index.ts", "utf8");
const catalog = fs.readFileSync("js/paket-latihan.js", "utf8");
const runner = fs.readFileSync("js/latihan-paket.js", "utf8");

assert.match(api, /eq\("status", "published"\)/, "only published banks may be queried");
assert.match(api, /select\("id,title,subject,description"\)/, "catalog must return metadata only");
assert.match(api, /select\("id,bank_id,prompt,options,difficulty,sort_order"\)/, "question payload must omit answer keys");
assert.doesNotMatch(api, /select\("id,bank_id,prompt,options,correct_answer/, "question payload must never select correct_answer");
assert.match(api, /action === "check-answer"/, "server must provide answer checking");
assert.match(api, /select\("id,options,correct_answer,explanation"\)/, "answer key may only be selected for answer checking");
assert.match(api, /eq\("id", clean\(body.question_id, 64\)\)\.eq\("bank_id", bankId\)/, "answer checking must scope question to the requested bank");
assert.match(catalog, /action: "catalog"/, "student catalog must call the practice API");
assert.match(runner, /action: "question"/, "database practice must load questions from the API");
assert.match(runner, /action: "check-answer"/, "database practice must check answers through the API");
assert.doesNotMatch(runner, /question\.correct_answer|question\.answer/, "browser must not compare answer keys locally");

console.log("OK: published-only question banks; no answer keys in student question payload; server-side answer validation and bank scoping.");
