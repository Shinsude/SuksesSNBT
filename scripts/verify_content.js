#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const context = { window: {} };
vm.createContext(context);
for (const file of ["data/latihan-pu.js", "data/latihan-snbt.js", "data/paket-latihan.js"]) {
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
}

const { latihanQuestions, latihanPackages } = context.window;

// Guard the two interactive runners against accidentally reading only the PU seed bank.
for (const file of ["js/tryout.js", "js/latihan-paket.js"]) {
  const source = fs.readFileSync(file, "utf8");
  assert.match(
    source,
    /const questions = Array\.isArray\(window\.latihanQuestions\) \? window\.latihanQuestions : \[\];/,
    file + " must consume the complete seven-subtest question bank"
  );
}

assert.ok(Array.isArray(latihanQuestions), "question bank must be an array");
assert.equal(latihanQuestions.length, 70, "expected 70 original practice questions");
assert.equal(new Set(latihanQuestions.map(q => q.id)).size, 70, "question IDs must be unique");

const expectedPrefixes = ["pu", "ppu", "pbm", "pk", "pm", "li", "le"];
for (const prefix of expectedPrefixes) {
  const group = latihanQuestions.filter(q => q.id.startsWith(prefix + "-"));
  assert.equal(group.length, 10, prefix + " must contain 10 questions");
}
for (const question of latihanQuestions) {
  assert.ok(question.question && question.topic && question.subtest, question.id + " must have question metadata");
  assert.equal(question.options.length, 4, question.id + " must have four options");
  assert.equal(new Set(question.options.map(option => option.id)).size, 4, question.id + " options must be unique");
  assert.ok(question.options.some(option => option.id === question.answer), question.id + " answer must exist in options");
  assert.ok(question.explanation && question.explanation.summary && question.explanation.correct, question.id + " must include an explanation");
  assert.ok(!Object.hasOwn(question.explanation.incorrect, question.answer), question.id + " must not mark the correct answer as incorrect");
}
assert.equal(latihanPackages.length, 7, "expected one package for each subtest");
for (const practicePackage of latihanPackages) {
  assert.equal(practicePackage.questionIds.length, 10, practicePackage.id + " must contain 10 questions");
  assert.equal(practicePackage.isAvailable, true, practicePackage.id + " must resolve every question");
}
console.log("OK: 70 questions, 7 subtests, 7 complete packages, answer keys and explanations.");
