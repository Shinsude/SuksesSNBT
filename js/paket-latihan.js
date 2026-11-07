(() => {
  const list = document.querySelector("#package-list");
  const count = document.querySelector("#package-count");
  const params = new URLSearchParams(window.location.search);
  const selectedSubtest = (params.get("subtest") || "PU").toUpperCase();
  const packages = Array.isArray(window.latihanPackages) ? window.latihanPackages : [];
  const filteredPackages = packages.filter((item) => item.subtest === selectedSubtest);

  if (!list || !count) return;

  count.textContent = `${filteredPackages.length} paket`;

  if (!filteredPackages.length) {
    list.innerHTML = '<p class="package-empty">Paket untuk subtes ini belum tersedia.</p>';
    return;
  }

  list.innerHTML = filteredPackages.map((item) => {
    const available = item.status === "available" && item.isAvailable;
    const statusLabel = available ? "Tersedia" : "Dalam Persiapan";
    const action = available
      ? `<a class="btn btn--primary" href="latihan-paket.html?paket=${encodeURIComponent(item.id)}">Mulai Paket</a>`
      : '<span class="package-card__disabled" aria-disabled="true">Dalam Persiapan</span>';

    return `
      <article class="package-card ${available ? "package-card--available" : ""}">
        <div class="package-card__top">
          <span class="eyebrow">${item.subtest}</span>
          <span class="package-status ${available ? "package-status--available" : "package-status--preparation"}">${statusLabel}</span>
        </div>
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <div class="package-card__meta">
          <span>${item.difficulty}</span>
          <span>${item.questionIds.length} soal</span>
        </div>
        ${action}
      </article>`;
  }).join("");
})();
