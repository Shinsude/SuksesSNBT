import { supabase } from "./supabase-client.js";

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[char]);

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium", timeStyle: "short"
  }).format(new Date(value));
}

async function initDashboard() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    window.location.replace("login.html");
    return;
  }

  const name = user.user_metadata?.full_name || user.user_metadata?.name ||
    user.email?.split("@")[0] || "Siswa";
  $("#studentName").textContent = name;
  $("#studentEmail").textContent = user.email || "";

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    display_name: name
  }, { onConflict: "id" });

  if (profileError) {
    $("#dashboardStatus").textContent =
      "Profil belum tersinkron: " + profileError.message;
  }

  const { data: entries, error } = await supabase
    .from("progress_entries")
    .select("activity_type,label,score,correct_count,wrong_count,blank_count,total_count,completed_at,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    $("#dashboardStatus").textContent =
      "Riwayat belum dapat dimuat: " + error.message;
    return;
  }

  const rows = entries || [];
  $("#activityCount").textContent = rows.length;
  const scored = rows.filter((row) => row.score !== null && row.score !== undefined && Number.isFinite(Number(row.score)));
  const average = scored.length
    ? Math.round(scored.reduce((sum, row) => sum + Number(row.score), 0) / scored.length)
    : 0;
  $("#averageScore").textContent = scored.length ? average : "—";

  if (!rows.length) {
    $("#progressList").innerHTML =
      '<div class="empty-state"><strong>Belum ada aktivitas belajar.</strong><p>Setelah fitur latihan terhubung, hasil latihan dan tryout kamu akan muncul di sini.</p><a class="btn btn--primary" href="materi.html">Mulai belajar</a></div>';
    return;
  }

  $("#progressList").innerHTML = rows.map((row) => `
    <article class="activity-item">
      <div>
        <strong>${escapeHtml(row.label || "Aktivitas SNBT")}</strong>
        <span>${row.activity_type === "tryout" ? "Tryout" : "Latihan"} · ${formatDate(row.completed_at || row.created_at)}</span>
      </div>
      <div class="activity-score">${row.score == null ? "—" : escapeHtml(row.score + "/100")}</div>
    </article>
  `).join("");
}

$("#signOut").addEventListener("click", async () => {
  $("#signOut").disabled = true;
  const { error } = await supabase.auth.signOut();
  if (error) {
    $("#dashboardStatus").textContent = "Gagal keluar: " + error.message;
    $("#signOut").disabled = false;
    return;
  }
  window.location.replace("login.html");
});

initDashboard();
