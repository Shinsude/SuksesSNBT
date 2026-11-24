(() => {
  "use strict";
  document.addEventListener("DOMContentLoaded", async () => {
    const db = window.snbtSupabase;
    const adminFunction = location.hostname === "suksessnbt.vercel.app" ? "admin-api" : "admin-api-preview";
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
    let userSearchTimer = null;
    let progressSearchTimer = null;
    let contentState = { materials: [], banks: [], settings: [], questions: [] };

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
      const names = { overview: "Ringkasan", users: "Pengguna", progress: "Hasil belajar", materials: "Materi", questions: "Bank soal", settings: "Pengaturan", audit: "Keamanan & audit" };
      title.textContent = names[name] || names.overview;
      document.querySelectorAll(".view-panel").forEach((panel) => {
        panel.hidden = panel.id !== name + "-view";
      });
      document.querySelectorAll("[data-view]").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.view === name && button.closest(".admin-nav"));
      });
      if (allowed) loadView(name);
    };
    async function callAdmin(action, page = 1, extra = {}) {
      const { data, error } = await db.functions.invoke(adminFunction, {
        body: { action, page, ...extra }
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
        ["Rata-rata nilai", data.averageScore == null ? "—" : Math.round(data.averageScore), "Dari aktivitas tersimpan"],
        ["Aktif 30 hari", data.activeLast30Days || 0, "Aktivitas dalam 30 hari terakhir"]
      ].map(([label, value, caption]) => '<article class="metric-card"><span>' + escapeHtml(label) +
        '</span><strong>' + escapeHtml(typeof value === 'number' ? formatNumber(value) : value) + '</strong><small>' + escapeHtml(caption) +
        '</small></article>').join("");
      const recent = (data.recent || []).map((item) => [
        escapeHtml(item.display_name || item.user_id?.slice(0, 8) || "Pengguna"),
        escapeHtml(item.label || "Aktivitas SNBT"),
        '<span class="pill">' + escapeHtml(item.activity_type === "tryout" ? "Tryout" : "Latihan") + '</span>',
        escapeHtml(item.score ?? "—"),
        escapeHtml(formatDate(item.completed_at))
      ]);
      const analytics = document.querySelector("#activity-analytics");
      const breakdown = data.activityBreakdown || [];
      const maxCount = Math.max(1, ...breakdown.map((item) => item.count));
      analytics.innerHTML = breakdown.length ? breakdown.map((item) => '<div class="analytics-row"><div><strong>' + escapeHtml(item.type === "tryout" ? "Tryout" : item.type === "latihan" ? "Latihan" : item.type) + '</strong><span>' + formatNumber(item.count) + ' aktivitas</span></div><div class="analytics-track"><span style="width:' + Math.round(item.count / maxCount * 100) + '%"></span></div></div>').join("") : '<div class="empty-state">Belum ada data aktivitas.</div>';
      document.querySelector("#recent-progress").innerHTML = renderTable(
        ["Pengguna", "Aktivitas", "Jenis", "Nilai", "Waktu"], recent
      );
    }
    function exportCsv(headers, rows, filename) {
      const csvCell = (value) => {
        let text = String(value ?? "");
        if (text && ("=+@-".includes(text[0]) || text.charCodeAt(0) === 9 || text.charCodeAt(0) === 13)) text = "'" + text;
        return '"' + text.replace(/"/g, '""') + '"';
      };
      const csv = "\uFEFF" + [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showNotice("Seluruh data berhasil disiapkan dalam file CSV.", "success");
    }
    async function fetchAllPages(action) {
      const all = [];
      let page = 1;
      while (page <= 400) {
        const data = await callAdmin(action, page);
        all.push(...(action === "users" ? data.users || [] : data.entries || []));
        if (!data.hasMore) return all;
        page += 1;
      }
      throw new Error("Ekspor dihentikan karena melewati batas aman 10.000 baris.");
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
      let data = await callAdmin("users", usersPage);
      const search = (document.querySelector("#users-search")?.value || "").trim().toLocaleLowerCase("id");
      let users = data.users || [];
      if (search) {
        let page = usersPage + 1;
        while (data.hasMore && page <= 400) {
          data = await callAdmin("users", page);
          users.push(...(data.users || []));
          page += 1;
        }
      }
      const rows = users.map((user) => [
        escapeHtml(user.email || "—"),
        escapeHtml(user.display_name || "—"),
        escapeHtml(formatDate(user.created_at)),
        escapeHtml(formatDate(user.last_sign_in_at)),
        user.email_confirmed_at ? '<span class="pill">Terverifikasi</span>' : '<span class="pill">Belum verifikasi</span>',
        user.banned_until ? '<span class="pill pill-danger">Dinonaktifkan</span>' : '<span class="pill">Aktif</span>',
        '<button class="text-button" type="button" data-user-detail="' + escapeHtml(user.id) + '">Detail</button> ' +
        (user.is_owner ? '<span class="muted">Pemilik</span>' : '<button class="text-button ' + (user.banned_until ? '' : 'danger-text') + '" type="button" data-user-access="' + escapeHtml(user.id) + '" data-next-access="' + (user.banned_until ? 'enable' : 'disable') + '">' + (user.banned_until ? 'Aktifkan' : 'Nonaktifkan') + '</button>')
      ]);
      const filteredRows = rows.filter((row) => row.join(" ").toLocaleLowerCase("id").includes(search));
      document.querySelector("#users-table").innerHTML = renderTable(
        ["Email", "Nama", "Terdaftar", "Login terakhir", "Status email", "Akses akun", "Tindakan"], filteredRows
      );
      renderPager("users-pager", usersPage, search ? false : data.hasMore, () => loadUsers(usersPage - 1), () => loadUsers(usersPage + 1));
    }
    async function loadProgress(page = progressPage) {
      progressPage = Math.max(1, page);
      let data = await callAdmin("progress", progressPage);
      const search = (document.querySelector("#progress-search")?.value || "").trim().toLocaleLowerCase("id");
      let entries = data.entries || [];
      if (search) {
        let page = progressPage + 1;
        while (data.hasMore && page <= 400) {
          data = await callAdmin("progress", page);
          entries.push(...(data.entries || []));
          page += 1;
        }
      }
      const rows = entries.map((item) => [
        escapeHtml(item.display_name || item.user_id?.slice(0, 8) || "Pengguna"),
        escapeHtml(item.label || "Aktivitas SNBT"),
        '<span class="pill">' + escapeHtml(item.activity_type === "tryout" ? "Tryout" : "Latihan") + '</span>',
        escapeHtml(item.score ?? "—"),
        escapeHtml(item.correct_count ?? 0),
        escapeHtml(item.total_count ?? 0),
        escapeHtml(formatDate(item.completed_at))
      ]);
      const filteredRows = rows.filter((row) => row.join(" ").toLocaleLowerCase("id").includes(search));
      document.querySelector("#progress-table").innerHTML = renderTable(
        ["Pengguna", "Aktivitas", "Jenis", "Nilai", "Benar", "Total", "Waktu"], filteredRows
      );
      renderPager("progress-pager", progressPage, search ? false : data.hasMore, () => loadProgress(progressPage - 1), () => loadProgress(progressPage + 1));
    }

    const formObject = (form) => Object.fromEntries(new FormData(form).entries());
    const fillForm = (form, item, jsonFields = []) => {
      form.reset();
      Object.entries(item || {}).forEach(([key, value]) => {
        const field = form.elements.namedItem(key);
        if (field) field.value = jsonFields.includes(key) ? JSON.stringify(value, null, 2) : (value ?? "");
      });
    };
    async function loadContent() {
      const data = await callAdmin("content-list");
      contentState.materials = data.materials || [];
      contentState.banks = data.banks || [];
      contentState.settings = data.settings || [];
      document.querySelector("#materials-list").innerHTML = renderTable(
        ["Materi", "Kategori", "Status", "Diperbarui", "Aksi"],
        contentState.materials.map((item) => [
          escapeHtml(item.title), escapeHtml(item.category), escapeHtml(item.status),
          escapeHtml(formatDate(item.updated_at)),
          '<button class="text-button" type="button" data-edit-material="' + escapeHtml(item.id) + '">Edit</button> <button class="text-button danger-text" type="button" data-delete-material="' + escapeHtml(item.id) + '">Hapus</button>'
        ])
      );
      document.querySelector("#banks-list").innerHTML = renderTable(
        ["Bank soal", "Subtes", "Jumlah soal", "Status", "Aksi"],
        contentState.banks.map((item) => [
          escapeHtml(item.title), escapeHtml(item.subject),
          escapeHtml(item.questions?.[0]?.count ?? 0), escapeHtml(item.status),
          '<button class="text-button" type="button" data-edit-bank="' + escapeHtml(item.id) + '">Edit</button> <button class="text-button danger-text" type="button" data-delete-bank="' + escapeHtml(item.id) + '">Hapus</button>'
        ])
      );
      const select = document.querySelector("#question-bank-select");
      const current = select.value;
      select.innerHTML = '<option value="">Pilih bank soal…</option>' + contentState.banks.map((bank) =>
        '<option value="' + escapeHtml(bank.id) + '">' + escapeHtml(bank.title) + '</option>'
      ).join("");
      if (contentState.banks.some((bank) => bank.id === current)) select.value = current;
      await loadQuestions(select.value);
    }
    async function loadQuestions(bankId) {
      const target = document.querySelector("#questions-list");
      if (!bankId) {
        contentState.questions = [];
        target.innerHTML = '<div class="empty-state">Pilih bank soal untuk melihat pertanyaan.</div>';
        return;
      }
      const data = await callAdmin("questions-list", 1, { bank_id: bankId });
      contentState.questions = data.questions || [];
      target.innerHTML = renderTable(
        ["Pertanyaan", "Kesulitan", "Jawaban", "Aksi"],
        contentState.questions.map((item) => [
          escapeHtml(item.prompt.slice(0, 110)), escapeHtml(item.difficulty),
          escapeHtml(item.correct_answer),
          '<button class="text-button" type="button" data-edit-question="' + escapeHtml(item.id) + '">Edit</button> <button class="text-button danger-text" type="button" data-delete-question="' + escapeHtml(item.id) + '">Hapus</button>'
        ])
      );
    }
    async function loadAuditLogs(page = 1) {
      const data = await callAdmin("audit-logs", page);
      const rows = (data.logs || []).map((item) => [
        escapeHtml(formatDate(item.created_at)), escapeHtml(item.action),
        escapeHtml(item.resource_type), escapeHtml(item.resource_id || "—"),
        escapeHtml(item.actor_id?.slice(0, 8) || "—"),
        escapeHtml(JSON.stringify(item.after_data ?? item.before_data ?? {}).slice(0, 160))
      ]);
      document.querySelector("#audit-table").innerHTML = rows.length
        ? renderTable(["Waktu", "Aksi", "Jenis data", "ID data", "Admin", "Ringkasan perubahan"], rows)
        : '<div class="empty-state">Belum ada aktivitas perubahan yang tercatat. Log akan muncul otomatis setelah admin menambah, mengubah, atau menghapus materi, bank soal, pertanyaan, maupun pengaturan.</div>';
      renderPager("audit-pager", page, data.hasMore, () => loadAuditLogs(page - 1), () => loadAuditLogs(page + 1));
    }
    async function loadSettings() {
      const data = await callAdmin("content-list");
      contentState.settings = data.settings || [];
      document.querySelector("#settings-list").innerHTML = renderTable(
        ["Kunci", "Deskripsi", "Nilai", "Diperbarui", "Aksi"],
        contentState.settings.map((item) => [
          escapeHtml(item.key), escapeHtml(item.description),
          escapeHtml(JSON.stringify(item.value)), escapeHtml(formatDate(item.updated_at)),
          '<button class="text-button" type="button" data-edit-setting="' + escapeHtml(item.key) + '">Edit</button> <button class="text-button danger-text" type="button" data-delete-setting="' + escapeHtml(item.key) + '">Hapus</button>'
        ])
      );
    }
    async function saveForm(form, action, transform = (value) => value) {
      const raw = formObject(form);
      const item = transform(raw);
      const result = await callAdmin(action, 1, { item });
      showNotice("Data berhasil disimpan.", "success");
      form.reset();
      if (activeView === "materials" || activeView === "questions") await loadContent();
      if (activeView === "settings") await loadSettings();
      return result.item;
    }
    async function handleContentClick(event) {
      const button = event.target.closest("button");
      if (!button) return;
      const actions = [
        ["edit-material", "materials", "#material-form"],
        ["edit-bank", "banks", "#bank-form"],
        ["edit-question", "questions", "#question-form"],
        ["edit-setting", "settings", "#setting-form"]
      ];
      for (const [action, collection, selector] of actions) {
        const id = button.dataset[action];
        if (!id) continue;
        const item = contentState[collection].find((entry) => (entry.id || entry.key) === id);
        if (item) {
          fillForm(document.querySelector(selector), item, collection === "questions" || collection === "settings" ? ["options", "value"] : []);
          if (collection === "settings") document.querySelector(selector).elements.namedItem("original_key").value = item.key;
          document.querySelector(selector).closest("details")?.setAttribute("open", "");
        }
        return;
      }
      const deletes = [
        ["delete-material", "material-delete", "materi"],
        ["delete-bank", "bank-delete", "bank soal"],
        ["delete-question", "question-delete", "soal"],
        ["delete-setting", "setting-delete", "pengaturan"]
      ];
      for (const [datasetKey, action, label] of deletes) {
        const id = button.dataset[datasetKey];
        if (!id) continue;
        if (!window.confirm("Hapus " + label + "? Tindakan ini tidak dapat dibatalkan.")) return;
        await callAdmin(action, 1, action === "setting-delete" ? { key: id } : { id });
        showNotice(label.charAt(0).toUpperCase() + label.slice(1) + " berhasil dihapus.", "success");
        if (activeView === "materials" || activeView === "questions") await loadContent();
        if (activeView === "settings") await loadSettings();
        return;
      }
    }


    async function showUserDetail(userId) {
      showNotice("Memuat detail pengguna…");
      const data = await callAdmin("user-detail", 1, { user_id: userId });
      const panel = document.querySelector("#user-detail-panel");
      panel.hidden = false;
      document.querySelector("#user-detail-title").textContent = data.profile?.display_name || "Detail pengguna";
      document.querySelector("#user-detail-summary").innerHTML = [
        ["Aktivitas tersimpan", data.activityCount],
        ["Rata-rata nilai", data.averageScore == null ? "—" : Math.round(data.averageScore)],
        ["Profil dibuat", formatDate(data.profile?.created_at)]
      ].map(([label, value]) => '<article class="metric-card"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(typeof value === "number" ? formatNumber(value) : value) + '</strong></article>').join("");
      document.querySelector("#user-detail-activities").innerHTML = renderTable(
        ["Aktivitas", "Jenis", "Nilai", "Benar", "Salah", "Kosong", "Total", "Waktu"],
        (data.activities || []).map((item) => [
          escapeHtml(item.label || "Aktivitas SNBT"),
          escapeHtml(item.activity_type || "—"),
          escapeHtml(item.score ?? "—"),
          escapeHtml(item.correct_count ?? 0),
          escapeHtml(item.wrong_count ?? 0),
          escapeHtml(item.blank_count ?? 0),
          escapeHtml(item.total_count ?? 0),
          escapeHtml(formatDate(item.completed_at))
        ])
      );
      showNotice("Detail pengguna berhasil dimuat.", "success");
    }

    async function loadView(name) {
      showNotice("Memuat data panel…");
      try {
        if (name === "overview") await loadOverview();
        if (name === "users") await loadUsers();
        if (name === "progress") await loadProgress();
        if (name === "materials" || name === "questions") await loadContent();
        if (name === "settings") await loadSettings();
        if (name === "audit") await loadAuditLogs();
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
      const { data: bootstrap, error: bootstrapError } = await db.functions.invoke(adminFunction, {
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
    const loginLink = document.querySelector(".admin-login-link");
    if (loginLink) loginLink.hidden = true;
    notice.hidden = true;
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", () => setView(button.dataset.view));
    });
    refresh.addEventListener("click", () => loadView(activeView));
    document.querySelector("#users-table").addEventListener("click", async (event) => {
      const detail = event.target.closest("[data-user-detail]");
      if (detail) { showUserDetail(detail.dataset.userDetail).catch((error) => showNotice(error.message, "error")); return; }
      const access = event.target.closest("[data-user-access]");
      if (!access) return;
      const disable = access.dataset.nextAccess === "disable";
      const confirmed = window.confirm(disable
        ? "Nonaktifkan akun ini? Pengguna tidak dapat masuk sampai akun diaktifkan kembali."
        : "Aktifkan kembali akun ini?");
      if (!confirmed) return;
      access.disabled = true;
      try {
        await callAdmin("user-access-set", 1, { user_id: access.dataset.userAccess, enabled: !disable });
        showNotice(disable ? "Akun berhasil dinonaktifkan." : "Akun berhasil diaktifkan kembali.", "success");
        await loadUsers(usersPage);
        await loadAuditLogs();
      } catch (error) { showNotice(error.message, "error"); access.disabled = false; }
    });
    document.querySelector("#close-user-detail").addEventListener("click", () => { document.querySelector("#user-detail-panel").hidden = true; });
    document.querySelector("#materials-view").addEventListener("click", (event) => handleContentClick(event).catch((error) => showNotice(error.message, "error")));
    document.querySelector("#questions-view").addEventListener("click", (event) => handleContentClick(event).catch((error) => showNotice(error.message, "error")));
    document.querySelector("#settings-view").addEventListener("click", (event) => handleContentClick(event).catch((error) => showNotice(error.message, "error")));
    document.querySelector("#refresh-audit-button").addEventListener("click", () => loadAuditLogs().catch((error) => showNotice(error.message, "error")));
    document.querySelector("#question-bank-select").addEventListener("change", (event) => loadQuestions(event.target.value).catch((error) => showNotice(error.message, "error")));
    document.querySelector("#material-form").addEventListener("submit", (event) => { event.preventDefault(); saveForm(event.currentTarget, "material-save", (v) => ({ ...v, sort_order: Number(v.sort_order) || 0 })).catch((error) => showNotice(error.message, "error")); });
    document.querySelector("#bank-form").addEventListener("submit", (event) => { event.preventDefault(); saveForm(event.currentTarget, "bank-save").catch((error) => showNotice(error.message, "error")); });
    document.querySelector("#question-form").addEventListener("submit", (event) => { event.preventDefault(); try { const v = formObject(event.currentTarget); v.bank_id = document.querySelector("#question-bank-select").value; v.options = JSON.parse(v.options); v.sort_order = Number(v.sort_order) || 0; saveForm(event.currentTarget, "question-save", () => v).catch((error) => showNotice(error.message, "error")); } catch (error) { showNotice("Format opsi harus berupa JSON array yang valid.", "error"); } });
    document.querySelector("#setting-form").addEventListener("submit", (event) => { event.preventDefault(); try { const v = formObject(event.currentTarget); v.value = JSON.parse(v.value); saveForm(event.currentTarget, "setting-save", () => v).catch((error) => showNotice(error.message, "error")); } catch (error) { showNotice("Nilai pengaturan harus berupa JSON yang valid.", "error"); } });
    document.querySelector("#users-search").addEventListener("input", () => {
      window.clearTimeout(userSearchTimer);
      userSearchTimer = window.setTimeout(() => loadUsers(1).catch((error) => showNotice(error.message, "error")), 250);
    });
    document.querySelector("#progress-search").addEventListener("input", () => {
      window.clearTimeout(progressSearchTimer);
      progressSearchTimer = window.setTimeout(() => loadProgress(1).catch((error) => showNotice(error.message, "error")), 250);
    });
    document.querySelector("#export-users-button").addEventListener("click", async () => {
      try {
        showNotice("Menyiapkan seluruh data pengguna…");
        const users = await fetchAllPages("users");
        exportCsv(["Email","Nama","Terdaftar","Login terakhir","Status email","Akses akun"],
          users.map((user) => [user.email || "",user.display_name || "",formatDate(user.created_at),formatDate(user.last_sign_in_at),user.email_confirmed_at ? "Terverifikasi" : "Belum verifikasi",user.banned_until ? "Dinonaktifkan" : "Aktif"]),
          "snbt-seluruh-pengguna.csv");
      } catch (error) { showNotice(error.message, "error"); }
    });
    document.querySelector("#export-progress-button").addEventListener("click", async () => {
      try {
        showNotice("Menyiapkan seluruh hasil belajar…");
        const entries = await fetchAllPages("progress");
        exportCsv(["Pengguna","Aktivitas","Jenis","Nilai","Benar","Total","Waktu"],
          entries.map((item) => [item.display_name || item.user_id || "",item.label || "Aktivitas SNBT",item.activity_type || "",item.score ?? "",item.correct_count ?? 0,item.total_count ?? 0,formatDate(item.completed_at)]),
          "snbt-seluruh-hasil-belajar.csv");
      } catch (error) { showNotice(error.message, "error"); }
    });
    logout.addEventListener("click", async () => {
      logout.disabled = true;
      const result = await db.auth.signOut();
      location.href = "akun.html";
      if (result.error) logout.disabled = false;
    });
    setView("overview");
  });
})();