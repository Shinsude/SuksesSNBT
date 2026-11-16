#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const store = new Map();
const localStorage = {
  getItem(key) { return store.has(key) ? store.get(key) : null; },
  setItem(key, value) { store.set(key, String(value)); },
  removeItem(key) { store.delete(key); }
};
const uploads = [];
const remoteByUser = { A: [], B: [] };
let currentUser = { id: "A" };
let authListener;
let failNextUpload = false;

const client = {
  auth: {
    async getSession() { return { data: { session: currentUser ? { user: currentUser } : null }, error: null }; },
    onAuthStateChange(callback) { authListener = callback; }
  },
  from() {
    return {
      async upsert(rows) {
        uploads.push({ userId: currentUser.id, rows: structuredClone(rows) });
        if (failNextUpload) {
          failNextUpload = false;
          return { error: { message: "offline" } };
        }
        remoteByUser[currentUser.id] = [
          ...remoteByUser[currentUser.id].filter((old) => !rows.some((row) => row.client_id === old.client_id)),
          ...structuredClone(rows)
        ];
        return { error: null };
      },
      select() {
        return {
          order() {
            return {
              async limit() { return { data: structuredClone(remoteByUser[currentUser.id] || []), error: null }; }
            };
          }
        };
      }
    };
  }
};

const events = [];
const window = {
  snbtSupabase: client,
  crypto: { randomUUID: (() => { let i = 0; return () => "client-" + (++i); })() },
  dispatchEvent(event) { events.push(event.type); }
};
class CustomEvent { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } }
vm.runInNewContext(fs.readFileSync("js/progress-sync.js", "utf8"), {
  window, localStorage, CustomEvent, queueMicrotask, Date, Math, Map, Number, String, Object, Array, JSON
});

const recordA = {
  clientId: "a-progress", type: "latihan", label: "Riwayat Akun A",
  score: 80, correct: 8, wrong: 2, blank: 0, total: 10,
  completedAt: "2026-11-16T08:00:00.000Z"
};
localStorage.setItem("snbt-progress-history", JSON.stringify([recordA]));
localStorage.setItem("snbt-progress-owner", "A");

(async () => {
  let result = await window.SNBTProgressSync.sync();
  assert.equal(result.synced, true);
  assert.equal(uploads.at(-1).userId, "A");

  currentUser = null;
  authListener("SIGNED_OUT", null);
  assert.equal(JSON.parse(localStorage.getItem("snbt-progress-history")).length, 1,
    "sign-out must preserve local progress");

  currentUser = { id: "B" };
  result = await window.SNBTProgressSync.sync();
  assert.equal(result.synced, true);
  assert.equal(uploads.at(-1).userId, "B");
  assert.ok(!uploads.at(-1).rows.some((row) => row.label === "Riwayat Akun A"),
    "account A progress must never upload to account B");
  assert.ok(localStorage.getItem("snbt-progress-history:A"),
    "account A progress must be archived separately");

  const recordB = {
    type: "latihan", label: "Riwayat Akun B", score: 90, correct: 9,
    wrong: 1, blank: 0, total: 10, completedAt: "2026-11-16T09:00:00.000Z"
  };
  await window.SNBTProgressSync.save(recordB);
  assert.equal(localStorage.getItem("snbt-progress-owner"), "B");
  assert.ok(window.SNBTProgressSync.readLocal().some((item) => item.label === "Riwayat Akun B"));

  currentUser = { id: "A" };
  result = await window.SNBTProgressSync.sync();
  assert.equal(result.synced, true);
  assert.ok(uploads.at(-1).rows.some((row) => row.label === "Riwayat Akun A"),
    "account A's archived progress must restore to account A");
  assert.ok(!uploads.at(-1).rows.some((row) => row.label === "Riwayat Akun B"),
    "account B progress must never upload to account A");

  const before = window.SNBTProgressSync.readLocal().length;
  failNextUpload = true;
  await window.SNBTProgressSync.save({
    type: "tryout", label: "Pending Offline", score: 70, correct: 49,
    wrong: 14, blank: 7, total: 70, completedAt: "2026-11-16T10:00:00.000Z"
  });
  assert.ok(window.SNBTProgressSync.readLocal().length >= before,
    "offline failure must not delete locally saved progress");

  console.log("OK: sign-out persistence, account isolation, per-account restore, and offline retention.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
