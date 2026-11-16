#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function element(selector) {
  const handlers = {};
  return {
    selector,
    handlers,
    innerHTML: "",
    textContent: "",
    hidden: false,
    disabled: false,
    classList: { add() {} },
    style: {},
    addEventListener(name, callback) { handlers[name] = callback; },
    focus() {},
    querySelector() { return element(selector + " child"); },
    querySelectorAll() { return []; }
  };
}

function documentStub() {
  const elements = new Map();
  return {
    title: "",
    elements,
    querySelector(selector) {
      if (!elements.has(selector)) {
        const created = element(selector);
        if (selector === "#invalid-package" || selector === "#runner") created.hidden = true;
        elements.set(selector, created);
      }
      return elements.get(selector);
    }
  };
}

function loadQuestionBank(context, includeAdvanced = false) {
  vm.createContext(context);
  const files = ["data/latihan-pu.js", "data/latihan-snbt.js"];
  if (includeAdvanced) files.push("data/latihan-lanjutan.js");
  files.push("data/paket-latihan.js");
  for (const file of files) {
    vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
  }
}

{
  const document = documentStub();
  const window = {
    latihanPUQuestions: [],
    latihanQuestions: [],
    setInterval() { return 1; },
    clearInterval() {},
    location: { reload() {} }
  };
  const context = { window, document, Math, Date, URLSearchParams, setInterval() { return 1; }, clearInterval() {}, localStorage: { getItem() { return "[]"; }, setItem() {} } };
  loadQuestionBank(context);
  assert.equal(window.latihanQuestions.length, 70, "tryout source bank must contain 70 questions");
  vm.runInContext(fs.readFileSync("js/tryout.js", "utf8"), context, { filename: "js/tryout.js" });
  document.querySelector("#start-tryout").handlers.click();
  const navMarkup = document.querySelector("#question-nav-list").innerHTML;
  assert.equal((navMarkup.match(/data-question-index=/g) || []).length, 70, "tryout must render 70 navigation buttons");
  assert.equal(document.querySelector("#question-counter").textContent, "Soal 1 dari 70");
}

for (const packageId of [
  "pu-dasar-1", "ppu-dasar-1", "pbm-dasar-1", "pk-dasar-1",
  "penmat-dasar-1", "li-dasar-1", "le-dasar-1",
  "pu-pendalaman-1", "ppu-pendalaman-1", "pbm-pendalaman-1", "pk-pendalaman-1",
  "penmat-pendalaman-1", "li-pendalaman-1", "le-pendalaman-1"
]) {
  const document = documentStub();
  const window = {
    latihanPUQuestions: [],
    latihanQuestions: [],
    location: { search: `?paket=${packageId}` }
  };
  const context = { window, document, Math, Date, URLSearchParams, localStorage: { getItem() { return "[]"; }, setItem() {} } };
  loadQuestionBank(context, packageId.includes("pendalaman"));
  vm.runInContext(fs.readFileSync("js/latihan-paket.js", "utf8"), context, { filename: "js/latihan-paket.js" });
  assert.equal(document.querySelector("#runner").hidden, false, packageId + " must open");
  assert.equal(document.querySelector("#invalid-package").hidden, true, packageId + " must not be marked unavailable");
  assert.ok(document.querySelector("#question-title").textContent.length > 0, packageId + " must load its first question");
  assert.equal((document.querySelector("#answer-list").innerHTML.match(/class="answer-option"/g) || []).length, 4, packageId + " question must render four options");
}

console.log("OK: tryout renders 70 questions and all fourteen basic and advanced subtest packages open with four answer options.");
