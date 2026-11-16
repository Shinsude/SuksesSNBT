(() => {
  "use strict";

  const KEY = "snbt-progress-history";
  const OWNER_KEY = "snbt-progress-owner";
  const ARCHIVE_PREFIX = KEY + ":";
  const db = () => window.snbtSupabase || null;
  const makeId = () => window.crypto && window.crypto.randomUUID
    ? window.crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        return (c === "x" ? r : (r & 3 | 8)).toString(16);
      });

  function readStored(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value)
        ? value.filter((item) => item && Number.isFinite(Number(item.score)))
        : [];
    } catch (_) {
      return [];
    }
  }

  function readLocal() {
    return readStored(KEY);
  }

  function writeStored(key, items) {
    try {
      localStorage.setItem(key, JSON.stringify(items.slice(0, 50)));
      return true;
    } catch (_) {
      return false;
    }
  }

  function writeLocal(items) {
    return writeStored(KEY, items);
  }

  function ensureIds(items) {
    let changed = false;
    items.forEach((item) => {
      if (!item.clientId) {
        item.clientId = makeId();
        changed = true;
      }
    });
    if (changed) writeLocal(items);
    return items;
  }

  function toRow(item, userId) {
    return {
      user_id: userId,
      client_id: item.clientId,
      activity_type: item.type === "tryout" ? "tryout" : "latihan",
      label: String(item.label || "Aktivitas SNBT").slice(0, 160),
      score: Math.max(0, Math.min(100, Math.round(Number(item.score) || 0))),
      correct_count: Math.max(0, Number(item.correct) || 0),
      wrong_count: Math.max(0, Number(item.wrong) || 0),
      blank_count: Math.max(0, Number(item.blank) || 0),
      total_count: Math.max(0, Number(item.total) || 0),
      completed_at: item.completedAt || new Date().toISOString(),
      details: {
        subtest: item.subtest || item.details?.subtest || null,
        subtestScores: item.subtestScores || item.details?.subtestScores || null
      }
    };
  }

  function fromRow(row) {
    return {
      clientId: row.client_id,
      type: row.activity_type,
      label: row.label,
      score: row.score,
      correct: row.correct_count,
      wrong: row.wrong_count,
      blank: row.blank_count,
      total: row.total_count,
      completedAt: row.completed_at,
      subtest: row.details && row.details.subtest || null,
      subtestScores: row.details && row.details.subtestScores || null
    };
  }

  function mergeEntries(remote, local) {
    const merged = new Map();
    [...remote, ...local].forEach((item) => {
      const key = item.clientId || [item.completedAt, item.type, item.label, item.score].join("|");
      if (!merged.has(key)) merged.set(key, item);
    });
    return [...merged.values()]
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 50);
  }

  function prepareLocalForUser(userId) {
    const previousOwner = localStorage.getItem(OWNER_KEY);
    if (previousOwner === userId) return;

    const currentCache = readLocal();
    if (previousOwner && currentCache.length) {
      const previousArchiveKey = ARCHIVE_PREFIX + previousOwner;
      writeStored(previousArchiveKey, mergeEntries(readStored(previousArchiveKey), currentCache));
    }

    // Restore this user's own archive. Unowned local work can be adopted on first sign-in.
    const ownArchive = readStored(ARCHIVE_PREFIX + userId);
    const restored = previousOwner ? ownArchive : mergeEntries(ownArchive, currentCache);
    writeLocal(restored);
    localStorage.setItem(OWNER_KEY, userId);
  }

  async function sync() {
    const client = db();
    if (!client) return { synced: false, reason: "client-unavailable" };

    const sessionResult = await client.auth.getSession();
    const user = sessionResult.data && sessionResult.data.session && sessionResult.data.session.user;
    if (sessionResult.error || !user) return { synced: false, reason: "signed-out" };

    prepareLocalForUser(user.id);
    const local = ensureIds(readLocal());

    if (local.length) {
      const saved = await client.from("progress_entries")
        .upsert(local.map((item) => toRow(item, user.id)), { onConflict: "user_id,client_id" });
      if (saved.error) {
        window.dispatchEvent(new CustomEvent("snbt-sync-status", {
          detail: { state: "error", message: saved.error.message }
        }));
        return { synced: false, reason: saved.error.message };
      }
    }

    const result = await client.from("progress_entries")
      .select("client_id,activity_type,label,score,correct_count,wrong_count,blank_count,total_count,completed_at,details")
      .order("completed_at", { ascending: false })
      .limit(50);

    if (result.error) {
      window.dispatchEvent(new CustomEvent("snbt-sync-status", {
        detail: { state: "error", message: result.error.message }
      }));
      return { synced: false, reason: result.error.message };
    }

    const entries = mergeEntries((result.data || []).map(fromRow), local);
    if (!writeLocal(entries)) {
      window.dispatchEvent(new CustomEvent("snbt-sync-status", {
        detail: { state: "error", message: "Penyimpanan lokal tidak tersedia." }
      }));
      return { synced: false, reason: "local-storage-unavailable" };
    }

    localStorage.setItem(OWNER_KEY, user.id);
    try { localStorage.removeItem(ARCHIVE_PREFIX + user.id); } catch (_) {}
    window.dispatchEvent(new CustomEvent("snbt-progress-updated"));
    window.dispatchEvent(new CustomEvent("snbt-sync-status", { detail: { state: "synced" } }));
    return { synced: true, count: entries.length };
  }

  async function save(entry) {
    const client = db();
    if (client) {
      const sessionResult = await client.auth.getSession();
      const user = sessionResult.data && sessionResult.data.session && sessionResult.data.session.user;
      if (user) prepareLocalForUser(user.id);
    }
    const items = ensureIds(readLocal());
    const existing = items.find((item) =>
      item.completedAt === entry.completedAt &&
      item.type === entry.type &&
      item.label === entry.label &&
      Number(item.score) === Number(entry.score)
    );
    if (existing) Object.assign(existing, entry);
    else items.unshift({ ...entry, clientId: makeId() });
    writeLocal(items);
    window.dispatchEvent(new CustomEvent("snbt-progress-updated"));
    return sync();
  }

  window.SNBTProgressSync = { sync, save, readLocal };

  if (db()) {
    db().auth.onAuthStateChange((event, session) => {
      if (session && session.user) {
        prepareLocalForUser(session.user.id);
        queueMicrotask(() => sync());
      }
      // Archive the signed-in user's cache before clearing the active browser view.
      // Pending offline entries remain recoverable, while the next signed-out user
      // starts with an unowned local cache rather than inheriting the previous account.
      if (event === "SIGNED_OUT") {
        const owner = localStorage.getItem(OWNER_KEY);
        if (owner) {
          const archiveKey = ARCHIVE_PREFIX + owner;
          const currentCache = readLocal();
          if (currentCache.length) {
            writeStored(archiveKey, mergeEntries(readStored(archiveKey), currentCache));
          }
          try {
            localStorage.removeItem(KEY);
            localStorage.removeItem(OWNER_KEY);
          } catch (_) {}
        }
        window.dispatchEvent(new CustomEvent("snbt-progress-updated"));
      }
    });
  }
})();
