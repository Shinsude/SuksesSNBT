(() => {
  const list = document.querySelector("#package-list");
  const count = document.querySelector("#package-count");
  const params = new URLSearchParams(window.location.search);
  const selectedSubtest = (params.get("subtest") || "PU").toUpperCase();
  const packages = Array.isArray(window.latihanPackages) ? window.latihanPackages : [];
  const filteredPackages = packages.filter((item) => item.subtest === selectedSubtest);

  if (!list || !count) return;

  count.textContent = `${filteredPackages.length} paket`;
  if (filteredPackages[0]) {
    const heading = document.querySelector(".page-intro .eyebrow");
    const packageHeading = document.querySelector("#package-title");
    if (heading) heading.textContent = filteredPackages[0].subject || filteredPackages[0].subtest;
    if (packageHeading) packageHeading.textContent = `Paket ${filteredPackages[0].subtest}`;
  }

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


  // Published database banks are fetched from the server; answer keys are never sent in the catalog.
  (async () => {
    const section = document.querySelector("#published-bank-section");
    const bankList = document.querySelector("#published-bank-list");
    const bankCount = document.querySelector("#published-bank-count");
    const config = window.SNBT_SUPABASE_CONFIG || {};
    if (!section || !bankList || !config.url || !config.publishableKey) return;
    try {
      const response = await fetch(config.url.replace(/\/$/, "") + "/functions/v1/student-practice-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: config.publishableKey },
        body: JSON.stringify({ action: "catalog" })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Bank soal belum dapat dimuat.");
      const banks = (result.banks || []).filter((bank) => Number(bank.question_count) > 0);
      if (!banks.length) return;
      section.hidden = false;
      bankCount.textContent = banks.length + " bank tersedia";
      bankList.replaceChildren();
      banks.forEach((bank) => {
        const article = document.createElement("article");
        article.className = "package-card package-card--available";
        const eyebrow = document.createElement("span");
        eyebrow.className = "eyebrow";
        eyebrow.textContent = bank.subject || "SNBT";
        const title = document.createElement("h3");
        title.textContent = bank.title;
        const description = document.createElement("p");
        description.textContent = bank.description || "Latihan soal dari bank soal SNBT.";
        const meta = document.createElement("div");
        meta.className = "package-card__meta";
        const count = document.createElement("span");
        count.textContent = bank.question_count + " soal";
        meta.append(count);
        const link = document.createElement("a");
        link.className = "btn btn--primary";
        link.href = "latihan-paket.html?bank=" + encodeURIComponent(bank.id);
        link.textContent = "Mulai Latihan";
        article.append(eyebrow, title, description, meta, link);
        bankList.append(article);
      });
    } catch (error) {
      console.warn("Published question bank catalog unavailable.", error);
    }
  })();
