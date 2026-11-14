(() => {
  const key = "snbt-progress-history";
  const list = document.querySelector("#progress-history-list");
  const total = document.querySelector("#progress-total");
  const average = document.querySelector("#progress-average");
  const latest = document.querySelector("#progress-latest");
  const subtestGrid = document.querySelector("#subtest-progress-grid");
  const trendList = document.querySelector("#progress-trend-list");
  const clear = document.querySelector("#clear-progress");
  if (!list || !total || !average || !latest) return;

  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value.filter(item => item && Number.isFinite(Number(item.score))) : [];
    } catch (_) { return []; }
  }
  function subtestOf(item) {
    const code = item.subtest || item.details?.subtest || "";
    if (code && code !== "ALL") return code;
    const label = String(item.label || "");
    return ["PU","PPU","PBM","PK","PENMAT","PenMat","LI","LE"].find(code => label.toUpperCase().startsWith(code.toUpperCase())) || "";
  }
  function renderSubtests(history) {
    if (!subtestGrid) return;
    const groups = new Map();
    history.forEach(item => {
      const code = subtestOf(item);
      if (code) {
        if (!groups.has(code)) groups.set(code, []);
        groups.get(code).push(Number(item.score));
      }
      const breakdown = item.subtestScores || item.details?.subtestScores;
      if (breakdown && typeof breakdown === "object") {
        Object.entries(breakdown).forEach(([subtest, score]) => {
          const numericScore = Number(score);
          if (!Number.isFinite(numericScore)) return;
          if (!groups.has(subtest)) groups.set(subtest, []);
          groups.get(subtest).push(numericScore);
        });
      }
    });
    const names = {pu:"Penalaran Umum",ppu:"Pengetahuan dan Pemahaman Umum",pbm:"Pemahaman Bacaan dan Menulis",pk:"Pengetahuan Kuantitatif",pm:"Penalaran Matematika",li:"Literasi Bahasa Indonesia",le:"Literasi Bahasa Inggris",PU:"Penalaran Umum",PPU:"Pengetahuan dan Pemahaman Umum",PBM:"Pemahaman Bacaan dan Menulis",PK:"Pengetahuan Kuantitatif",PENMAT:"Penalaran Matematika",PenMat:"Penalaran Matematika",LI:"Literasi Bahasa Indonesia",LE:"Literasi Bahasa Inggris"};
    subtestGrid.replaceChildren();
    if (!groups.size) {
      const empty = document.createElement("p");
      empty.className = "progress-empty";
      empty.textContent = "Selesaikan paket latihan untuk melihat rata-rata setiap subtes.";
      subtestGrid.append(empty);
      return;
    }
    groups.forEach((scores, code) => {
      const mean = Math.max(0, Math.min(100, Math.round(scores.reduce((sum,value)=>sum+value,0)/scores.length)));
      const card = document.createElement("article");
      card.className = "progress-subtest-card";
      const head = document.createElement("div");
      head.className = "progress-subtest-card__head";
      const name = document.createElement("span");
      name.textContent = names[code] || String(code).slice(0,24);
      const score = document.createElement("strong");
      score.textContent = mean + "/100";
      head.append(name, score);
      const bar = document.createElement("div");
      bar.className = "progress-subtest-card__bar";
      const fill = document.createElement("div");
      fill.className = "progress-subtest-card__fill";
      fill.style.width = mean + "%";
      bar.append(fill);
      const note = document.createElement("small");
      note.textContent = scores.length + " sesi latihan";
      card.append(head, bar, note);
      subtestGrid.append(card);
    });
  }
  function renderTrend(history) {
    if (!trendList) return;
    trendList.replaceChildren();
    const recent = [...history].filter(item => Number.isFinite(Number(item.score)))
      .sort((a,b) => new Date(a.completedAt || 0) - new Date(b.completedAt || 0)).slice(-7);
    if (!recent.length) {
      const empty = document.createElement("p");
      empty.className = "progress-empty";
      empty.textContent = "Selesaikan latihan atau tryout untuk mulai melihat perkembangan nilai.";
      trendList.append(empty);
      return;
    }
    recent.forEach((item, index) => {
      const score = Math.max(0, Math.min(100, Number(item.score)));
      const row = document.createElement("div");
      row.className = "progress-trend-row";
      const label = document.createElement("div");
      label.className = "progress-trend-row__label";
      const name = document.createElement("span");
      name.textContent = item.label || (item.type === "tryout" ? "Simulasi tryout" : "Latihan");
      const date = document.createElement("small");
      date.textContent = item.completedAt ? new Date(item.completedAt).toLocaleDateString("id-ID", {day:"numeric",month:"short"}) : "Tanggal tidak tersedia";
      label.append(name,date);
      const track = document.createElement("div");
      track.className = "progress-trend-row__track";
      track.setAttribute("role","img");
      track.setAttribute("aria-label", "Nilai " + Math.round(score) + " dari 100");
      const fill = document.createElement("div");
      fill.className = "progress-trend-row__fill";
      fill.style.width = score + "%";
      track.append(fill);
      const value = document.createElement("strong");
      value.textContent = Math.round(score);
      row.append(label,track,value);
      trendList.append(row);
    });
  }
  function render() {
    const history = window.SNBTProgressSync ? window.SNBTProgressSync.readLocal() : read();
    total.textContent = String(history.length);
    average.textContent = history.length ? String(Math.round(history.reduce((sum,item)=>sum+Number(item.score),0)/history.length)) : "—";
    latest.textContent = history.length ? new Date(history[0].completedAt).toLocaleDateString("id-ID") : "—";
    renderSubtests(history);
    renderTrend(history);
    list.replaceChildren();
    if (!history.length) {
      const empty = document.createElement("p"); empty.className = "progress-empty";
      empty.textContent = "Belum ada hasil tersimpan. Selesaikan latihan atau tryout untuk melihat progres di sini.";
      list.append(empty); return;
    }
    history.forEach(item => {
      const entry = document.createElement("article"); entry.className = "progress-entry";
      const details = document.createElement("div");
      const title = document.createElement("strong"); title.textContent = item.label || (item.type === "tryout" ? "Simulasi Tryout" : "Latihan SNBT");
      const meta = document.createElement("p");
      const date = item.completedAt ? new Date(item.completedAt).toLocaleString("id-ID") : "Tanggal tidak tersedia";
      meta.textContent = date + " · " + (item.correct||0) + " benar · " + (item.wrong||0) + " salah · " + (item.blank||0) + " kosong";
      details.append(title,meta);
      const score = document.createElement("strong"); score.textContent = Number(item.score) + " / 100";
      entry.append(details,score); list.append(entry);
    });
  }
  if (clear) clear.addEventListener("click",()=>{
    if (!window.confirm("Hapus seluruh riwayat progres di perangkat ini?")) return;
    try { localStorage.removeItem(key); } catch (_) {}
    render();
  });
  window.addEventListener("snbt-progress-updated",render);
  window.addEventListener("snbt-sync-status",event=>{
    const note=document.querySelector("#progress-note"); if(!note)return;
    if(event.detail?.state==="synced")note.textContent="Progres tersinkron ke akun Supabase.";
    else if(event.detail?.state==="error")note.textContent="Sinkronisasi belum berhasil. Riwayat lokal tetap tersedia.";
  });
  render();
})();