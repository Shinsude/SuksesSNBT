document.addEventListener("DOMContentLoaded", () => {
  const header = document.getElementById("header");
  const navToggle = document.getElementById("navToggle");
  const nav = document.getElementById("nav");

  const setMenuState = (open) => {
    nav.classList.toggle("nav--open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
  };

  if (navToggle && nav) {
    nav.setAttribute("aria-label", "Navigasi utama");
    navToggle.setAttribute("aria-controls", nav.id);

    navToggle.addEventListener("click", () => {
      setMenuState(!nav.classList.contains("nav--open"));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        setMenuState(false);
      });
    });

    const closeMenuOnEscape = (event) => {
      const key = String(event.key || event.code || "").toLowerCase();
      if ((key === "escape" || key === "esc") && nav.classList.contains("nav--open")) {
        event.preventDefault();
        nav.classList.remove("nav--open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Buka menu");
        navToggle.focus();
      }
    };

    navToggle.addEventListener("keydown", closeMenuOnEscape);
    navToggle.addEventListener("keyup", closeMenuOnEscape);
    window.addEventListener("keydown", closeMenuOnEscape, true);
    window.addEventListener("keyup", closeMenuOnEscape, true);
    navToggle.onkeydown = (event) => {
      if (event.key === "Escape" && nav.classList.contains("nav--open")) {
        event.preventDefault();
        nav.classList.remove("nav--open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Buka menu");
        navToggle.focus();
      }
    };
  }

  const mainContent = document.querySelector("main, .hero");
  if (mainContent && !mainContent.id) {
    mainContent.id = "main-content";
  }

  if (!document.querySelector(".skip-link") && mainContent) {
    const skipLink = document.createElement("a");
    skipLink.className = "skip-link";
    skipLink.href = `#${mainContent.id}`;
    skipLink.textContent = "Lewati ke konten utama";
    document.body.prepend(skipLink);
  }

  const onScroll = () => {
    if (header) {
      header.classList.toggle("header--scrolled", window.scrollY > 10);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (!document.querySelector('link[rel="manifest"]')) {
    const manifestLink = document.createElement("link");
    manifestLink.rel = "manifest";
    manifestLink.href = "/manifest.webmanifest";
    document.head.appendChild(manifestLink);
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js", { scope: "/" }).catch(() => {
      // Offline support remains optional when the preview runs without a secure origin.
    });
  }

  const revealTargets = document.querySelectorAll(
    ".card-subtes, .feature, .section__head"
  );
  revealTargets.forEach((el) => el.classList.add("reveal"));

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealTargets.forEach((el) => observer.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }
});
