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

function loadQuestionBank(context) {
  vm.createContext(context);
  for (const file of ["data/latihan-pu.js", "data/latihan-snbt.js", "data/paket-latihan.js"]) {
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
  const context = { window, document, Math, Date, URLSearchParams, localStorage: { getItem() { return "[]"; }, setItem() {} } };
  loadQuestionBank(context);
  assert.equal(window.latihanQuestions.length, 70, "tryout source bank must contain 70 questions");
  vm.runInContext(fs.readFileSync("js/tryout.js", "utf8"), context, { filename: "js/tryout.js" });
  document.querySelector("#start-tryout").handlers.click();
  const navMarkup = document.querySelector("#question-nav-list").innerHTML;
  assert.equal((navMarkup.match(/data-question-index=/g) || []).length, 70, "tryout must render 70 navigation buttons");
  assert.equal(document.querySelector("#question-counter").textContent, "Soal 1 dari 70");
}

{
  const document = documentStub();
  const window = {
    latihanPUQuestions: [],
    latihanQuestions: [],
    location: { search: "?paket=ppu-dasar-1" }
  };
  const context = { window, document, Math, Date, URLSearchParams, localStorage: { getItem() { return "[]"; }, setItem() {} } };
  loadQuestionBank(context);
  vm.runInContext(fs.readFileSync("js/latihan-paket.js", "utf8"), context, { filename: "js/latihan-paket.js" });
  assert.equal(document.querySelector("#runner").hidden, false, "PPU package must open");
  assert.equal(document.querySelector("#invalid-package").hidden, true, "PPU package must not be marked unavailable");
  assert.match(document.querySelector("#question-title").textContent, /respons positif/, "PPU package must load a PPU question");
  assert.equal((document.querySelector("#answer-list").innerHTML.match(/class="answer-option"/g) || []).length, 4, "practice question must render four options");
}

console.log("OK: tryout renders 70 questions and a non-PU package opens with four answer options.");
