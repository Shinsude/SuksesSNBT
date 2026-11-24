(() => {
  "use strict";
  document.addEventListener("DOMContentLoaded", async () => {
    const root = document.querySelector("#published-material-list");
    const status = document.querySelector("#published-material-status");
    if (!root || !status) return;
    const db = window.snbtSupabase;
    const setStatus = (message, state = "info") => {
      status.textContent = message;
      status.dataset.state = state;
    };
    if (!db) {
      setStatus("Layanan materi belum tersedia. Silakan muat ulang halaman beberapa saat lagi.", "error");
      return;
    }
    try {
      const { data, error } = await db.from("learning_materials")
        .select("id,title,description,category,content,updated_at")
        .eq("status", "published")
        .order("sort_order", { ascending: true })
        .order("updated_at", { ascending: false });
      if (error) throw error;
      root.replaceChildren();
      if (!data || !data.length) {
        setStatus("Belum ada materi tambahan yang diterbitkan. Materi utama per subtes tetap bisa dipelajari melalui halaman Materi.", "empty");
        return;
      }
      data.forEach((item) => {
        const article = document.createElement("article");
        article.className = "pertemuan-card published-material-card";
        const body = document.createElement("div");
        body.className = "pertemuan-card__body";
        const meta = document.createElement("span");
        meta.className = "pertemuan-card__meta";
        meta.textContent = item.category || "Materi tambahan";
        const heading = document.createElement("h2");
        heading.className = "pertemuan-card__title";
        heading.textContent = item.title;
        const description = document.createElement("p");
        description.className = "pertemuan-card__desc";
        description.textContent = item.description || "Materi pembelajaran Sukses SNBT.";
        const content = document.createElement("div");
        content.className = "published-material-content";
        content.hidden = true;
        content.textContent = item.content || "Belum ada isi materi.";
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "button button-light";
        toggle.textContent = "Baca materi";
        toggle.setAttribute("aria-expanded", "false");
        toggle.addEventListener("click", () => {
          const opening = content.hidden;
          content.hidden = !opening;
          toggle.textContent = opening ? "Tutup materi" : "Baca materi";
          toggle.setAttribute("aria-expanded", String(opening));
        });
        body.append(meta, heading, description, toggle, content);
        article.append(body);
        root.append(article);
      });
      setStatus(data.length + " materi tambahan tersedia.", "success");
    } catch (error) {
      console.error("Published materials could not be loaded:", error);
      setStatus("Materi belum dapat dimuat. Silakan coba lagi beberapa saat.", "error");
    }
  });
})();