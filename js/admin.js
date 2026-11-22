(() => {
  "use strict";
  document.addEventListener("DOMContentLoaded", async () => {
    const db = window.snbtSupabase;
    const notice = document.querySelector("#admin-notice");
    const content = document.querySelector("#admin-content");
    const title = document.querySelector("#page-title");
    const email = document.querySelector("#admin-email");
    const refresh = document.querySelector("#refresh-button");
    const logout = document.querySelector("#logout-button");
    let activeView = "overview";
    let allowed = false;
    let usersPage = 1;
    let progressPage = 1;
    const pageSize = 25;

    const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
    const formatDate = (value) => value ? new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium", timeStyle: "short"
    }).format(new Date(value)) : "—";
    const formatNumber = (value) => new Intl.NumberFormat("id-ID").format(Number(value) || 0);
    const showNotice = (message, state = "info") => {
      notice.textContent = message;
      notice.dataset.state = state;
      notice.hidden = false;
    };
    const setView = (name) => {
      activeView = name;
      const names = { overview: "Ringkasan", users: "Pengguna", progress: "Hasil belajar" };
      title.textContent = names[name] || names.overview;
      document.querySelectorAll(".view-panel").forEach((panel) => {
        panel.hidden = panel.id !== name + "-view";
      });
      document.querySelectorAll("[data-view]").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.view === name && button.closest(".admin-nav"));
      });
      if (allowed) loadView(name);
    };
    async function callAdmin(action, page = 1) {
      const { data, error } = await db.functions.invoke("admin-api", {
        body: { action, page }
      });
      if (error) throw new Error(error.message || "Permintaan admin gagal.");
      if (!data || data.error) throw new Error(data?.error || "Respons server tidak valid.");
      return data;
    }
    function renderTable(headers, rows) {
      if (!rows.length) return '<div class="empty-state">Belum ada data yang dapat ditampilkan.</div>';
      return '<div class="table-wrap"><table><thead><tr>' +
        headers.map((header) => '<th>' + escapeHtml(header) + '</th>').join("") +
        '</tr></thead><tbody>' + rows.map((row) => '<tr>' +
        row.map((cell) => '<td>' + cell + '</td>').join("") +
        '</tr>').join("") + '</tbody></table></div>';
    }
    async function loadOverview() {
      const data = await callAdmin("overview");
      document.querySelector("#metric-grid").innerHTML = [
        ["Akun terdaftar", data.userCount, "Profil yang tersimpan"],
        ["Aktivitas belajar", data.progressCount, "Latihan dan tryout tersinkron"],
        ["Rata-rata nilai", data.averageScore == null ? "—" : Math.round(data.averageScore), "Dari aktivitas tersimpan"]
      ].map(([label, value, caption]) => '<article class="metric-card"><span>' + escapeHtml(label) +
        '</span><strong>' + escapeHtml(formatNumber(value)) + '</strong><small>' + escapeHtml(caption) +
        '</small></article>').join("");
      const recent = (data.recent || []).map((item) => [
        escapeHtml(item.display_name || item.user_id?.slice(0, 8) || "Pengguna"),
        escapeHtml(item.label || "Aktivitas SNBT"),
        '<span class="pill">' + escapeHtml(item.activity_type === "tryout" ? "Tryout" : "Latihan") + '</span>',
        escapeHtml(item.score ?? "—"),
        escapeHtml(formatDate(item.completed_at))
      ]);
      document.querySelector("#recent-progress").innerHTML = renderTable(
        ["Pengguna", "Aktivitas", "Jenis", "Nilai", "Waktu"], recent
      );
    }
    function renderPager(containerId, page, hasNext, onPrevious, onNext) {
      const container = document.querySelector("#" + containerId);
      if (!container) return;
      container.innerHTML = '<div class="table-pager"><button class="button button-light" type="button" data-page="previous"' +
        (page <= 1 ? " disabled" : "") + '>Sebelumnya</button><span>Halaman ' + page +
        '</span><button class="button button-light" type="button" data-page="next"' +
        (!hasNext ? " disabled" : "") + '>Berikutnya</button></div>';
      container.querySelector('[data-page="previous"]').addEventListener("click", onPrevious);
      container.querySelector('[data-page="next"]').addEventListener("click", onNext);
    }
    async function loadUsers(page = usersPage) {
      usersPage = Math.max(1, page);
      const data = await callAdmin("users", usersPage);
      const rows = (data.users || []).map((user) => [
        escapeHtml(user.email || "—"),
        escapeHtml(user.display_name || "—"),
        escapeHtml(formatDate(user.created_at)),
        escapeHtml(formatDate(user.last_sign_in_at)),
        user.email_confirmed_at ? '<span class="pill">Terverifikasi</span>' : '<span class="pill">Belum verifikasi</span>'
      ]);
      document.querySelector("#users-table").innerHTML = renderTable(
        ["Email", "Nama", "Terdaftar", "Login terakhir", "Status email"], rows
      );
      renderPager("users-pager", usersPage, data.hasMore, () => loadUsers(usersPage - 1), () => loadUsers(usersPage + 1));
    }
    async function loadProgress(page = progressPage) {
      progressPage = Math.max(1, page);
      const data = await callAdmin("progress", progressPage);
      const rows = (data.entries || []).map((item) => [
        escapeHtml(item.display_name || item.user_id?.slice(0, 8) || "Pengguna"),
        escapeHtml(item.label || "Aktivitas SNBT"),
        '<span class="pill">' + escapeHtml(item.activity_type === "tryout" ? "Tryout" : "Latihan") + '</span>',
        escapeHtml(item.score ?? "—"),
        escapeHtml(item.correct_count ?? 0),
        escapeHtml(item.total_count ?? 0),
        escapeHtml(formatDate(item.completed_at))
      ]);
      document.querySelector("#progress-table").innerHTML = renderTable(
        ["Pengguna", "Aktivitas", "Jenis", "Nilai", "Benar", "Total", "Waktu"], rows
      );
      renderPager("progress-pager", progressPage, data.hasMore, () => loadProgress(progressPage - 1), () => loadProgress(progressPage + 1));
    }
    async function loadView(name) {
      showNotice("Memuat data panel…");
      try {
        if (name === "overview") await loadOverview();
        if (name === "users") await loadUsers();
        if (name === "progress") await loadProgress();
        showNotice("Data berhasil dimuat.", "success");
      } catch (error) {
        showNotice(error.message || "Data belum dapat dimuat.", "error");
      }
    }

    if (!db) {
      showNotice("Layanan akun belum siap. Muat ulang halaman atau kembali ke halaman akun.", "error");
      return;
    }
    const { data, error } = await db.auth.getUser();
    let user = data?.user;
    if (error || !user) {
      showNotice("Silakan masuk terlebih dahulu menggunakan akun Sukses SNBT.", "error");
      return;
    }
    if (
      user.id === "8b2a6f97-3b12-44a9-b1da-59c759a7de24" &&
      String(user.email || "").toLowerCase() === "alfachriansyah@gmail.com" &&
      user.app_metadata?.role !== "admin" &&
      user.app_metadata?.admin !== true &&
      user.app_metadata?.snbt_admin_bootstrap_claimed !== true
    ) {
      showNotice("Mengaktifkan hak administrator untuk akun pemilik…");
      const { data: bootstrap, error: bootstrapError } = await db.functions.invoke("admin-api", {
        body: { action: "bootstrap-owner" }
      });
      if (bootstrapError || !bootstrap || bootstrap.error) {
        showNotice(bootstrap?.error || bootstrapError?.message || "Aktivasi admin belum berhasil.", "error");
        return;
      }
      const { data: refreshed, error: refreshError } = await db.auth.refreshSession();
      if (refreshError || !refreshed?.user) {
        showNotice("Hak admin sudah diproses. Muat ulang halaman untuk memperbarui sesi.", "error");
        return;
      }
      user = refreshed.user;
    }
    email.textContent = user.email || "";
    const metadata = user.app_metadata || {};
    allowed = metadata.role === "admin" || metadata.admin === true;
    if (!allowed) {
      showNotice("Akun ini belum memiliki hak akses administrator. Panel hanya dapat dibuka oleh akun yang ditetapkan sebagai admin.", "error");
      return;
    }
    content.hidden = false;
    notice.hidden = true;
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", () => setView(button.dataset.view));
    });
    refresh.addEventListener("click", () => loadView(activeView));
    logout.addEventListener("click", async () => {
      logout.disabled = true;
      const result = await db.auth.signOut();
      location.href = "akun.html";
      if (result.error) logout.disabled = false;
    });
    setView("overview");
  });
})();