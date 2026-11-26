import { supabase } from "./supabase-client.js";

const $ = (selector) => document.querySelector(selector);
const PAGE_SIZE = 20;
let userId = null;
let offset = 0;
let activeFilter = "all";
let allEntries = [];
let loading = false;

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[char]);

function formatDate(value) {
  if (!value) return "Tanggal tidak tersedia";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function render() {
  const visible = activeFilter === "all" ? allEntries : allEntries.filter((entry) => entry.activity_type === activeFilter);
  $("#historyList").innerHTML = visible.length ? visible.map((entry) => {
    const type = entry.activity_type === "tryout" ? "Tryout" : "Latihan";
    const score = Number(entry.score);
    return `<article class="history-item">
      <div><strong>${escapeHtml(entry.label || "Aktivitas SNBT")}</strong>
      <small>${type} · ${formatDate(entry.completed_at || entry.created_at)} · ${Number(entry.correct_count || 0)} benar dari ${Number(entry.total_count || 0)} soal</small></div>
      <div class="history-score">${Number.isFinite(score) ? score + "/100" : "—"}</div>
    </article>`;
  }).join("") : '<div class="history-empty">Belum ada aktivitas untuk filter ini. Yuk, mulai latihan pertamamu!</div>';
  $("#totalCount").textContent = allEntries.length;
  const scores = allEntries.map((entry) => Number(entry.score)).filter(Number.isFinite);
  $("#averageScore").textContent = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : "—";
  $("#bestScore").textContent = scores.length ? Math.max(...scores) : "—";
}

async function loadPage() {
  if (loading) return;
  loading = true;
  $("#loadMore").disabled = true;
  try {
    const { data, error } = await supabase.from("progress_entries")
      .select("id,activity_type,label,score,correct_count,total_count,completed_at,created_at")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const rows = data || [];
    allEntries = allEntries.concat(rows);
    offset += rows.length;
    render();
    $("#historyStatus").textContent = allEntries.length ? "Riwayat berhasil dimuat." : "Belum ada aktivitas belajar. Selesaikan latihan pertamamu untuk melihat progres di sini.";
    $("#loadMore").hidden = rows.length < PAGE_SIZE;
  } catch (error) {
    $("#historyStatus").textContent = "Riwayat belum dapat dimuat: " + error.message;
  } finally {
    loading = false;
    $("#loadMore").disabled = false;
  }
}

async function init() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    window.location.replace("login.html");
    return;
  }
  userId = user.id;
  await loadPage();
}

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    render();
  });
});
$("#loadMore").addEventListener("click", loadPage);
init();
